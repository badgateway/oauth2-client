import * as assert from 'node:assert';
import { testServer } from './test-server.ts';
import { OAuth2Client } from '../src/index.ts';
import { after, describe, it } from 'node:test';

describe('token-exchange', () => {
  let server: ReturnType<typeof testServer>;

  after(async () => {
    if (server) {
      await server.close();
    }
  });

  it('should exchange a subject token for a new token', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
      authenticationMethod: 'client_secret_basic',
    });

    const result = await client.tokenExchange({
      subjectToken: 'subject_token_000',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
    });

    assert.equal(result.accessToken, 'exchanged_access_token');
    assert.equal(result.refreshToken, null);
    assert.ok((result.expiresAt as number) <= Date.now() + 300_000);
    assert.ok((result.expiresAt as number) >= Date.now() + 200_000);
    assert.deepEqual(result.extraParams, {
      issued_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    });

    const request = server.lastRequest();
    assert.equal(
      request.headers.get('Authorization'),
      'Basic ' + btoa('testClientId:testClientSecret')
    );
    assert.deepEqual(request.body, {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: 'subject_token_000',
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
    });
  });

  it('should send the optional parameters', async () => {
    server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'testClientId',
      clientSecret: 'testClientSecret',
      authenticationMethod: 'client_secret_basic',
    });

    await client.tokenExchange({
      subjectToken: 'subject_token_000',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      actorToken: 'actor_token_000',
      actorTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      scope: ['foo', 'bar'],
      resource: 'https://api.example/account/acme',
      audience: 'api',
    });

    const request = server.lastRequest();
    assert.deepEqual(request.body, {
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: 'subject_token_000',
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      actor_token: 'actor_token_000',
      actor_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      requested_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      scope: 'foo bar',
      resource: 'https://api.example/account/acme',
      audience: 'api',
    });
  });

  it('should require actorTokenType with actorToken', async () => {
    const client = new OAuth2Client({
      server: 'http://localhost',
      tokenEndpoint: '/token',
      clientId: 'testClientId',
    });

    await assert.rejects(
      client.tokenExchange({
        subjectToken: 'subject_token_000',
        subjectTokenType: 'urn:ietf:params:oauth:token-type:access_token',
        actorToken: 'actor_token_000',
      }),
      /actorTokenType must be provided with actorToken/,
    );
  });
});
