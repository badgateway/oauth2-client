import { OAuth2Client } from '../client';
import { OAuth2Token } from '../token';
import { AuthorizationCodeRequest, AuthorizationQueryParams } from '../messages';
import { OAuth2Error } from '../error';

export class AuthorizationCodeClient {

  client: OAuth2Client;
  redirectUri: string;
  state: string|undefined;

  constructor(client: OAuth2Client, redirectUri: string, state?: string) {

    this.client = client;
    this.redirectUri = redirectUri;
    this.state = state;

  }

  /**
   * Returns the URi that the user should open in a browser to initiate the
   * authorization_code flow.
   */
  async getAuthorizeUri(): Promise<string> {

    const params: AuthorizationQueryParams = {
      response_type: 'code',
      client_id: this.client.settings.clientId,
      redirect_uri: this.redirectUri,
    };
    if (this.state) {
      params.state = this.state;
    }

    const queryString = new URLSearchParams(params);

    return (await this.client.getEndpoint('authorizationEndpoint')) + '?' + queryString.toString();

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
      code_verifier: params.codeVerifier,
    };
    return this.client.request('tokenEndpoint', body);

  }


}
