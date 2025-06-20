import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

describe('jwt-bearer', () => {

  it('should work with client_secret_post', async () => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
    });

    const result = await client.jwtBearer({
      assertion: 'foobar',
      scope: ['hello', 'world']
    });

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.be.null;
    expect(request.headers.get('Accept')).to.equal('application/json');

    expect(request.body).to.eql({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: 'foobar',
      scope: 'hello world',
      client_id: 'test-client-id'
    });
  });

});
