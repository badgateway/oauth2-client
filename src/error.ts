/**
 * An error class for any error the server emits.
 *
 * The 'code' property will have the oauth2 error type,
 * such as:
 * - invalid_request
 * - invalid_client
 * - invalid_grant
 * - unauthorized_client
 * - unsupported_grant_type
 * - invalid_scope
 */
export default class OAuthError extends Error {

  oauth2Code: number;
  httpCode: number;

  constructor(message: string, oauth2Code: number, httpCode: number) {

    super(message);

    this.oauth2Code = oauth2Code;
    this.httpCode = httpCode;

  }

}
