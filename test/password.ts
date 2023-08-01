import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

describe('password', () => {

  it('should work with client_secret_basic', async () => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.password({
      username: 'user123',
      password: 'password'
    });

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.idToken).to.equal('id_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));

    expect(request.body).to.eql({
      grant_type: 'password',
      password: 'password',
      username: 'user123'
    });
  });

  it('should work with client_secret_post', async () => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      authenticationMethod: 'client_secret_post'
    });

    const result = await client.password({
      username: 'user123',
      password: 'password'
    });

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.idToken).to.equal('id_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();

    expect(request.body).to.eql({
      grant_type: 'password',
      password: 'password',
      username: 'user123',
      client_id: 'test-client-id'
    });
  });

});
