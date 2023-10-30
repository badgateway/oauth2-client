import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

describe('OAuth2Client', () => {
  const server = testServer();

  describe('Token revocation', () => {
    it('should revoke access token when requested', async () => {

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
          expect(request.body).to.eql({
            token: token.accessToken,
            token_type_hint: 'access_token',
          });
        });
      });

      describe('When token type is specified as access token', () => {
        it('should supply access token', async () => {
          await client.revoke(token, 'access_token');

          const request = server.lastRequest();
          expect(request.body).to.eql({
            token: token.accessToken,
            token_type_hint: 'access_token',
          });
        });
      });

      describe('When token type is specified as refresh token', () => {
        it('should supply access token', async () => {
          await client.revoke(token, 'refresh_token');

          const request = server.lastRequest();
          expect(request.body).to.eql({
            token: token.refreshToken,
            token_type_hint: 'refresh_token',
          });
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
      const result = await client.getEndpoint('revocationEndpoint');
      expect(result).to.equal(server.url + '/revoke');
    });
  });
});
