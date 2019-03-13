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
  grantType: string | undefined,
  clientId: string,
  clientSecret?: string, 
  accessToken?: string,
  refreshToken?: string,
  tokenEndpoint: string,
  onTokenUpdate?: (token: Token) => void,
}

/**
 * grant_type=password
 */
type PasswordGrantOptions = {
  clientSecret: string,
  grantType: 'password',
  scope?: string[],
  userName: string,
  password: string,
};

/**
 * grant_type=client_credentials
 */
type ClientCredentialsGrantOptions = {
  clientSecret: string,
  grantType: 'client_credentials',
  scope?: string[],
};

/**
 * grant_type=authorization_code
 */
type AuthorizationCodeGrantOptions = {
  grantType: 'authorization_code',
  redirectUri: string,
  code: string,
}

/**
 * In case you obtained an access token and/or refresh token through different
 * means, you can not specify a grant_type and simply only specifiy an access
 * and refresh token.
 */
type RefreshOnlyGrantOptions = {
  grantType: undefined,
  accessToken: string,
  refreshToken: string,
  tokenEndpoint: string,
}

export type OAuth2Options =
  BaseOptions & 
  (PasswordGrantOptions | ClientCredentialsGrantOptions | AuthorizationCodeGrantOptions | RefreshOnlyGrantOptions);

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

