import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

import { testServer } from './test-server.js';

describe('refreshing tokens', () => {

  let server: ReturnType<typeof testServer>;
  after(async () => {
    if (server) {
      await server.close();
    }

  });
  it('should work', async () => {

    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.refreshToken({
      refreshToken: 'refresh_token_000',
      accessToken: 'access_token_000',
      expiresAt: null,
    });

    assert.equal(result.accessToken, 'access_token_001');
    assert.equal(result.refreshToken, 'refresh_token_001');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('test-client-id:test-client-secret')
    );
    assert.equal(
      request.headers.get('Accept'),
      'application/json'
    );

    assert.deepEqual(request.body,{
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token_000',
    });
  });

  it('should re-use the old refresh token if no new one was issued', async () => {

    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.refreshToken({
      refreshToken: 'refresh_token_001',
      accessToken: 'access_token_001',
      expiresAt: null,
    });

    assert.equal(result.accessToken, 'access_token_002');
    assert.equal(result.refreshToken, 'refresh_token_001');
    assert.ok((result.expiresAt as number) <= Date.now() + 3600_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 3500_000);

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('test-client-id:test-client-secret')
    );
    assert.equal(
      request.headers.get('Accept'),
      'application/json'
    );

    assert.deepEqual(request.body,{
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token_001',
    });
  });
});
