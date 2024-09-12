Contributing to this project
============================

Thank you for considering to add to this project! Before you start writing code, here's a few tips:

Small changes / Bugfixes
------------------------

Make sure you target the `version-2.x` branch when you're working on your change and submitting your PR.
The `main` branch will become Version 3, which is currently unreleased and will have a few breaking changes,
such as switching to ESM and dropping support for older Node versions.

There's no release date for 3.x, so if you want your compact change in the next release: base it on `version-2.x`.

Large changes / Major features / new OAuth2 flow/features/grant types
---------------------------------------------------------------------

Drop me a line first with your plan before you start! I'm very open to adding things from the OAuth2 ecosystem,
but getting alignment on the approach can potentially save time. Since I'm likely the person to maintain your
feature after it was merged, I want to have high confidence I understand it really well, and I'm still learning
this massive ecosystem.

OpenID Connect
--------------

Currently this library will not expand it's scope to support OpenID Connect. The main reason is that it requires
bringing in a JWT library, which is in conflict with the design goal of making a 0-dependency, lean OAuth2 library.

This may change in the future, but right now OpenID is not a goal.

However, I am open to small additions / new parameters to this library from the OpenID suite of standards.
For example, this library supports the `response_mode` parameter.

