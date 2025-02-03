import { OAuth2Client, OAuth2Endpoint } from '../client.js';
import { OAuth2Error } from '../error.js';
import { AuthorizationCodeRequest } from '../messages.js';
import { OAuth2Token } from '../token.js';

interface GetAuthorizeUrlParams {
  /**
   * Where to redirect the user back to after authentication.
   */
  redirectUri: string;

  /**
   * The 'state' is a string that can be sent to the authentication server,
   * and back to the redirectUri.
   */
  state?: string;

  /**
   * Code verifier for PKCE support. If you used this in the redirect
   * to the authorization endpoint, you also need to use this again
   * when getting the access_token on the token endpoint.
   */
  codeVerifier?: string;

  /**
   * List of scopes.
   */
  scope?: string[];

  /**
   * The resource the client intends to access.
   *
   * This is defined in RFC 8707.
   */
  resource?: string[] | string;

  /**
   * Any parameters listed here will be added to the query string for the authorization server endpoint.
   */
  extraParams?: Record<string, string>;

  /**
   * By default response parameters for the authorization_flow will be added
   * to the query string.
   *
   * Some servers let you put this in the fragment instead. This may be
   * benefical if your client is a browser, as embedding the authorization
   * code in the fragment part of the URI prevents it from being sent back
   * to the server.
   *
   * See: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
   */
  responseMode?: 'query' | 'fragment';
}

interface ValidateResponseResult {
  /**
   * The authorization code. This code should be used to obtain an access token.
   */
  code: string;

  /**
   * List of scopes that the client requested.
   */
  scope?: string[];
}

interface GetTokenParams {
  code: string;

  redirectUri: string;
  state?: string;
  codeVerifier?:string;

  /**
   * The resource the client intends to access.
   *
   * @see https://datatracker.ietf.org/doc/html/rfc8707
   */
  resource?: string[] | string;
}

export class OAuth2AuthorizationCodeClient {
  client: OAuth2Client;

  constructor(client: OAuth2Client) {
    this.client = client;
  }

  /**
   * Returns the URi that the user should open in a browser to initiate the
   * authorization_code flow.
   */
  async getAuthorizeUri(params: GetAuthorizeUrlParams): Promise<string> {
    const [
      codeChallenge,
      authorizationEndpoint
    ] = await Promise.all([
      params.codeVerifier ? getCodeChallenge(params.codeVerifier) : undefined,
      this.client.getEndpoint(OAuth2Endpoint.AuthorizationEndpoint),
    ]);
    const query = new URLSearchParams({
      client_id: this.client.settings.clientId,
      response_type: 'code',
      redirect_uri: params.redirectUri,
    });

    if (codeChallenge) {
      query.set('code_challenge_method', codeChallenge[0]);
      query.set('code_challenge', codeChallenge[1]);
    }

    if (params.state) {
      query.set('state', params.state);
    }

    if (params.scope) {
      query.set('scope', params.scope.join(' '));
    }

    if (params.resource) for(const resource of [].concat(params.resource as any)) {
      query.append('resource', resource);
    }

    if (params.responseMode && params.responseMode!=='query') {
      query.append('response_mode', params.responseMode);
    }

    if (params.extraParams) for(const [k,v] of Object.entries(params.extraParams)) {
      if (query.has(k)) throw new Error(`Property in extraParams would overwrite standard property: ${k}`);
      query.set(k, v);
    }

    return authorizationEndpoint + '?' + query.toString();
  }

  async getTokenFromCodeRedirect(url: string|URL, params: Omit<GetTokenParams, 'code'> ): Promise<OAuth2Token> {
    const { code } = this.validateResponse(url, {
      state: params.state
    });

    return this.getToken({
      code,
      redirectUri: params.redirectUri,
      codeVerifier: params.codeVerifier,
    });
  }

  /**
   * After the user redirected back from the authorization endpoint, the
   * url will contain a 'code' and other information.
   *
   * This function takes the url and validate the response. If the user
   * redirected back with an error, an error will be thrown.
   */
  validateResponse(url: string|URL, params: {state?: string}): ValidateResponseResult {
    const eURL = new URL(url);
    let queryParams = eURL.searchParams;

    if (!queryParams.has('code') && !queryParams.has('error') && eURL.hash.length > 0) {
      // Try the fragment
      queryParams = new URLSearchParams(eURL.hash.slice(1));
    }

    if (queryParams.has('error')) {
      throw new OAuth2Error(
        queryParams.get('error_description') ?? 'OAuth2 error',
        queryParams.get('error') as any,
      );
    }

    if (!queryParams.has('code')) {
      throw new Error(`The url did not contain a code parameter ${url}`);
    }

    if (params.state && params.state !== queryParams.get('state')) {
      throw new Error(`The "state" parameter in the url did not match the expected value of ${params.state}`);
    }

    return {
      code: queryParams.get('code')!,
      scope: queryParams.has('scope') ? queryParams.get('scope')!.split(' ') : undefined,
    };
  }

  /**
   * Receives an OAuth2 token using 'authorization_code' grant
   */
  async getToken(params: GetTokenParams): Promise<OAuth2Token> {
    const body:AuthorizationCodeRequest = {
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
      resource: params.resource,
    };

    return this.client.tokenResponseToOAuth2Token(this.client.request(OAuth2Endpoint.TokenEndpoint, body));
  }
}

export async function generateCodeVerifier(): Promise<string> {
  const webCrypto = await getWebCrypto();
  const arr = new Uint8Array(32);

  webCrypto.getRandomValues(arr);

  return base64Url(arr);
}

export async function getCodeChallenge(codeVerifier: string): Promise<['plain' | 'S256', string]> {
  const webCrypto = await getWebCrypto();

  return ['S256', base64Url(await webCrypto.subtle.digest('SHA-256', stringToBuffer(codeVerifier)))];
}

async function getWebCrypto(): Promise<typeof window.crypto> {
  // Browsers
  if ((typeof window !== 'undefined' && window.crypto)) {
    if (!window.crypto.subtle?.digest) {
      throw new Error(
        "The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details"
      );
    }
    return window.crypto;
  }

  // Web workers possibly
  if ((typeof self !== 'undefined' && self.crypto)) {
    return self.crypto;
  }

  // Node
  const crypto = await import('crypto');

  return crypto.webcrypto as typeof window.crypto;
}

function stringToBuffer(input: string): ArrayBuffer {
  const buf = new Uint8Array(input.length);

  for(let i=0; i<input.length;i++) {
    buf[i] = input.charCodeAt(i) & 0xFF;
  }

  return buf;
}

function base64Url(buf: ArrayBuffer) {
  return (
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  );
}

