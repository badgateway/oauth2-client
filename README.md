# fetch-mw-oauth2

This package contains an OAuth2 client. It aims to be a a fully-featured OAuth2
utility library, for Node.js, Browsers and written in Typescript.

This library supports the following features:

* `authorization_code` grant with optional [PKCE][1] support.
* `password` and `client_credentials` grant.
* a `fetch()` wrapper that automatically passe OAuth2 tokens and refreshes
  them.
* OAuth2 endpoint discovery via the Server metadata document ([RFC8414][2]).

## Installation

```sh
npm i fetch-mw-oauth2
```

## Usage

To get started, set up the Client class:


```typescript
import { OAuth2Client } from 'fetch-mw-oauth2';

const client = new Client({

  // The base URI of your OAuth2 server
  server: 'https://my-auth-server/',

  // OAuth2 client id
  clientId: '...',

  // OAuth2 client secret. Only required for 'client_credentials', 'password'
  // flows. You should not specify this for authorization_code.
  clientSecret: '...',


  // The following URIs are all optional. If they are not specified, we will
  // attempt to discover them using the oauth2 discovery document.
  // If your server doesn't have support this, you may need to specify these.
  // you may use relative URIs for any of these.


  // Token endpoint. Most flows need this.
  // If not specified we'll use the information for the discovery document
  // first, and otherwise default to /token
  tokenEndpoint: '/token',

  // Authorization endpoint.
  //
  // You only need this to generate URLs for authorization_code flows.
  // If not specified we'll use the information for the discovery document
  // first, and otherwise default to /authorize
  authorizationEndpoint: '/authorize',

  // OAuth2 Metadata discovery endpoint.
  //
  // This document is used to determine various server features.
  // If not specified, we assume it's on /.well-known/oauth2-authorization-server
  discoveryEndpoint: '/.well-known/oauth2-authorization-server',

});
```

### Tokens

Many functions use or return a 'OAuth2Token' type. This type has the following
shape:

```typescript
export type OAuth2Token = {
  accessToken: string;
  refreshToken: string | null;

  /**
   * When the Access Token expires.
   *
   * This is expressed as a unix timestamp in milliseconds.
   */
  expiresAt: number | null;

};
```


### client_credentials grant.

```typescript
const token = await client.clientCredentials();
```

### Refreshing tokens

```typescript
const newToken = await client.refresh(oldToken);
```


### password grant:

```typescript
const token = await client.password({
  username: '..',
  password: '..',
});
```

### authorization_code

To use authorization_code, you typically first need to send a user to the
authorization endpoint.

After the user was redirected back, you will be able to obtain a `code`
string.

This `code` can be exchanged for an oauth2 access token.

```typescript
const token = await client.authorizationCode({
  code: '....',

  // MUST match the exact original redirect_uri as passed to the auhtorization endpoint
  redirectUri: '...',

  // If PCKE was used (highly recommended), pass the code_verifier here
  codeVerifier: '...', 
});
```

### Fetch Wrapper

When using an OAuth2-protected API, typically you will need to obtain an Access
token, and then add this token to each request using an `Authorization: Bearer`
header.

Because access tokens have a limited lifetime, and occasionally needs to be
refreshed this is a bunch of potential plumbing.

To make this easier, this library has a 'fetch wrapper'. This is effectively
just like a regular fetch function, except it automatically adds the header
and will automatically refresh tokens when needed.

Usage:

```typescript
import { OAuth2Client, OAuth2Fetch } from 'fetch-mw-oauth2';

const client = new OAuth2Client({
  server: 'https://my-auth-server',
  clientId: 'my-client-id'
});


const fetchWrapper = new OAuth2Fetch({
  client: client,

  /**
   * You are responsible for implementing this function.
   * it's purpose is to supply the 'intitial' oauth2 token.
   */
  getNewToken: async () => {

    // Example
    return client.clientCredentials();     

    // Another example
    return client.authorizationCode({
      code: '..',
      redirectUri: '..',
    });

    // You can return null to fail the process. You may want to do this
    // when a user needs to be redirected back to the authorization_code
    // endpoints.
    return null;

  },

  /**
   * Optional. This will be called for any fatal authentication errors.
   */
  onError: (err) => {
    // err is of type Error
  }

});
```

After set up, you can just call `fetch` on the new object ot call your API, and
the library will ensure there's always a `Bearer` header.

```typescript
const response = fetchWrapper.fetch('https://my-api', {
  method: 'POST',
  body: 'Hello world'
});
```

### Storing tokens for later use with FetchWrapper

To keep a user logged in between sessions, you may want to avoid full
reauthentication. To do this, you'll need to store authentication token.

The fetch wrapper has 2 functions to help with this:

```typescript

const fetchWrapper = new OAuth2Fetch({
  client: client,

  getNewToken: async () => {

    // See above!

  },

  /**
   * This function is called whenever the active token changes. Using this is
   * optional, but it may be used to (for example) put the token in off-line
   * storage for later usage.
   */
  storeToken: (token) => {
    document.localStorage.setItem('token-store', JSON.stringify(token));
  }

  /**
   * Also an optional feature. Implement this if you want the wrapper to try a
   * stored token before attempting a full reauthentication.
   *
   * This function may be async. Return null if there was no token.
   */
  getStoredToken: () => {
    const token = document.localStorage.getItem('token-store');
    if (token) return JSON.parse(token);
    return null;
  }

});
```



### fetchMw function

It might be preferable to use this library as a more traditional 'middleware'.

The OAuth2Fetch object also exposes a `fetchMw` function that takes 2 arguments:

1. `request`
2. `next`

The next argument is a function that also takes a request and returns a
response.

Usually you will want to use this with some kind of fetch middleware container,
as such:

```typescript
myFetchMiddleware(oauth2.fetchMw);
```

But it's also possible to use it directly. For example:

```typescript
oauth2.fetchMw(myRequest, innerRequest => fetch(innerRequest));
```

## Project status

The current features have been implemented:

1. `client_credentials` grant-type support.
2. `password` grant-type support.
3. `authorization_code` grant-type support
4. Automatically refreshing tokens
5. Invoking hooks for successful token update (`options.onTokenUpdate`) and authentication failure (`options.onAuthError`)

The following features are planned mid/long-term

1. Supply an OAuth2 discovery document instead of authorization and token uris.
2. `implicit` grant-type support

[1]: https://datatracker.ietf.org/doc/html/rfc7636 "Proof Key for Code Exchange by OAuth Public Clients"
[2]: https://datatracker.ietf.org/doc/html/rfc8414 "OAuth 2.0 Authorization Server Metadata"
