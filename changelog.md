Changelog
=========

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
