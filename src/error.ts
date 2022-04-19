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
export class OAuth2Error extends Error {

  oauth2Code: string;
  httpCode: number;

  constructor(message: string, oauth2Code: string, httpCode: number) {

    super(message);

    this.oauth2Code = oauth2Code;
    this.httpCode = httpCode;

  }

}
