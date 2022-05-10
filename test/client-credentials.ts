import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

describe('client-credentials', () => {

  it('should work', async() => {

    const server = testServer();

    const client = new OAuth2Client({
      server: 'http://localhost:44444',
      tokenEndpoint: '/token/client-credentials',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.clientCredentials();

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    server.close();

  });

});
