import { encode as base64Encode } from './base64';
import OAuthError from './error';
import {
  AccessTokenRequest,
  OAuth2Options as Options,
  OAuth2Token as Token
} from './types';
import { objToQueryString } from './util';

export default class OAuth2 {

  options: Options;
  token: Token;

  constructor(options: Options & Partial<Token>, token?: Token) {

    if (!options.grantType && !token && !options.accessToken) {
      throw new Error('If no grantType is specified, a token must be provided');
    }
    this.options = options;

    // Backwards compatibility
    if (options.accessToken) {
      // eslint-disable-next-line no-console
      console.warn(
        '[fetch-mw-oauth2] Specifying accessToken via the options argument ' +
        'in the constructor of OAuth2 is deprecated. Please supply the ' +
        'options in the second argument. Backwards compatability will be ' +
        'removed in a future version of this library');
      token = {
        accessToken: options.accessToken,
        refreshToken: options.refreshToken || null,
        expiresAt: null,
      };
    }


    this.token = token || {
      accessToken: '',
      expiresAt: null,
      refreshToken: null
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

    return this.fetchMw(
      request,
      req => fetch(req)
    );

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
      if ((this.options as any).clientSecret === undefined) {
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
            code_verifier: this.options.codeVerifier,
          };
          break;
        default :
          if (typeof this.options.grantType === 'string') {
            throw new Error('Unknown grantType: ' + this.options.grantType);
          } else {
            throw new Error('Cannot obtain an access token if no "grantType" is specified');
          }
          break;
      }

    }

    const headers: {[s: string]: string} = {
      'Content-Type'  : 'application/x-www-form-urlencoded',
    };

    if ((this.options as any).clientSecret !== undefined) {
      const basicAuthStr = base64Encode(this.options.clientId + ':' + (this.options as any).clientSecret);
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
