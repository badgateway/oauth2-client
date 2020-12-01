# fetch-mw-oauth2

This library adds support to OAuth2 to fetch by wrapping the fetch function.
It works both for `fetch()` in a browser, as well as [node-fetch][1].

## Installation

```sh
npm i fetch-mw-oauth2
```

## Usage

The `fetch-mw-oauth2` package effectively works as follows:

1. You pass it OAuth2 instructions
2. It returns an object with a new `fetch()` function.

This new `fetch()` function can now be used in place of the regular fetch,
but it takes responsibility of oauth2 authentication.

### Setup with access and/or refresh token

If you already have an access and/or refresh token obtained through other
means, you can set up the object as such:

```javascript
const { OAuth2 } = require('fetch-mw-oauth2');

const oauth2 = new OAuth2({
  clientId: '...',
  clientSecret: '...', // Optional in some cases
  tokenEndpoint: 'https://auth.example.org/token',
}, {
  accessToken: '...',
  refreshToken: '...',
});

const response = await oauth2.fetch('https://my-api.example.org/articles', {
  method: 'POST',
  body: 'Hello world',
});
```

The fetch function simply calls the javascript `fetch()` function but adds
an `Authorization: Bearer ...` header.

### Setup via authorization_code grant

```javascript
const { OAuth2 } = require('fetch-mw-oauth2');

const oauth2 = new OAuth2({
  grantType: 'authorization_code',
  clientId: '...',
  code: '...',
  redirect_uri: 'https://my-app.example.org/cb',
  tokenEndpoint: 'https://auth.example.org/token',
  codeVerifier: '...' // If PKCE was used in authorization request
});
```

The library does not take responsibility for redirecting a user to an
authorization endpoint and redirecting back. That's up to you. After that's
done though, you should have a `code` variable that you can use to setup
the OAuth2 object.


### Setup via 'password' grant

```javascript
const { OAuth2 } = require('fetch-mw-oauth2');

const oauth2 = new OAuth2({
  grantType: 'password',
  clientId: '...',
  clientSecret: '...',
  userName: '...',
  password: '...',
  tokenEndpoint: 'https://auth.example.org/token',
});
```

### Setup via 'client_credentials' grant

```javascript
const { OAuth2 } = require('fetch-mw-oauth2');

const oauth2 = new OAuth2({
  grantType: 'client_credentials',
  clientId: '...',
  clientSecret: '...',
  tokenEndpoint: 'https://auth.example.org/token',
});
```

## fetchMw function

It might be preferable to use this library as a more traditional 'middleware'.

The OAuth2 object also exposes a `fetchMw` function that takes 2 arguments:

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

The following features are planned mid/long-term

1. Supply an OAuth2 discovery document instead of authorization and token uris.
2. `implicit` grant-type support

[1]: https://www.npmjs.com/package/node-fetch
