import { stringify } from 'querystring';

type FetchMwOAuth2Options = {
  clientId: string,
  clientSecret: string,
  grantType: 'client_credentials',
  tokenEndpoint: string,
  scopes?: string[],
};

export = (options: FetchMwOAuth2Options): typeof fetch => {

  let accessToken: string|null = null;
  // const refreshToken = null;

  return async (input: RequestInfo, init?: RequestInit): Promise<Response> => {

    // input might be a string or a Request object, we want to make sure this
    // is always a fully-formed Request object.
    const request = new Request(input, init);

    if (!accessToken) {
      accessToken = await getAccessToken(options);
    }

    let response = await requestWithBearerToken(request, accessToken);

    if (!response.ok && response.status === 401) {

      // We got a 401, lets try to re-authenticate
      accessToken = await getAccessToken(options);

      // We will try one more time
      response = await requestWithBearerToken(request, accessToken);

    }
    return fetch(request);

  };

};

async function requestWithBearerToken(request: Request, accessToken: string) {

  request.headers.set('Authorization', 'Bearer '  + accessToken);
  return await fetch(request);

}

const getAccessToken = async (options: FetchMwOAuth2Options): Promise<string> => {


  if (options.grantType !== 'client_credentials') {
    throw new Error('Unknown grantType: ' + options.grantType);
  }

  const body = {
    grant_type: options.grantType,
  };

  const basicAuthStr = Buffer.from(options.clientId + ':' + options.clientSecret).toString('base64');

  const authResult = await fetch(options.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type'  : 'application/x-www-form-urlencoded',
      'Authorization' : 'Basic ' + basicAuthStr,
    },
    body: stringify(body),
  });

  const jsonResult = await authResult.json();

  if (!authResult.ok) {
    throw new Error('OAuth2 error: ' + jsonResult.error);
  }

  return jsonResult.access_token;

};
