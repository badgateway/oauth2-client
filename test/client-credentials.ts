import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Client, OAuth2HttpError } from '../src/index.js';

import { testServer } from './test-server.js';

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
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.clientCredentials();

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('test-client-id:test-client-secret')
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
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
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
      'Basic ' + btoa('test-client-id:test-client-secret')
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
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authenticationMethod: 'client_secret_post',
    });

    const result = await client.clientCredentials();

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();

    assert.deepEqual(request.body, {
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'client_credentials',
    });
  });
  it('should support the resource parameter', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
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
      'Basic ' + btoa('test-client-id:test-client-secret')
    );

    assert.deepEqual(request.body, {
      grant_type: 'client_credentials',
      resource,
    });
  });

  describe('error handling', async () => {
    it('should create a OAuth2HttpError if an error was thrown', async () => {
      server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'oauth2-error',
        clientSecret: 'test-client-secret',
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
        clientSecret: 'test-client-secret',
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
        clientSecret: 'test-client-secret',
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
