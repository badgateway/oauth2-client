import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

import { testServer, TOKEN_TYPE } from './test-server.js';

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
      external: {
        token: 'access_token_000',
        type: TOKEN_TYPE.Bearer,
        expiresAt: 300,
      },
      internal: {
        token: 'refresh_token_000',
        type: TOKEN_TYPE.Bearer,
        expiresAt: 3600,
      },
    });

    assert.equal(result.external.token, 'access_token_001');
    assert.equal(result.internal.token, 'refresh_token_001');
    assert.ok((result.external.expiresAt as number) <= Date.now() + 300_000);
    assert.ok((result.external.expiresAt as number) <= Date.now() + 3600_000);
    assert.equal(result.external.type, TOKEN_TYPE.Bearer);
    assert.equal(result.internal.type, TOKEN_TYPE.Bearer);

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
      external: {
        token: 'access_token_001',
        type: TOKEN_TYPE.Bearer,
        expiresAt: 300,
      },
      internal: {
        token: 'refresh_token_001',
        type: TOKEN_TYPE.Bearer,
        expiresAt: 3600,
      },
    });

    assert.equal(result.external.token, 'access_token_002');
    assert.equal(result.internal.token, 'refresh_token_002');
    assert.ok((result.external.expiresAt as number) <= Date.now() + 300_000);
    assert.ok((result.internal.expiresAt as number) <= Date.now() + 3600_000);
    assert.equal(result.external.type, TOKEN_TYPE.Bearer);
    assert.equal(result.internal.type, TOKEN_TYPE.Bearer);

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
