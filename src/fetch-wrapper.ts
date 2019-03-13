import { AccessTokenRequest, OAuth2Options } from './types';
import { objToQueryString } from './util';
import { encode as base64Encode } from './base64';

type Token = {
  accessToken: string,
  expiresAt: number | null,
  refreshToken: string | null,
};

export default (options: OAuth2Options): typeof fetch => {

  let token: Token = {
    accessToken: '',
    expiresAt: 0,
    refreshToken: null,
  };

  return async (input: RequestInfo, init?: RequestInit): Promise<Response> => {

    // input might be a string or a Request object, we want to make sure this
    // is always a fully-formed Request object.
    const request = new Request(input, init);

    if (!token || (token.expiresAt !== null && token.expiresAt < Date.now())) {
      token = await getToken(options, token);
    }

    let response = await requestWithBearerToken(request, token.accessToken);

    if (!response.ok && response.status === 401) {

      // We got a 401, lets try to re-authenticate
      token = await getToken(options, token);

      // We will try one more time
      response = await requestWithBearerToken(request, token.accessToken);

    }
    return fetch(request);

  };

};

async function requestWithBearerToken(request: Request, accessToken: string) {

  request.headers.set('Authorization', 'Bearer '  + accessToken);
  return await fetch(request);

}

const getToken = async (options: OAuth2Options, previousToken: Token): Promise<Token> => {

  let body: AccessTokenRequest;

  if (previousToken.refreshToken) {
    body = {
      grant_type: 'refresh_token',
      refresh_token: previousToken.refreshToken
    };

  } else {
    switch (options.grantType) {

      case 'client_credentials':
        body = {
          grant_type: 'client_credentials',
        };
        break;
      case 'password':
        body = {
          grant_type: 'password',
          username: options.userName,
          password: options.password,
        };
        break;
      default :
        throw new Error('Unknown grantType: ' + options!.grantType);
    }
    if (options.scope) {
      body.scope = options.scope.join(' ');
    }

  }

  const basicAuthStr = base64Encode(options.clientId + ':' + options.clientSecret);

  console.log(body);

  const authResult = await fetch(options.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type'  : 'application/x-www-form-urlencoded',
      'Authorization' : 'Basic ' + basicAuthStr,
    },
    body: objToQueryString(body),
  });

  const jsonResult = await authResult.json();

  if (!authResult.ok) {

    // If we failed with a refresh_token grant_type, we're going to make one
    // more attempt doing a full re-auth
    if (body.grant_type === 'refresh_token') {
      return getToken(options, {
        accessToken: '',
        expiresAt: null,
        refreshToken: null
      });
    }

    let errorMessage = 'OAuth2 error ' + jsonResult.error + '.';
    if (jsonResult.error_description) {
      errorMessage += ' ' + jsonResult.error_description;
    }
    throw new Error(errorMessage);
  }

  return {
    accessToken: jsonResult.access_token,
    expiresAt: jsonResult.expires_in ? Date.now() + (jsonResult.expires_in * 1000) : null,
    refreshToken: jsonResult.refresh_token ? jsonResult.refresh_token : null,
  };

};
