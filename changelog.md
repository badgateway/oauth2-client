Changelog
=========

3.0.0 (????-??-??)
------------------

* Dropped support for Node 14 and 16.
* Migrated the test suite from Mocha and Chai to node:test and node:assert
  (@Zen-cronic).


2.4.1 (2024-08-22)
------------------

* #151: Add 'Accept' header on token requests to fix a Github compatibility
  issue.
* #151: Throw error when we get an invalid reply from a token endpoint.


2.4.0 (2024-07-27)
------------------

* More robust error handling. When an error is emitted, you now give you access
  to the emitted HTTP Response and response body.
* Support for `response_mode=fragment` in the `authorization_code` flow.


2.3.0 (2024-02-03)
------------------

* Fix for #128: If there's no secret, we should never use Basic auth to encode
  the `client_id`.
* Support for the `resource` parameter from RFC 8707.
* Add support for `scope` parameter to `refresh()`.
* Support for RFC 7009, Token Revocation (@adambom).


2.2.4 (2023-09-05)
------------------

* Added `extraParams` option to `getAuthorizeUri`, allowing users to add
  non-standard arguments to the authorization URI for servers that require
  this. (@pks1989)


2.2.3 (2023-08-03)
------------------

* Moved the `tokenResponseToOAuth2Token` function inside the OAuth2Client
  class, allowing users to override the parsing logic more easily.


2.2.2 (2023-07-28)
------------------

* #111 Some documentation fixes.
* #110: Fix race condition with `getStoredToken` and calling `fetch()`
  immediately after constructing `FetchWrapper`.


2.2.1 (2023-07-07)
------------------

* #15: Fix for 'TypeError: Failed to execute 'fetch' on 'Window': Illegal
  invocation at t.OAuth2Client.request'.


2.2.0 (2023-04-26)
------------------

* Add an option to override which "fetch" implementation is used. (@bradjones1)


2.1.1 (2023-04-23)
------------------

* Re-release. Previous build had an error.


2.1.0 (2023-04-20)
------------------

* Allow users to provide non-standard properties to `client_credentials` token
  requests via an `extraParams` property. This is necessary to support vendors
  like Auth0 and Kinde which both require an `audience` parameter. (@South-Paw)
* Sending `client_id` and `client_secret` in POST request body is now
  optionally supported. By default the credentials will still be sent in the
  `Authorization` header, but users can opt-in to using the body. The
  authentication method will also be discovered if an OAuth2 or OpenID
  discovery document is used. (@parkerduckworth)
* The fetchWrapper now has an option to disable auto-refreshing tokens.
  (@bradjones1)
* Bug fix: If a 'state' parameter was not used in `authorization_code`, it
  should not be required in the redirect.
* Tested with Node 20.


2.0.18 (2023-04-13)
-------------------

* Didn't run `make build` before the last release, which causes some files in
  the `dist/` directory to be out of date.


2.0.17 (2022-10-02)
-------------------

* Correctly pass 'scope' to `authorization_code` redirects.


2.0.16 (2022-07-22)
-------------------

* It was not possible to generate the URL to the authorization endpoint with
  PKCE using Node, due to depending on a global `crypto` object. This is fixed
  with fallbacks all the way back to Node 14.


2.0.15 (2022-07-07)
-------------------

* #70: Sending the client secret is now supported with the `authorization_code`
  flow.


2.0.14 (2022-06-23)
-------------------

* Re-release, to publish on Github packages.


2.0.13 (2022-06-19)
-------------------

* Fixed some docs.


2.0.12 (2022-06-19)
-------------------

* First stable v2 release!
* Renamed this package from `fetch-mw-oauth2` to `@badgateway/oauth2-client`.
* #59: Scope support for `authorization_code` flow.


2.0.11 (2022-06-17)
-------------------

* Released with alpha tag.
* Re-published


2.0.10 (2022-05-10)
-------------------

* Released with alpha tag.
* Tested on Node 14, 16.
* Added polyfills for these node versions (see README).
* `generateCodeVerifier` is now async to support Node 14.


2.0.9 (2022-04-26)
------------------

* Released with alpha tag.
* Set `Content-Type` to `application/x-www-form-urlencoded`.


2.0.8 (2022-04-26)
------------------

* Released with alpha tag.
* Changing the `authorization_code` signature again. It's a bit hard to come up
  with a create signature for this, especially because there's multiple steps
  in the process, and some information has to survive these steps.


2.0.7 (2022-04-26)
------------------

* Released with alpha tag.
* Re-release (broken build).


2.0.6 (2022-04-26)
------------------

* Released with alpha tag.
* Removed redundant parameters.
* `authorization_code` should now also work correctly without PKCE.
* Removed some redundant arguments.


2.0.5 (2022-04-25)
------------------

* Released with alpha tag.
* PKCE support.


2.0.4 (2022-04-20)
------------------

* Released with alpha tag.
* remove `fetchMw` and add `mw()`. `mw()` now _returns_ a middleware function.


2.0.3 (2022-04-19)
------------------

* Released with alpha tag.
* Export `OAuth2AuthorizationCodeClient`
* Client.authorizationCode() should not have been `async`.


2.0.2 (2022-04-19)
------------------

* Released with alpha tag.
* Fix format for `introspect()` function.


2.0.1 (2022-04-19)
------------------

* Released with alpha tag.
* Fix introspection HTTP method name.


2.0.0 (2022-04-19)
------------------

The 2.0 version of this library is a complete rewrite. The original scope of
this library was to provide a wrapper around `fetch()` to add a `Bearer` token
and refresh this token under the hood, but it has now evolved into a
full-featured modern OAuth2 library. The existing 'fetch wrapper' still exists,
but it's not merely one of the features this package offers. The API has
changes, and while I think it shouldn't be difficult to migrate, v2 offers no
backwards compatibility so some rewrites will be required. New features
include:

* Complete support for the `authorization_code` flow, including generating
  redirect urls and parsing query parameters after redirect.
* Support for OAuth2 endpoint discovery, using the OAuth2 Authorization Server
  Metadata document. If your server supports it, just give the library a URL
  and it will figure out the rest. [RFC8414][2].
* Support for OAuth2 token introspection ([RFC7662][3]).
* Generally a better abstraction of the OAuth2 framework.
* Released with alpha tag.


1.0.0 (2021-10-28)
------------------

* Dropped support for Node 10.
* Fixed #45: Call `onAuthError` when a refresh fails.
* Replaced `awesome-typescript-loader` with `ts-loader` for Webpack builds. the
  former appears unmaintained.
* Switched from Travis CI to Github Actions.


0.7.7 (2021-02-22)
------------------

* Last version did not correctly build it's files.


0.7.6 (2021-02-22)
------------------

* Better error handling when the response we got was not a standard OAuth2
  error response body + adding information for when the Basic credentials were
  wrong.
* This fixes the bug when fetch-mw-oauth2 says there's an 'undefined' error.


0.7.5 (2020-12-03)
------------------

* Fixing a few broken links in package.json. Does not alter any behavior.


0.7.3 (2020-12-01)
------------------

* Re-publishing package. Previous version had an old build artifact.


0.7.2 (2020-12-01)
------------------

* Fixed bug that completely broke the token flow.


0.7.1 (2020-11-30)
------------------

* Fix bug in auto-refresh


0.7.0 (2020-11-30)
------------------

* Ensure that only 1 refresh operation will happen in parallel. If there are
  multiple things triggering the refresh, all will wait for the first one to
  finish.
* Automatically schedule a refresh operation 1 minute before the access token
  expires, if the expiry time is known.
* BC Break: If a token is known when setting up OAuth2, this now needs to be
  passed as the second argument. The old behavior still works but will emit a
  warning, and will be removed in a future release.
* 'OAuth2Token' type is now exported.


0.6.1 (2020-11-19)
------------------

* #34: Refresh operation failed for the `authorization_code` flow.


0.6.0 (2020-11-09)
------------------

* Added a onAuthError event, allowing users to intercept this event and
  re-authenticate.
* Simplify types a bit. More duplication in the library, but this should result
  in easier to read errors.
* Typescript 4
* Switch from tslint to eslint.
* Webpack 5


0.5.0 (2020-04-19)
------------------

* Added a `fetchMw()` function that takes a `next` argument so this package can
  behave as a more regular middleware.


0.4.2 (2019-12-09)
------------------

* Files were not correctly built in the last release.


0.4.1 (2019-12-09)
------------------

* Error code 401 will be submitted when authentication fails. Before, we would
  just forward the error code from the OAuth2 server, but this doesn't make a
  lot of sense for a `fetch()` user, as the error might be misinterpreted as an
  error unrelated to auth.


0.4.0 (2019-11-06)
------------------

* Added a `getOptions()` method, which allows a user to get all current tokens
  and store them in LocalStorage. These options can be used as-is in the
  constructor.


0.3.5 (2019-09-05)
------------------

* Include typescript sourcefiles in NPM package, for IDE's.


0.3.4 (2019-03-19)
------------------

* This package now throws OAuth2Error classes for server-side errors.


0.3.3 (2019-03-18)
------------------

* When refreshing a token, browsers don't allow re-use of the same `Request`
  object. Now we're cloning it before use.


0.3.2 (2019-03-13)
------------------

* When refreshing a token, and there's no `client_secret`, the `client_id` must
  be sent in the body.


0.3.1 (2019-03-13)
------------------

* Now correctly exporting all the right symbols.


0.3.0 (2019-03-13)
------------------

* Library is refactored and now uses a class.
* Support for `authorization_code` grant type.
* Exposing some more information to uses.
* Add a new `onTokenUpdate` hook for custom storage.
* It's now possible to construct a client with an existing (old) Access and/or
  refresh token.


0.2.1 (2019-03-13)
------------------

* Shipping `dist/` instead of `src/`.
* Making a browser build lean by not relying on `querystring` or `Buffer`.


0.2.0 (2019-03-12)
------------------

* First public version
* Support for `client_credentials`, `password` and `refresh_token`.
* Will automatically attempt to refresh tokens if it knows an access token is
  expired.

[1]: https://datatracker.ietf.org/doc/html/rfc7636 "Proof Key for Code Exchange
     by OAuth Public Clients"
[2]: https://datatracker.ietf.org/doc/html/rfc8414 "OAuth 2.0 Authorization
     Server Metadata"
[3]: https://datatracker.ietf.org/doc/html/rfc7662 "OAuth 2.0 Token
     Introspection"
