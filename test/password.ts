import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

import { testServer } from './test-server.js';

describe('password', () => {
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

    const result = await client.password({
      username: 'user123',
      password: 'password',
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
      grant_type: 'password',
      password: 'password',
      username: 'user123',
    });
  });

  it('should work with client_secret_post', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      authenticationMethod: 'client_secret_post',
    });

    const result = await client.password({
      username: 'user123',
      password: 'password',
    });

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();

    assert.deepEqual(request.body, {
      grant_type: 'password',
      password: 'password',
      username: 'user123',
      client_id: 'test-client-id',
    });
  });

  it('should support the resource parameter', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      authenticationMethod: 'client_secret_post',
    });
    const resource = ['https://example/resource1', 'https://example/resource2'];

    const result = await client.password({
      username: 'user123',
      password: 'password',
      resource,
    });

    assert.equal(result.accessToken, 'access_token_000');
    assert.equal(result.refreshToken, 'refresh_token_000');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();

    assert.deepEqual(request.body, {
      grant_type: 'password',
      password: 'password',
      username: 'user123',
      client_id: 'test-client-id',
      resource,
    });
  });
});
