type PasswordGrantOptions = {
  clientId: string,
  clientSecret: string,
  grantType: 'password',
  tokenEndpoint: string,
  scope?: string[],
  userName: string,
  password: string,
};

type ClientCredentialsGrantOptions = {
  clientId: string,
  clientSecret: string,
  grantType: 'client_credentials',
  tokenEndpoint: string,
  scope?: string[],
};

export type OAuth2Options = PasswordGrantOptions | ClientCredentialsGrantOptions;

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
};

