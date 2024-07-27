import { OAuth2Client } from '../client';
import { OAuth2Token } from '../token';
import { AuthorizationCodeRequest } from '../messages';
import { OAuth2Error } from '../error';

type GetAuthorizeUrlParams = {
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

type ValidateResponseResult = {

  /**
   * The authorization code. This code should be used to obtain an access token.
   */
  code: string;

  /**
   * List of scopes that the client requested.
   */
  scope?: string[];

}

type GetTokenParams = {

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
      this.client.getEndpoint('authorizationEndpoint')
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

    url = new URL(url);
    let queryParams = url.searchParams;
    if (!queryParams.has('code') && !queryParams.has('error') && url.hash.length>0) {
      // Try the fragment
      queryParams = new URLSearchParams(url.hash.slice(1));
    }

    if (queryParams.has('error')) {
      throw new OAuth2Error(
        queryParams.get('error_description') ?? 'OAuth2 error',
        queryParams.get('error') as any,
      );
    }

    if (!queryParams.has('code')) throw new Error(`The url did not contain a code parameter ${url}`);

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
    return this.client.tokenResponseToOAuth2Token(this.client.request('tokenEndpoint', body));

  }


}

export async function generateCodeVerifier(): Promise<string> {

  const webCrypto = getWebCrypto();
  if (webCrypto) {
    const arr = new Uint8Array(32);
    webCrypto.getRandomValues(arr);
    return base64Url(arr);
  } else {

    // Old node doesn't have 'webcrypto', so this is a fallback

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return new Promise<string>((res, rej) => {
      nodeCrypto.randomBytes(32, (err:Error, buf: Buffer) => {
        if (err) rej(err);
        res(buf.toString('base64url'));
      });
    });

  }

}

export async function getCodeChallenge(codeVerifier: string): Promise<['plain' | 'S256', string]> {

  const webCrypto = getWebCrypto();
  if (webCrypto?.subtle) {
    return ['S256', base64Url(await webCrypto.subtle.digest('SHA-256', stringToBuffer(codeVerifier)))];
  } else {
    // Node 14.x fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    const hash = nodeCrypto.createHash('sha256');
    hash.update(stringToBuffer(codeVerifier));
    return ['S256', hash.digest('base64url')];
  }

}

function getWebCrypto() {

  // Browsers
  if ((typeof window !== 'undefined' && window.crypto)) {
    return window.crypto;
  }
  // Web workers possibly
  if ((typeof self !== 'undefined' && self.crypto)) {
    return self.crypto;
  }
  // Node
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto');
  if (crypto.webcrypto) {
    return crypto.webcrypto;
  }
  return null;

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

