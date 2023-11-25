import { OAuth2Client } from './client';
import { TokenResponse } from './messages';
import { OidcToken } from './token';

export class OidcClient extends OAuth2Client {
  static defaultDiscoveryEndpoint = '/.well-known/openid-configuration';

  /**
         * Converts the JSON response body from the token endpoint to an OAuth2Token type.
         */
  async tokenResponseToOAuth2Token(resp: Promise<TokenResponse>): Promise<OidcToken> {
    const body = await resp;
    if (!body.id_token) throw new Error('Missing \'id_token\' in response');
    return {
      accessToken: body.access_token,
      expiresAt: body.expires_in ? Date.now() + (body.expires_in * 1000) : null,
      refreshToken: body.refresh_token ?? null,
      idToken: body.id_token!,
    };
  }
}
