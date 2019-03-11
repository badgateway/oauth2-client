# fetch-mw-oauth2

This library adds support to OAuth2 to fetch by wrapping the fetch function.
It works both for `fetch()` in a browser, as well as [node-fetch][1].

## Installation

```sh
npm i fetch-mw-oauth2
```

## Usage

The `fetch-mw-oauth2` package effectively works as follows:

1. You pass it set up instructions
2. It returns a new `fetch()`-like function.

This new `fetch()` function can now be used in place of the regular fetch,
but it takes responsibility of oauth2 authentication.

```javascript
const fetchMwOauth2 = require('fetch-mw-oauth2');

const newFetch = fetchMwOAuth2({
  clientId: '...',
  clientSecret: '...',
  grantType: 'client_credentials',
  authorizationUri: 'https://github.com/login/oauth/authorize',
  scopes: ['foo', 'bar'],
});

const response = await newFetch('https://api.example.org');
```

## Project status

The current features have been implemented:

1. Nothing

The following features are planned near-term:

1. `client_credentials` grant-type support.
2. `password` grant-type support.
2. Automatically refreshing tokens

The following features are planned mid/long-term

1. Supply an OAuth2 discovery document instead of authorization and token uris.
2. Supply a known access token and refresh token instead of going through the
   flow of obtaining these.
3. `authorization_code` grant-type support
4. `implicit` grant-type support
5. Custom token storage (allowing people to store tokens in for example
   LocalStorage).


[1]: https://www.npmjs.com/package/node-fetch
