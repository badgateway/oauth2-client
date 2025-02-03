import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

import { testServer } from './test-server.js';

// Example directly taken from https://datatracker.ietf.org/doc/html/rfc7636
const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('authorization-code', () => {
  let server: ReturnType<typeof testServer>;

  after(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Authorization endpoint redirect', () => {
    it('should generate correct urls for the authorization endpoint', async () => {
      server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'a b',
      });

      assert.equal(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
          scope: ['a', 'b'],
        }),
        server.url + '/authorize?' + params.toString()
      );
    });
    it('should support extraparams', async () => {
      server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri,
        scope: 'a b',
        foo: 'bar',
      });

      assert.equal(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
          scope: ['a', 'b'],
          extraParams: {
            foo: 'bar',
          },
        }),
        server.url + '/authorize?' + params.toString()
      );
    });
    it('should throw error when user rewrote params by extraparams', async () => {
      server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = {
        redirectUri,
        scope: ['a', 'b'],
        state: 'some-state',
      };

      const extraParams = {
        foo: 'bar',
        scope: 'accidentally rewrote core parameter',
      };

      try {
        await client.authorizationCode.getAuthorizeUri({
          ...params,
          extraParams,
        });
      } catch (error: any) {
        assert.match(error.message, /Property in extraParams/);
        return;
      }

      assert.fail('Should have thrown');
    });
    it('should support PKCE', async () => {
      server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
      });

      assert.equal(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
          codeVerifier,
        }),
        server.url + '/authorize?' + params.toString()
      );
    });
    it('should support the resource parameter', async () => {
      server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';
      const resource = ['https://example/foo1', 'https://example/foo2'];
      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri,
      });
      for (const r of resource) params.append('resource', r);

      assert.equal(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
          resource,
        }),
        server.url + '/authorize?' + params.toString()
      );
    });
  });

  describe('Token endpoint calls', () => {
    it('should send requests to the token endpoint', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
      });

      assert.equal(result.accessToken, 'access_token_000');
      assert.equal(result.refreshToken, 'refresh_token_000');
      assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
      assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

      const request = server.lastRequest();
      assert.equal(request.headers.get('Authorization'), null);
      assert.equal(request.headers.get('Accept'), 'application/json');

      assert.deepEqual(request.body, {
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
      });
    });

    it('should send client_id and client_secret in the Authorization header if secret was specified', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
      });

      assert.equal(result.accessToken, 'access_token_000');
      assert.equal(result.refreshToken, 'refresh_token_000');
      assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
      assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

      const request = server.lastRequest();
      assert.equal(
        request.headers.get('Authorization'),
        'Basic ' + btoa('test-client-id:test-client-secret')
      );
      assert.equal(request.headers.get('Accept'), 'application/json');

      assert.deepEqual(request.body, {
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
      });
    });

    it('should should support PKCE', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
        codeVerifier,
      });

      assert.equal(result.accessToken, 'access_token_000');
      assert.equal(result.refreshToken, 'refresh_token_000');
      assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
      assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

      const request = server.lastRequest();
      assert.equal(request.headers.get('Authorization'), null);
      assert.equal(request.headers.get('Accept'), 'application/json');

      assert.deepEqual(request.body, {
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        code_verifier: codeVerifier,
        redirect_uri: 'http://example/redirect',
      });
    });
    it('should not use Basic Auth if no secret is provided, even if client_secret_basic is set.', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
        authenticationMethod: 'client_secret_basic',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
      });

      assert.equal(result.accessToken, 'access_token_000');
      assert.equal(result.refreshToken, 'refresh_token_000');
      assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
      assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

      const request = server.lastRequest();
      assert.equal(request.headers.get('Authorization'), null);
      assert.equal(request.headers.get('Accept'), 'application/json');

      assert.deepEqual(request.body, {
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
      });
    });

    it('should support the resource parameter', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
      });
      const resource = ['https://example/foo1', 'https://example/foo2'];

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
        resource,
      });

      assert.equal(result.accessToken, 'access_token_000');
      assert.equal(result.refreshToken, 'refresh_token_000');
      assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
      assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

      const request = server.lastRequest();
      assert.equal(request.headers.get('Authorization'), null);
      assert.equal(request.headers.get('Accept'), 'application/json');

      assert.deepEqual(request.body, {
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
        resource,
      });
    });
  });

  describe('validateResponse', () => {
    const client = new OAuth2Client({
      server: 'http://foo/',
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
    });

    it('should correctly parse a valid URI from a OAUth2 server redirect', () => {
      assert.deepEqual(
        client.authorizationCode.validateResponse(
          'https://example/?code=123&scope=scope1%20scope2',
          {}
        ),
        {
          code: '123',
          scope: ['scope1', 'scope2'],
        }
      );
    });
    it('should work when paramaters are set into the fragment', () => {
      assert.deepEqual(
        client.authorizationCode.validateResponse(
          'https://example/#code=123&scope=scope1%20scope2',
          {}
        ),
        {
          code: '123',
          scope: ['scope1', 'scope2'],
        }
      );
    });
    it('should validate the state parameter', () => {
      assert.deepEqual(
        client.authorizationCode.validateResponse(
          'https://example/?code=123&scope=scope1%20scope2&state=my-state',
          { state: 'my-state' }
        ),
        {
          code: '123',
          scope: ['scope1', 'scope2'],
        }
      );
    });
    it('should error if the state did not match', () => {
      let caught = false;
      try {
        client.authorizationCode.validateResponse(
          'https://example/?code=123&scope=scope1%20scope2',
          { state: 'my-state' }
        );
      } catch (_err) {
        caught = true;
      }
      assert.equal(caught, true);
    });
  });
});
