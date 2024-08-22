import { testServer } from './test-server';
import { OAuth2Client, OAuth2HttpError } from '../src';
import { expect } from 'chai';

describe('client-credentials', () => {

  it('should work with client_secret_basic', async () => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.clientCredentials();

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));

    expect(request.body).to.eql({
      grant_type: 'client_credentials',
    });
  });
  it('should support extra parameters', async() => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const result = await client.clientCredentials({
      extraParams: {
        foo: 'bar',
      }
    });

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));
    expect(request.headers.get('Accept')).to.equal('application/json');

    expect(request.body).to.eql({
      grant_type: 'client_credentials',
      foo: 'bar',
    });
  });

  it('should work with client_secret_post', async () => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      authenticationMethod: 'client_secret_post'
    });

    const result = await client.clientCredentials();

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();

    expect(request.body).to.eql({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'client_credentials'
    });
  });
  it('should support the resource parameter', async() => {

    const server = testServer();

    const client = new OAuth2Client({
      server: server.url,
      tokenEndpoint: '/token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });

    const resource = [
      'https://example/resource1',
      'https://example/resource2',
    ];

    const result = await client.clientCredentials({
      resource,
    });

    expect(result.accessToken).to.equal('access_token_000');
    expect(result.refreshToken).to.equal('refresh_token_000');
    expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
    expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

    const request = server.lastRequest();
    expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));

    expect(request.body).to.eql({
      grant_type: 'client_credentials',
      resource,
    });
  });

  describe('error handling', async() => {

    it('should create a OAuth2HttpError if an error was thrown', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'oauth2-error',
        clientSecret: 'test-client-secret',
        authenticationMethod: 'client_secret_post'
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err:any) {

        expect(err).to.be.instanceof(OAuth2HttpError);
        expect(err.response).to.be.instanceof(Response);
        expect(err.oauth2Code).to.equal('invalid_client');
        expect(err.parsedBody).to.deep.equal({
          error: 'invalid_client',
          error_description: 'OOps!',
        });

      }

    });
    it('should create a OAuth2HttpError also if a non-oauth2 error was thrown with a JSON response', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'json-error',
        clientSecret: 'test-client-secret',
        authenticationMethod: 'client_secret_post'
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err:any) {

        expect(err).to.be.instanceof(OAuth2HttpError);
        expect(err.response).to.be.instanceof(Response);
        expect(err.httpCode).to.equal(418);
        expect(err.oauth2Code).to.equal(null);
        expect(err.parsedBody).to.deep.equal({
          status: 418,
          title: 'OOps!',
          type: 'https://example/dummy',
        });

      }

    });
    it('should create a OAuth2HttpError when a generic HTTP error was thrown ', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'general-http-error',
        clientSecret: 'test-client-secret',
        authenticationMethod: 'client_secret_post'
      });

      const resource = [
        'https://example/resource1',
        'https://example/resource2',
      ];

      try {
        await client.clientCredentials({
          resource,
        });
        throw new Error('This operation should have failed');
      } catch (err:any) {

        expect(err).to.be.instanceof(OAuth2HttpError);
        expect(err.response).to.be.instanceof(Response);
        expect(err.oauth2Code).to.equal(null);
        expect(err.parsedBody).to.equal(undefined);

      }

    });

  });

});
