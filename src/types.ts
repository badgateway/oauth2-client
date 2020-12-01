/**
 * Token information
 */
export type OAuth2Token = {

  /**
   * OAuth2 Access Token
   */
  accessToken: string,

  /**
   * When the Access Token expires.
   *
   * This is expressed as a unix timestamp in milliseconds.
   */
  expiresAt: number | null,

  /**
   * OAuth2 refresh token
   */
  refreshToken: string | null,
};

/**
 * grant_type=password
 */
type PasswordGrantOptions = {
  grantType: 'password',

  /**
   * OAuth2 client id
   */
  clientId: string,

  /**
   * OAuth2 Client Secret
   */
  clientSecret: string,

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string,

  /**
   * List of OAuth2 scopes
   */
  scope?: string[],

  /**
   * Username to log in as
   */
  userName: string,

  /**
   * Password
   */
  password: string,

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void,

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void,
};

/**
 * grant_type=client_credentials
 */
type ClientCredentialsGrantOptions = {
  grantType: 'client_credentials',

  /**
   * OAuth2 client id
   */
  clientId: string,

  /**
   * OAuth2 Client Secret
   */
  clientSecret: string,

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string,

  /**
   * List of OAuth2 scopes
   */
  scope?: string[],

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void,

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void,
};

/**
 * grant_type=authorization_code
 */
type AuthorizationCodeGrantOptions = {
  grantType: 'authorization_code',

  /**
   * OAuth2 client id
   */
  clientId: string,

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string,

  /**
   * The redirect_uri that was passed originally to the 'authorization' endpoint.
   *
   * This must be identical to the original string, as conforming OAuth2 servers
   * will validate this.
   */
  redirectUri: string,

  /**
   * Code that was obtained from the authorization endpoint
   */
  code: string,

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void,

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void,

  /**
   * When using PKCE, specify the previously generated code verifier here.
   */
  codeVerifier?: string,
};

/**
 * In case you obtained an access token and/or refresh token through different
 * means, you can not specify a grant_type and simply only specify an access
 * and refresh token.
 *
 * If a refresh or tokenEndpoint are not supplied, the token will never get refreshed.
 */
type RefreshOnlyGrantOptions = {
  grantType: undefined,

  /**
   * OAuth2 client id
   */
  clientId: string,
  tokenEndpoint: string,

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void,

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void,
};

export type OAuth2Options =
  PasswordGrantOptions | ClientCredentialsGrantOptions | AuthorizationCodeGrantOptions | RefreshOnlyGrantOptions;


export type AccessTokenRequest = {
  grant_type: 'client_credentials',
  scope?: string,
} | {
  grant_type: 'password',
  username: string,
  password: string,
  scope?: string,
} | {
  grant_type: 'refresh_token',
  refresh_token: string,
  scope?: string,
  client_id?: string,
} | {
  grant_type: 'authorization_code',
  code: string,
  redirect_uri: string,
  client_id: string,
  code_verifier?: string,
};
