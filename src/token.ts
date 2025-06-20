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
   * Additional tokens properties returned by the OAuth2 server.
   * 
   * To include these properties, set `tokenAdditionalProperties`
   * to true in the `ClientSettings` object.
   */
  additionalProperties?: Record<string, any>;
};
