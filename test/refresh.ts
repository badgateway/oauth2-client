import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

describe('refreshing tokens', () => {

  it('should work', async () => {

    const server = testServer();

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

    expect(result.accessToken).to.equal('access_token_001');
    expect(result.refreshToken).to.equal('refresh_token_001');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));
    expect(request.headers.get('Accept')).to.equal('application/json');

    expect(request.body).to.eql({
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token_000',
    });
  });

  it('should re-use the old refresh token if no new one was issued', async () => {

    const server = testServer();

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

    expect(result.accessToken).to.equal('access_token_002');
    expect(result.refreshToken).to.equal('refresh_token_001');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));
    expect(request.headers.get('Accept')).to.equal('application/json');

    expect(request.body).to.eql({
      grant_type: 'refresh_token',
      refresh_token: 'refresh_token_001',
    });
  });
});
