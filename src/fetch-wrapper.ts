import { encode as base64Encode } from './base64';
import OAuthError from './error';
import { AccessTokenRequest, OAuth2Options, Token } from './types';
import { objToQueryString } from './util';

export default class OAuth2 {

  options: OAuth2Options;
  token: Token;

  constructor(options: OAuth2Options) {

    this.options = options;
    this.token = {
      accessToken: options.accessToken || '',
      // If there was an accessToken we want to mark it as _not_ expired.
      // If there wasn't an access token we pretend it immediately expired.
      expiresAt: options.accessToken ? null : 0,
      refreshToken: options.refreshToken || null
    };

  }

  /**
   * Does a fetch request and adds a Bearer / access token.
   *
   * If the access token is not known, this function attempts to fetch it
   * first. If the access token is almost expiring, this function might attempt
   * to refresh it.
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {

    // input might be a string or a Request object, we want to make sure this
    // is always a fully-formed Request object.
    const request = new Request(input, init);

    let accessToken = await this.getAccessToken();

    let response = await requestWithBearerToken(request.clone(), accessToken);

    if (!response.ok && response.status === 401) {

      accessToken = await this.refreshToken();

      // We will try one more time
      response = await requestWithBearerToken(request, accessToken);

    }
    return response;

  }

  /**
   * This function allows the fetch-mw to be called as more traditional
   * middleware.
   *
   * The function takes a Request object, and a next() function that
   * represents the next 'fetch' function in the chain.
   */
  async fetchMw(request: Request, next: (request: Request) => Promise<Response>): Promise<Response> {

    let accessToken = await this.getAccessToken();

    let authenticatedRequest = request.clone();
    authenticatedRequest.headers.set('Authorization', 'Bearer '  + accessToken);
    let response = await next(authenticatedRequest);

    if (!response.ok && response.status === 401) {

      accessToken = await this.refreshToken();

      authenticatedRequest = request.clone();
      authenticatedRequest.headers.set('Authorization', 'Bearer '  + accessToken);
      response = await next(authenticatedRequest);

    }
    return response;

  }

  /**
   * After authenticating, this functions returns a set of options that may be
   * used when authenticating the next time.
   *
   * You might for example want to store this in LocalStorage, allowing your
   * application to remember any refresh / access tokens for next time.
   *
   * The result of this function can be used as the constructor argument for
   * this object.
   */
  async getOptions(): Promise<OAuth2Options> {

    const token = await this.getToken();

    return {
      clientId: this.options.clientId,
      grantType: undefined,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken || undefined,
      tokenEndpoint: this.options.tokenEndpoint,
    };

  }

  /**
   * Returns current token information.
   *
   * There result object will have:
   *   * accessToken
   *   * expiresAt - when the token expires, or null.
   *   * refreshToken - may be null
   */
  async getToken(): Promise<Token> {

    /**
     * We're running this function to make sure we get up-to-date information
     */
    await this.getAccessToken();
    return this.token;

  }

  /**
   * Returns an access token.
   *
   * If the current access token is not known, it will attempt to fetch it.
   * If the access token is expiring, it will attempt to refresh it.
   */
  async getAccessToken(): Promise<string> {

    if (this.token.expiresAt === null || this.token.expiresAt > Date.now()) {

      // The current token is still valid
      return this.token.accessToken;

    }

    return this.refreshToken();

  }

  /**
   * Forces an access token refresh
   */
  async refreshToken(): Promise<string> {

    // The request body for the OAuth2 token endpoint
    let body: AccessTokenRequest;

    const previousToken = this.token;

    if (previousToken.refreshToken) {
      body = {
        grant_type: 'refresh_token',
        refresh_token: previousToken.refreshToken
      };
      if (!this.options.clientSecret) {
        // If there is no secret, it means we need to send the clientId along
        // in the body.
        body.client_id = this.options.clientId;
      }

    } else {

      switch (this.options.grantType) {

        case 'client_credentials':
          body = {
            grant_type: 'client_credentials',
          };
          if (this.options.scope) {
            body.scope = this.options.scope.join(' ');
          }
          break;
        case 'password':
          body = {
            grant_type: 'password',
            username: this.options.userName,
            password: this.options.password,
          };
          if (this.options.scope) {
            body.scope = this.options.scope.join(' ');
          }
          break;
        case 'authorization_code' :
          body = {
            grant_type: 'authorization_code',
            code: this.options.code,
            redirect_uri: this.options.redirectUri,
            client_id: this.options.clientId,
          };
          break;
        default :
          throw new Error('Unknown grantType: ' + this.options.grantType);
      }

    }

    const headers: {[s: string]: string} = {
      'Content-Type'  : 'application/x-www-form-urlencoded',
    };

    // @ts-ignore typescript doesn't like this but its the easiest way to do this.
    if (this.options.clientSecret !== undefined) {
      const basicAuthStr = base64Encode(this.options.clientId + ':' + this.options.clientSecret);
      headers.Authorization = 'Basic ' + basicAuthStr;
    }

    const authResult = await fetch(this.options.tokenEndpoint, {
      method: 'POST',
      headers,
      body: objToQueryString(body),
    });

    const jsonResult = await authResult.json();

    if (!authResult.ok) {

      // If we failed with a refresh_token grant_type, we're going to make one
      // more attempt doing a full re-auth
      if (body.grant_type === 'refresh_token' && this.options.grantType) {
        // Wiping out all old token info
        this.token = {
          accessToken: '',
          expiresAt: 0,
          refreshToken: null,
        };
        return this.getAccessToken();

      }

      let errorMessage = 'OAuth2 error ' + jsonResult.error + '.';
      if (jsonResult.error_description) {
        errorMessage += ' ' + jsonResult.error_description;
      }
      throw new OAuthError(errorMessage, jsonResult.error, 401);
    }

    this.token = {
      accessToken: jsonResult.access_token,
      expiresAt: jsonResult.expires_in ? Date.now() + (jsonResult.expires_in * 1000) : null,
      refreshToken: jsonResult.refresh_token ? jsonResult.refresh_token : null,
    };
    if (this.options.onTokenUpdate) {
      this.options.onTokenUpdate(this.token);
    }

    return this.token.accessToken;

  }

}

async function requestWithBearerToken(request: Request, accessToken: string) {

  request.headers.set('Authorization', 'Bearer '  + accessToken);
  return await fetch(request);

}
