import * as assert from 'node:assert';
import { testServer } from './test-server.ts';
import { OAuth2Client, OAuth2HttpError } from '../src/index.ts';
import { after, describe, it } from 'node:test';

describe('client-credentials', () => {
  let server: ReturnType<typeof testServer>;

  after(async () => {
    if (server) {
      await server.close();
    }

  });
  it('should work with client_secret_basic', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId:10',
      clientSecret: 'test=client=secret',
    });

    const result = await client.clientCredentials();

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('testClientId%3A10:test%3Dclient%3Dsecret')
    );

    assert.deepEqual(request.body, {
      grant_type: 'client_credentials',
    });
  });
  it('should support extra parameters', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    });

    const result = await client.clientCredentials({
      extraParams: {
        foo: 'bar',
      },
    });

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('testClientId:testClientSecret')
    );
    assert.equal(request.headers.get('Accept'), 'application/json');

    assert.deepEqual(request.body, {
      grant_type: 'client_credentials',
      foo: 'bar',
    });
  });

  it('should work with client_secret_post', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
      authenticationMethod: 'client_secret_post',
    });

    const result = await client.clientCredentials();

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();

    assert.deepEqual(request.body, {
      client_id: 'testClientId',
      client_secret: 'testClientSecret',
      grant_type: 'client_credentials',
    });
  });
  it('should support the resource parameter', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
    });

    const resource = ['https://example/resource1', 'https://example/resource2'];

    const result = await client.clientCredentials({
      resource,
    });

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('testClientId:testClientSecret')
    );

    assert.deepEqual(request.body, {
      grant_type: 'client_credentials',
      resource,
    });
  });
  it('should return an idToken if it was returned from the server', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
    });
    const token = await client.tokenResponseToOAuth2Token(
      Promise.resolve({
        token_type: 'bearer',
        access_token: 'foo',
        id_token: 'bar',
        refresh_token: 'baz',
      })
    );

    assert.deepEqual(token, {
      accessToken: 'foo',
      idToken: 'bar',
      expiresAt: null,
      refreshToken: 'baz',
    });
  });

  describe('error handling', async () => {
    it('should create a OAuth2HttpError if an error was thrown', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'oauth2-error',
        clientSecret: 'testClientSecret',
        authenticationMethod: 'client_secret_post',
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err: any) {
        assert.ok(err instanceof OAuth2HttpError);
        assert.ok(err.response instanceof Response);
        assert.equal(err.oauth2Code, 'invalid_client');
        assert.deepEqual(err.parsedBody, {
          error: 'invalid_client',
          error_description: 'OOps!',
        });
      }
    });
    it('should create a OAuth2HttpError also if a non-oauth2 error was thrown with a JSON response', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'json-error',
        clientSecret: 'testClientSecret',
        authenticationMethod: 'client_secret_post',
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err: any) {
        assert.ok(err instanceof OAuth2HttpError);
        assert.ok(err.response instanceof Response);
        assert.equal(err.httpCode, 418);
        assert.equal(err.oauth2Code, null);
        assert.deepEqual(err.parsedBody, {
          status: 418,
          title: 'OOps!',
          type: 'https://example/dummy',
        });
      }
    });
    it('should create a OAuth2HttpError when a generic HTTP error was thrown ', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'general-http-error',
        clientSecret: 'testClientSecret',
        authenticationMethod: 'client_secret_post',
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err: any) {
        assert.ok(err instanceof OAuth2HttpError);
        assert.ok(err.response instanceof Response);
        assert.equal(err.oauth2Code, null);
        assert.equal(err.parsedBody, undefined);
      }
    });

  });
});
