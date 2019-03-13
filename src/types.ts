/**
 * Token information
 */
export type Token = {
  accessToken: string,
  expiresAt: number | null,
  refreshToken: string | null,
};


/**
 * The following types build the constructor options argument for
 * the OAuth2 class.
 */
type BaseOptions = {
  clientId: string,
  onTokenUpdate?: (token: Token) => void
};

type PasswordGrantOptions = {
  clientSecret: string,
  grantType: 'password',
  tokenEndpoint: string,
  scope?: string[],
  userName: string,
  password: string,
};

type ClientCredentialsGrantOptions = {
  clientSecret: string,
  grantType: 'client_credentials',
  tokenEndpoint: string,
  scope?: string[],
};

type AuthorizationCodeGrantOptions = {
  grantType: 'authorization_code',
  redirectUri: string,
  tokenEndpoint: string,
  code: string,
};

export type OAuth2Options =
  BaseOptions &
  (PasswordGrantOptions | ClientCredentialsGrantOptions | AuthorizationCodeGrantOptions);

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
} | {
  grant_type: 'authorization_code',
  code: string,
  redirect_uri: string,
  client_id: string,
};

