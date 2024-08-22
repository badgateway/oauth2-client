# OAuth2 client for Node and browsers

This package contains an OAuth2 client. It aims to be a fully-featured OAuth2
utility library, for Node.js, Browsers and written in Typescript.

This OAuth2 client is only **4KB** gzipped, it has **0** dependencies and
relies on modern APIs like `fetch()` and [Web Crypto][4] which are built-in
since Node 18 (but it works with Polyfills on Node 14 and 16).


## Highlights

* 12KB minified (4KB gzipped).
* No dependencies.
* `authorization_code` grant with optional [PKCE][1] support.
* `password` and `client_credentials` grant.
* a `fetch()` wrapper that automatically adds Bearer tokens and refreshes them.
* OAuth2 endpoint discovery via the Server metadata document ([RFC8414][2]).
* OAuth2 Token Introspection ([RFC7662][3]).
* Resource Indicators for OAuth 2.0 ([RFC8707][5]).
* OAuth2 Token Revocation ([RFC7009][6]).
* [OAuth 2.0 Multiple Response Type Encoding Practices](https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html)

## Installation

```sh
npm i @badgateway/oauth2-client
```


## Usage

To get started, set up the Client class.


```typescript
import { OAuth2Client } from '@badgateway/oauth2-client';

const client = new OAuth2Client({

  // The base URI of your OAuth2 server
  server: 'https://my-auth-server/',

  // OAuth2 client id
  clientId: '...',

  // OAuth2 client secret. Only required for 'client_credentials', 'password'
  // flows. Don't specify this in insecure contexts, such as a browser using
  // the authorization_code flow.
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
const newToken = await client.refreshToken(oldToken);
```


### password grant:

```typescript
const token = await client.password({
  username: '..',
  password: '..',
});
```

### authorization_code

The `authorization_code` flow is the flow for browser-based applications,
and roughly consists of 3 major steps:

1. Redirect the user to an authorization endpoint, where they log in.
2. Authorization endpoint redirects back to app with a 'code' query
   parameter.
3. The `code` is exchanged for a access and refresh token.

This library provides support for these steps, but there's no requirement
to use its functionality as the system is mostly stateless.

```typescript
import { OAuth2Client, generateCodeVerifier } from 'client';

const client = new OAuth2Client({
  server: 'https://authserver.example/',
  clientId: '...',

  // Note, if urls cannot be auto-detected, also specify these:
  tokenEndpoint: '/token',
  authorizationEndpoint: '/authorize',
});
```

**Redirecting the user to the authorization server**

```typescript

/**
 * This generates a security code that must be passed to the various steps.
 * This is used for 'PKCE' which is an advanced security feature.
 *
 * It doesn't break servers that don't support it, but it makes servers that
 * so support it more secure.
 *
 * It's optional to pass this, but recommended.
 */
const codeVerifier = await generateCodeVerifier();

// In a browser this might work as follows:
document.location = await client.authorizationCode.getAuthorizeUri({

  // URL in the app that the user should get redirected to after authenticating
  redirectUri: 'https://my-app.example/',

  // Optional string that can be sent along to the auth server. This value will
  // be sent along with the redirect back to the app verbatim.
  state: 'some-string',

  codeVerifier,

  scope: ['scope1', 'scope2'],

});
```

**Handling the redirect back to the app and obtain token**

```typescript
const oauth2Token = await client.authorizationCode.getTokenFromCodeRedirect(
  document.location,
  {
    /**
     * The redirect URI is not actually used for any redirects, but MUST be the
     * same as what you passed earlier to "authorizationCode"
     */
    redirectUri: 'https://my-app.example/',

    /**
     * This is optional, but if it's passed then it also MUST be the same as
     * what you passed in the first step.
     *
     * If set, it will verify that the server sent the exact same state back.
     */
    state: 'some-string',

    codeVerifier,

  }
);
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
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

const client = new OAuth2Client({
  server: 'https://my-auth-server',
  clientId: 'my-client-id'
});


const fetchWrapper = new OAuth2Fetch({
  client: client,

  /**
   * You are responsible for implementing this function.
   * it's purpose is to supply the 'initial' oauth2 token.
   */
  getNewToken: async () => {

    // Example
    return client.clientCredentials();

    // Another example
    return client.authorizationCode.getToken({
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

After set up, you can just call `fetch` on the new object to call your API, and
the library will ensure there's always a `Bearer` header.

```typescript
const response = fetchWrapper.fetch('https://my-api', {
  method: 'POST',
  body: 'Hello world'
});
```

### Storing tokens for later use with FetchWrapper

To keep a user logged in between sessions, you may want to avoid full
reauthentication. To do this, you'll need to store authentication token
somewhere.

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
  },

  /**
   * Also an optional feature. Implement this if you want the wrapper to try a
   * stored token before attempting a full re-authentication.
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


### Fetch Middleware function

It might be preferable to use this library as a more traditional 'middleware'.

The OAuth2Fetch object also exposes a `mw` function that returns a middleware
for fetch.

```typescript
const mw = oauth2.mw();
const response = mw(
  myRequest,
  req => fetch(req)
);
```

This syntax looks a bit wild if you're not used to building middlewares, but
this effectively allows you to 'decorate' existing request libraries with
functionality from this oauth2 library.

A real example using the [Ketting](https://github.com/badgateway/ketting)
library:

```typescript
import { Client } from 'ketting';
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

/**
 * Create the oauth2 client
 */
const oauth2Client = new OAuth2Client({
  server: 'https://my-auth.example',
  clientId: 'foo',
});

/**
 * Create the 'fetch helper'
 */
const oauth2Fetch = new OAuth2Fetch({
  client: oauth2Client,
});

/**
 * Add the middleware to Ketting
 */
const ketting = new Client('http://api-root');
ketting.use(oauth2Fetch.mw());
```

### Introspection

Introspection ([RFC7662][3]) lets you find more information about a token,
such as whether it's valid, which user it belongs to, which oauth2 client
was used to generate it, etc.

To be able to use it, your authorization server must have support for the
introspection endpoint. It's location will be automatically detected using
the Metadata discovery document.

```typescript
import { OAuth2Client } from '@badgateway/oauth2-client';

const client = new Client({
  server: 'https://auth-server.example/',

  clientId: '...',

  /**
   * Some servers require OAuth2 clientId/clientSecret to be passed.
   * If they require it, specify it. If not it's fine to omit.
   */
  clientSecret: '...',

});

// Get a token
const token = client.clientCredentials();

// Introspect!
console.log(client.introspect(token));
```


## Support for older Node versions

This package works out of the box with modern browsers and Node 18.

To use this package with Node 16, you need to run:

```sh
npm i node-fetch@2
```

Version 2 is required, because version 3 has been rewritten in a non-backwards
compatible way with ESM.

After installing node-fetch, it must be registered globally:

```javascript
if (!global.fetch) {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}
```

On Node 14.x you also need the following polyfill:

```javascript
// For Node 14.x and below
if (global.btoa === undefined) {
  global.btoa = input => {
    return Buffer.from(input).toString('base64');
  };
}
```

[1]: https://datatracker.ietf.org/doc/html/rfc7636 "Proof Key for Code Exchange by OAuth Public Clients"
[2]: https://datatracker.ietf.org/doc/html/rfc8414 "OAuth 2.0 Authorization Server Metadata"
[3]: https://datatracker.ietf.org/doc/html/rfc7662 "OAuth 2.0 Token Introspection"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API "Web Crypto API"
[5]: https://datatracker.ietf.org/doc/html/rfc8707 "https://datatracker.ietf.org/doc/html/rfc8707"
[6]: https://datatracker.ietf.org/doc/html/rfc7009 "OAuth 2.0 Token Revocation"
