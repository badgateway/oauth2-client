/**
 * Token information
 */
export type OAuth2Token = {

  /**
   * OAuth2 Access Token
   */
  accessToken: string;

  /**
   * When the Access Token expires.
   *
   * This is expressed as a unix timestamp in milliseconds.
   */
  expiresAt: number | null;

  /**
   * OAuth2 refresh token
   */
  refreshToken: string | null;

  /**
   * OpenID Connect ID Token
   */
  idToken?: string;

  /**
   * List of scopes that the access token is valid for.
   * (May be omitted if identical to the requested scope)
   */
  scopes?: string[];

  /**
   * Additional tokens properties returned by the OAuth2 server.
   */
  extraParams?: Record<string, any>;
};
