import { OAuth2Client, tokenResponseToOAuth2Token } from '../client';
import { OAuth2Token } from '../token';
import { AuthorizationCodeRequest, AuthorizationQueryParams } from '../messages';
import { OAuth2Error } from '../error';

export class OAuth2AuthorizationCodeClient {

  client: OAuth2Client;
  redirectUri: string;
  state: string|undefined;
  codeVerifier: string|undefined;

  constructor(client: OAuth2Client, redirectUri: string, state?: string, codeVerifier?: string) {

    this.client = client;
    this.redirectUri = redirectUri;
    this.state = state;
    this.codeVerifier = codeVerifier;

  }

  /**
   * Returns the URi that the user should open in a browser to initiate the
   * authorization_code flow.
   */
  async getAuthorizeUri(params: { codeVerifier: string; redirectUri: string; state: string}): Promise<string> {

    const [
      codeChallenge,
      authorizationEndpoint
    ] = await Promise.all([
      getCodeChallenge(params.codeVerifier),
      this.client.getEndpoint('authorizationEndpoint')
    ]);

    const query: AuthorizationQueryParams = {
      response_type: 'code',
      client_id: this.client.settings.clientId,
      redirect_uri: this.redirectUri,
      code_challenge_method: codeChallenge[0],
      code_challenge: codeChallenge[1],
    };
    if (this.state) {
      query.state = this.state;
    }

    const queryString = new URLSearchParams(query);

    return authorizationEndpoint + '?' + queryString.toString();

  }

  /**
   * After the user redirected back from the authorization endpoint, the
   * url will contain a 'code' and other information.
   *
   * This function takes the url and validate the response. If the user
   * redirected back with an error, an error will be thrown.
   */
  async validateResponse(url: string|URL): Promise<{code: string; codeVerifier?: string}> {

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

    if (this.state !== queryParams.get('state')) {
      throw new Error(`The "state" parameter in the url did not match the expected value of ${this.state}`);
    }

    return {
      code: queryParams.get('code')!
    };

  }


  /**
   * Receives an OAuth2 token using 'authorization_code' grant
   */
  async getToken(params: { code: string; codeVerifier?: string }): Promise<OAuth2Token> {

    const body:AuthorizationCodeRequest = {
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: this.redirectUri,
      client_id: this.client.settings.clientId,
      code_verifier: this.codeVerifier,
    };
    return tokenResponseToOAuth2Token(this.client.request('tokenEndpoint', body));

  }


}

export function getCodeVerifier(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return base64Url(arr);
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

