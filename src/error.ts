import { OAuth2ErrorCode } from './messages';

/**
 * An error class for any error the server emits.
 *
 * The 'oauth2Code' property will have the oauth2 error type,
 * such as:
 * - invalid_request
 * - invalid_client
 * - invalid_grant
 * - unauthorized_client
 * - unsupported_grant_type
 * - invalid_scope
 */
export class OAuth2Error extends Error {

  oauth2Code: OAuth2ErrorCode|string;

  constructor(message: OAuth2ErrorCode|string, oauth2Code: OAuth2ErrorCode) {

    super(message);
    this.oauth2Code = oauth2Code;

  }

}

/**
 * A OAuth2 error that was emitted as a HTTP error
 *
 * The 'code' property will have the oauth2 error type,
 * such as:
 * - invalid_request
 * - invalid_client
 * - invalid_grant
 * - unauthorized_client
 * - unsupported_grant_type
 * - invalid_scope
 *
 * This Error also gives you access to the HTTP status code and response body.
 */
export class OAuth2HttpError extends OAuth2Error {

  httpCode: number;

  response: Response;
  parsedBody: Record<string, any>;

  constructor(message: string, oauth2Code: OAuth2ErrorCode, response: Response, parsedBody: Record<string, any>) {

    super(message, oauth2Code);

    this.httpCode = response.status;
    this.response = response;
    this.parsedBody = parsedBody;

  }

}
