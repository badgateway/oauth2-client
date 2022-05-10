import { OAuth2Client, tokenResponseToOAuth2Token, generateQueryString } from '../client';
import { OAuth2Token } from '../token';
import { AuthorizationCodeRequest, AuthorizationQueryParams } from '../messages';
import { OAuth2Error } from '../error';

export class OAuth2AuthorizationCodeClient {

  client: OAuth2Client;

  constructor(client: OAuth2Client) {

    this.client = client;

  }

  /**
   * Returns the URi that the user should open in a browser to initiate the
   * authorization_code flow.
   */
  async getAuthorizeUri(params: {redirectUri: string; state?: string; codeVerifier?: string}): Promise<string> {

    const [
      codeChallenge,
      authorizationEndpoint
    ] = await Promise.all([
      params.codeVerifier ? getCodeChallenge(params.codeVerifier) : undefined,
      this.client.getEndpoint('authorizationEndpoint')
    ]);

    const query: AuthorizationQueryParams = {
      response_type: 'code',
      client_id: this.client.settings.clientId,
      redirect_uri: params.redirectUri,
      code_challenge_method: codeChallenge?.[0],
      code_challenge: codeChallenge?.[1],
    };
    if (params.state) {
      query.state = params.state;
    }

    return authorizationEndpoint + '?' + generateQueryString(query);

  }

  async getTokenFromCodeRedirect(url: string|URL, params: {redirectUri: string; state?: string; codeVerifier?:string} ): Promise<OAuth2Token> {

    const { code } = await this.validateResponse(url, {
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
  async validateResponse(url: string|URL, params: {state?: string}): Promise<{code: string}> {

    const queryParams = new URL(url).searchParams;

    if (queryParams.has('error')) {
      throw new OAuth2Error(
        queryParams.get('error_description') ?? 'OAuth2 error',
        queryParams.get('error')!,
        0,
      );
    }

    if (!queryParams.has('code')) throw new Error(`The url did not contain a code parameter ${url}`);
    if (!queryParams.has('state')) throw new Error(`The url did not contain state parameter ${url}`);

    if (params.state && params.state !== queryParams.get('state')) {
      throw new Error(`The "state" parameter in the url did not match the expected value of ${params.state}`);
    }

    return {
      code: queryParams.get('code')!
    };

  }


  /**
   * Receives an OAuth2 token using 'authorization_code' grant
   */
  async getToken(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<OAuth2Token> {

    const body:AuthorizationCodeRequest = {
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: this.client.settings.clientId,
      code_verifier: params.codeVerifier,
    };
    return tokenResponseToOAuth2Token(this.client.request('tokenEndpoint', body));

  }


}

export async function generateCodeVerifier(): Promise<string> {

  if (typeof window !== 'undefined' && window.crypto) {
    // Built-in webcrypto
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return base64Url(arr);
  } else {

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto');
    if (crypto.webcrypto) {
      // Webcrypto in a Node 16 or 18 module
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      return base64Url(arr);

    } else {

      // Old node
      const bytes = await (new Promise<Buffer>((res, rej) => {
        crypto.randomBytes(32, (err:Error, buf: Buffer) => {
          if (err) rej(err);
          res(buf);
        });
      }));
      return base64Url(bytes);

    }

  }

}

async function getCodeChallenge(codeVerifier: string): Promise<['plain' | 'S256', string]> {

  return ['S256', base64Url(await crypto.subtle.digest('SHA-256', stringToBuffer(codeVerifier)))];

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

