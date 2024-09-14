import { OAuth2Token } from './token';
import {
  AuthorizationCodeRequest,
  ClientCredentialsRequest,
  IntrospectionRequest,
  IntrospectionResponse,
  PasswordRequest,
  OAuth2TokenTypeHint,
  RefreshRequest,
  RevocationRequest,
  ServerMetadataResponse,
  TokenResponse,
} from './messages';
import { OAuth2HttpError } from './error';
import { OAuth2AuthorizationCodeClient } from './client/authorization-code';


type ClientCredentialsParams = {
  scope?: string[];
  extraParams?: Record<string, string>;

  /**
   * The resource  the client intends to access.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8707
   */
  resource?: string | string[];
}

type PasswordParams = {
  username: string;
  password: string;

  scope?: string[];

  /**
   * The resource  the client intends to access.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8707
   */
  resource?: string | string[];

}

/**
 * Extra options that may be passed to refresh()
 */
type RefreshParams = {
  scope?: string[];

  /**
   * The resource  the client intends to access.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8707
   */
  resource?: string | string[];

}

export interface ClientSettings {

  /**
   * The hostname of the OAuth2 server.
   * If provided, we'll attempt to discover all the other related endpoints.
   *
   * If this is not desired, just specify the other endpoints manually.
   *
   * This url will also be used as the base URL for all other urls. This lets
   * you specify all the other urls as relative.
   */
  server?: string;

  /**
   * OAuth2 clientId
   */
  clientId: string;

  /**
   * OAuth2 clientSecret
   *
   * This is required when using the 'client_secret_basic' authenticationMethod
   * for the client_credentials and password flows, but not authorization_code
   * or implicit.
   */
  clientSecret?: string;

  /**
   * The /authorize endpoint.
   *
   * Required only for the browser-portion of the authorization_code flow.
   */
  authorizationEndpoint?: string;

  /**
   * The token endpoint.
   *
   * Required for most grant types and refreshing tokens.
   */
  tokenEndpoint?: string;

  /**
   * Introspection endpoint.
   *
   * Required for, well, introspecting tokens.
   * If not provided we'll try to discover it, or otherwise default to /introspect
   */
  introspectionEndpoint?: string;

  /**
   * Revocation endpoint.
   *
   * Required for revoking tokens. Not supported by all servers.
   * If not provided we'll try to discover it, or otherwise default to /revoke
   */
  revocationEndpoint?: string;

  /**
   * OAuth 2.0 Authorization Server Metadata endpoint or OpenID
   * Connect Discovery 1.0 endpoint.
   *
   * If this endpoint is provided it can be used to automatically figure
   * out all the other endpoints.
   *
   * Usually the URL for this is: https://server/.well-known/oauth-authorization-server
   */
  discoveryEndpoint?: string;

  /**
   * Fetch implementation to use.
   *
   * Set this if you wish to explicitly set the fetch implementation, e.g. to
   * implement middlewares or set custom headers.
   */
  fetch?: typeof fetch;

  /**
   * Client authentication method that is used to authenticate
   * when using the token endpoint.
   *
   * Can be one of 'client_secret_basic' | 'client_secret_post'.
   *
   * The default value is 'client_secret_basic' if not provided.
   */
  authenticationMethod?: string;
}


type OAuth2Endpoint = 'tokenEndpoint' | 'authorizationEndpoint' | 'discoveryEndpoint' | 'introspectionEndpoint' | 'revocationEndpoint';

export class OAuth2Client {

  settings: ClientSettings;

  constructor(clientSettings: ClientSettings) {

    if (!clientSettings?.fetch) {
      clientSettings.fetch = fetch.bind(globalThis);
    }
    this.settings = clientSettings;

  }

  /**
   * Refreshes an existing token, and returns a new one.
   */
  async refreshToken(token: OAuth2Token, params?: RefreshParams): Promise<OAuth2Token> {

    if (!token.refreshToken) {
      throw new Error('This token didn\'t have a refreshToken. It\'s not possible to refresh this');
    }

    const body: RefreshRequest = {
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    };
    if (!this.settings.clientSecret) {
      // If there's no secret, send the clientId in the body.
      body.client_id = this.settings.clientId;
    }

    if (params?.scope) body.scope = params.scope.join(' ');
    if (params?.resource) body.resource = params.resource;

    const newToken = await this.tokenResponseToOAuth2Token(this.request('tokenEndpoint', body));
    if (!newToken.refreshToken && token.refreshToken) {
      // Reuse old refresh token if we didn't get a new one.
      newToken.refreshToken = token.refreshToken;
    }
    return newToken;

  }

  /**
   * Retrieves an OAuth2 token using the client_credentials grant.
   */
  async clientCredentials(params?: ClientCredentialsParams): Promise<OAuth2Token> {

    const disallowed = ['client_id', 'client_secret', 'grant_type', 'scope'];

    if (params?.extraParams && Object.keys(params.extraParams).filter((key) => disallowed.includes(key)).length > 0) {
      throw new Error(`The following extraParams are disallowed: '${disallowed.join("', '")}'`);
    }

    const body: ClientCredentialsRequest = {
      grant_type: 'client_credentials',
      scope: params?.scope?.join(' '),
      resource: params?.resource,
      ...params?.extraParams
    };

    if (!this.settings.clientSecret) {
      throw new Error('A clientSecret must be provided to use client_credentials');
    }

    return this.tokenResponseToOAuth2Token(this.request('tokenEndpoint', body));

  }

  /**
   * Retrieves an OAuth2 token using the 'password' grant'.
   */
  async password(params: PasswordParams): Promise<OAuth2Token> {

    const body: PasswordRequest = {
      grant_type: 'password',
      ...params,
      scope: params.scope?.join(' '),
    };
    return this.tokenResponseToOAuth2Token(this.request('tokenEndpoint', body));

  }

  /**
   * Returns the helper object for the `authorization_code` grant.
   */
  get authorizationCode(): OAuth2AuthorizationCodeClient {

    return new OAuth2AuthorizationCodeClient(
      this,
    );

  }

  /**
   * Introspect a token
   *
   * This will give information about the validity, owner, which client
   * created the token and more.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc7662
   */
  async introspect(token: OAuth2Token): Promise<IntrospectionResponse> {

    const body: IntrospectionRequest = {
      token: token.accessToken,
      token_type_hint: 'access_token',
    };
    return this.request('introspectionEndpoint', body);

  }

  /**
   * Revoke a token
   *
   * This will revoke a token, provided that the server supports this feature.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc7009
   */
  async revoke(token: OAuth2Token, tokenTypeHint: OAuth2TokenTypeHint = 'access_token'): Promise<void> {
    let tokenValue = token.accessToken;
    if (tokenTypeHint === 'refresh_token') {
      tokenValue = token.refreshToken!;
    }

    const body: RevocationRequest = {
      token: tokenValue,
      token_type_hint: tokenTypeHint,
    };
    return this.request('revocationEndpoint', body);

  }

  /**
   * Returns a url for an OAuth2 endpoint.
   *
   * Potentially fetches a discovery document to get it.
   */
  async getEndpoint(endpoint: OAuth2Endpoint): Promise<string> {

    if (this.settings[endpoint] !== undefined) {
      return resolve(this.settings[endpoint] as string, this.settings.server);
    }

    if (endpoint !== 'discoveryEndpoint') {
      // This condition prevents infinite loops.
      await this.discover();
      if (this.settings[endpoint] !== undefined) {
        return resolve(this.settings[endpoint] as string, this.settings.server);
      }
    }

    // If we got here it means we need to 'guess' the endpoint.
    if (!this.settings.server) {
      throw new Error(`Could not determine the location of ${endpoint}. Either specify ${endpoint} in the settings, or the "server" endpoint to let the client discover it.`);
    }

    switch (endpoint) {
      case 'authorizationEndpoint':
        return resolve('/authorize', this.settings.server);
      case 'tokenEndpoint':
        return resolve('/token', this.settings.server);
      case 'discoveryEndpoint':
        return resolve('/.well-known/oauth-authorization-server', this.settings.server);
      case 'introspectionEndpoint':
        return resolve('/introspect', this.settings.server);
      case 'revocationEndpoint':
        return resolve('/revoke', this.settings.server);
    }

  }

  private discoveryDone = false;
  private serverMetadata: ServerMetadataResponse | null = null;


  /**
   * Fetches the OAuth2 discovery document
   */
  private async discover(): Promise<void> {

    // Never discover twice
    if (this.discoveryDone) return;
    this.discoveryDone = true;

    let discoverUrl;
    try {
      discoverUrl = await this.getEndpoint('discoveryEndpoint');
    } catch (err) {
      console.warn('[oauth2] OAuth2 discovery endpoint could not be determined. Either specify the "server" or "discoveryEndpoint');
      return;
    }
    const resp = await this.settings.fetch!(discoverUrl, { headers: { Accept: 'application/json' }});

    if (!resp.ok) return;
    if (!resp.headers.get('Content-Type')?.startsWith('application/json')) {
      console.warn('[oauth2] OAuth2 discovery endpoint was not a JSON response. Response is ignored');
      return;
    }
    this.serverMetadata = await resp.json();

    const urlMap = [
      ['authorization_endpoint', 'authorizationEndpoint'],
      ['token_endpoint', 'tokenEndpoint'],
      ['introspection_endpoint', 'introspectionEndpoint'],
      ['revocation_endpoint', 'revocationEndpoint'],
    ] as const;

    if (this.serverMetadata === null) return;

    for (const [property, setting] of urlMap) {
      if (!this.serverMetadata[property]) continue;
      this.settings[setting] = resolve(this.serverMetadata[property]!, discoverUrl);
    }

    if (this.serverMetadata.token_endpoint_auth_methods_supported && !this.settings.authenticationMethod) {
      this.settings.authenticationMethod = this.serverMetadata.token_endpoint_auth_methods_supported[0];
    }

  }

  /**
   * Does a HTTP request on the 'token' endpoint.
   */
  async request(endpoint: 'tokenEndpoint', body: RefreshRequest | ClientCredentialsRequest | PasswordRequest | AuthorizationCodeRequest): Promise<TokenResponse>;
  async request(endpoint: 'introspectionEndpoint', body: IntrospectionRequest): Promise<IntrospectionResponse>;
  async request(endpoint: 'revocationEndpoint', body: RevocationRequest): Promise<void>;
  async request(endpoint: OAuth2Endpoint, body: Record<string, any>): Promise<unknown> {

    const uri = await this.getEndpoint(endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      // Although it shouldn't be needed, Github OAUth2 will return JSON
      // unless this is set.
      'Accept': 'application/json',
    };

    let authMethod = this.settings.authenticationMethod;

    if (!this.settings.clientSecret) {
      // Basic auth should only be used when there's a client_secret, for
      // non-confidential clients we may only have a client_id, which
      // always gets added to the body.
      authMethod = 'client_secret_post';
    }
    if (!authMethod) {
      // If we got here, it means no preference was provided by anything,
      // and we have a secret. In this case its preferred to embed
      // authentication in the Authorization header.
      authMethod = 'client_secret_basic';
    }

    switch(authMethod) {
      case 'client_secret_basic' :
        headers.Authorization = 'Basic ' +
          btoa(this.settings.clientId + ':' + this.settings.clientSecret);
        break;
      case 'client_secret_post' :
        body.client_id = this.settings.clientId;
        if (this.settings.clientSecret) {
          body.client_secret = this.settings.clientSecret;
        }
        break;
      default:
        throw new Error('Authentication method not yet supported:' + authMethod + '. Open a feature request if you want this!');
    }

    const resp = await this.settings.fetch!(uri, {
      method: 'POST',
      body: generateQueryString(body),
      headers,
    });

    let responseBody;
    if (resp.status !== 204 && resp.headers.has('Content-Type') && resp.headers.get('Content-Type')!.match(/^application\/(.*\+)?json/)) {
      responseBody = await resp.json();
    }
    if (resp.ok) {
      return responseBody;
    }

    let errorMessage;
    let oauth2Code;

    if (responseBody?.error) {
      // This is likely an OAUth2-formatted error
      errorMessage = 'OAuth2 error ' + responseBody.error + '.';
      if (responseBody.error_description) {
        errorMessage += ' ' + responseBody.error_description;
      }
      oauth2Code = responseBody.error;

    } else {
      errorMessage = 'HTTP Error ' + resp.status + ' ' + resp.statusText;
      if (resp.status === 401 && this.settings.clientSecret) {
        errorMessage += '. It\'s likely that the clientId and/or clientSecret was incorrect';
      }
      oauth2Code = null;
    }
    throw new OAuth2HttpError(errorMessage, oauth2Code, resp, responseBody);
  }

  /**
   * Converts the JSON response body from the token endpoint to an OAuth2Token type.
   */
  async tokenResponseToOAuth2Token(resp: Promise<TokenResponse>): Promise<OAuth2Token> {

    const body = await resp;

    if (!body?.access_token) {
      console.warn('Invalid OAuth2 Token Response: ', body);
      throw new TypeError('We received an invalid token response from an OAuth2 server.');
    }

    return {
      accessToken: body.access_token,
      expiresAt: body.expires_in ? Date.now() + (body.expires_in * 1000) : null,
      refreshToken: body.refresh_token ?? null,
    };

  }

}

function resolve(uri: string, base?: string): string {

  return new URL(uri, base).toString();

}

/**
 * Generates a query string.
 *
 * This function filters out any undefined values.
 */
export function generateQueryString(params: Record<string, undefined | number | string | string[]>): string {

  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for(const vItem of v) query.append(k, vItem);
    } else if (v !== undefined) query.set(k, v.toString());
  }
  return query.toString();

}
