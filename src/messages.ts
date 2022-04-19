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


/**
 * Response from /.well-known/oauth-authorization-server
 *
 * https://datatracker.ietf.org/doc/html/rfc8414
 */
export type ServerMetadataResponse = {

  /**
   * The authorization server's issuer identifier, which is a URL that uses
   * the "https" scheme and has no query or fragment.
   */
  issuer: string;

  /**
   * URL of the authorization server's authorization endpoint.
   */
  authorization_endpoint:string;

  /**
   * URL of the authorization server's token endpoint.
   */
  token_endpoint: string;

  /**
   * URL of the authorization server's JWK Set document
   */
  jwks_uri?: string;

  /**
   * URL of the authorization server's OAuth 2.0 Dynamic Client Registration
   * endpoint.
   */
  registration_endpoint?: string;

  /**
   * List of supported scopes for this server
   */
  scopes_supported?: string[];

  /**
   * List of supported response types for the authorization endpoint.
   *
   * If 'code' appears here it implies authoriziation_code support,
   * 'token' implies support for implicit auth.
   */
  response_types_supported: OAuth2ResponseType[];

  /**
   * JSON array containing a list of the OAuth 2.0 "response_mode"
   * values that this authorization server supports
   */
  response_modes_supported?: string[];

  /**
   * List of supported grant types by the server
   */
  grant_types_supported?: OAuth2GrantType[];

  /**
   * Supported auth methods on the token endpoint.
   */
  token_endpoint_auth_methods_supported?: OAuth2AuthMethod[];

  /**
   * JSON array containing a list of the JWS signing algorithms.
   */
  token_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * URL of a page containing human-readable information that developers might want or need to know when using the authorization server.
   */
  service_documentation?: string;

  /**
   * List of supported languages for the UI
   */
  ui_locales_supported?: string[];

  /**
   * URL that the authorization server provides to the person registering the
   * client to read about the authorization server's requirements on how the
   * client can use the data provided by the authorization server.
   */
  op_policy_uri?: string;

  /**
   * Link to terms of service
   */
  op_tos_uri?: string;

  /**
   * Url to servers revokation endpoint.
   */
  revocation_endpoint?: string;

  /**
   * Auth method that may be used on the revokation endpoint.
   */
  revocation_endpoint_auth_methods_supported?: OAuth2AuthMethod[];

  /**
   * JSON array containing a list of the JWS signing algorithms ("alg" values)
   * supported by the revocation endpoint.
   */
  revocation_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * Url to introspection endpoint
   */
  introspection_endpoint?: string;

  /**
   * List of authentication methods supported on the introspection endpoint.
   */
  introspection_endpoint_auth_methods_supported?: OAuth2AuthMethod[];

  /**
   * List of JWS signing algorithms supported on the introspection endpoint.
   */
  introspection_endpoint_auth_signing_alg_values_supported?: string[];

  /**
   * List of support PCKE code shallenge methods.
   */
  code_challenge_methods_supported?: OAuth2CodeChallengeMethod[];

}

type OAuth2ResponseType = 'code' | 'token';
type OAuth2GrantType = 'authorization_code' | 'implicit' | 'password' | 'client_credentials' | 'refresh_token' | 'urn:ietf:params:oauth:grant-type:jwt-bearer' | 'urn:ietf:params:oauth:grant-type:saml2-bearer';
type OAuth2AuthMethod = 'none' | 'client_secret_basic' | 'client_secret_post' | 'client_secret_jwt' | 'private_key_jwt' | 'tls_client_auth' | 'self_signed_tls_client_auth';
type OAuth2CodeChallengeMethod = 'S256' | 'plain';
