/**
 * refresh_token request body
 */
export type RefreshRequest = {
  grant_type: 'refresh_token';
  refresh_token: string;

  client_id?: string;
  scope?: string;
}

/**
 * client_credentials request body
 */
export type ClientCredentialsRequest = {
  grant_type: 'client_credentials';
  scope?: string;
}

/**
 * password grant_type request body
 */
export type PasswordRequest = {
  grant_type: 'password';
  username: string;
  password: string;
  scope?: string;
}

export type AuthorizationCodeRequest = {
  grant_type: 'authorization_code';
  code: string;
  redirect_uri: string;
  client_id: string;
  code_verifier?: string;
}

/**
 * Response from the /token endpoint
 */
export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
