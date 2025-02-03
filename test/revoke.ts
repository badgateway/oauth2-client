import * as assert from 'node:assert';
import { after, describe, it } from 'node:test';

import { OAuth2Endpoint } from '../src/client.js';
import { OAuth2Client } from '../src/index.js';
import { OAuth2TokenTypeHint } from '../src/messages.js';

import { testServer } from './test-server.js';

describe('Token revocation', () => {
  const server = testServer();

  after(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('should revoke access token when requested', async () => {
    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      revocationEndpoint: '/revoke',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const token = await client.clientCredentials();

    describe('When token type hint is not specified', () => {
      it('should assume token type is access token', async () => {
        await client.revoke(token);

        const request = server.lastRequest();
        assert.deepEqual(request.body, {
          token: token.external.token,
          token_type_hint: OAuth2TokenTypeHint.AccessToken,
        });
      });
    });

    describe('When token type is specified as access token', () => {
      it('should supply access token', async () => {
        await client.revoke(token, OAuth2TokenTypeHint.AccessToken);

        const request = server.lastRequest();
        assert.deepEqual(request.body, {
          token: token.external.token,
          token_type_hint: OAuth2TokenTypeHint.AccessToken,
        });
      });
    });

    describe('When token type is specified as refresh token', () => {
      it('should supply access token', async () => {
        await client.revoke(token, OAuth2TokenTypeHint.RefreshToken);

        const request = server.lastRequest();
        assert.deepEqual(request.body, {
          token: token.internal.token,
          token_type_hint: OAuth2TokenTypeHint.RefreshToken,
        });
      });
    });
  });

  describe('Discovery', () => {
    const client = new OAuth2Client({
      server: server.url,
      discoveryEndpoint: '/discover',
      clientId: 'test-client-id',
    });

    it('Should discover revocation endpoint', async () => {
      const result = await client.getEndpoint(OAuth2Endpoint.RevocationEndpoint);
      assert.deepEqual(result, server.url + '/revoke');
    });
  });
});
