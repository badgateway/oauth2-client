Changelog
=========

0.7.7 (2021-02-22)
------------------

* Last version did not correctly build it's files.


0.7.6 (2021-02-22)
------------------

* Better error handling when the response we got was not a standard OAuth2
  error response body + adding information for when the Basic credentials
  were wrong.
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
  multiple things triggering the refresh, all will wait for the first one
  to finish.
* Automatically schedule a refresh operation 1 minute before the access token
  expires, if the expiry time is known.
* BC Break: If a token is known when setting up OAuth2, this now needs to be
  passed as the second argument. The old behavior still works but will emit
  a warning, and will be removed in a future release.
* 'OAuth2Token' type is now exported.


0.6.1 (2020-11-19)
------------------

* #34: Refresh operation failed for the `authorization_code` flow.


0.6.0 (2020-11-09)
------------------

* Added a onAuthError event, allowing users to intercept this event and
  re-authenticate.
* Simplify types a bit. More duplication in the library, but this should
  result in easier to read errors.
* Typescript 4
* Switch from tslint to eslint.
* Webpack 5


0.5.0 (2020-04-19)
------------------

* Added a `fetchMw()` function that takes a `next` argument so this package
  can behave as a more regular middleware.


0.4.2 (2019-12-09)
------------------

* Files were not correctly built in the last release.


0.4.1 (2019-12-09)
------------------

* Error code 401 will be submitted when authentication fails. Before, we would
  just forward the error code from the OAuth2 server, but this doesn't make a
  lot of sense for a `fetch()` user, as the error might be misinterpreted as
  an error unrelated to auth.


0.4.0 (2019-11-06)
------------------

* Added a `getOptions()` method, which allows a user to get all current
  tokens and store them in LocalStorage. These options can be used as-is in
  the constructor.

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

* When refreshing a token, and there's no `client_secret`, the `client_id`
  must be sent in the body.


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
