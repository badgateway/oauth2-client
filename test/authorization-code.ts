import { testServer } from './test-server';
import { OAuth2Client } from '../src';
import { expect } from 'chai';

// Example directly taken from https://datatracker.ietf.org/doc/html/rfc7636
const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

describe('authorization-code', () => {

  describe('Authorization endpoint redirect', () => {

    it('should generate correct urls for the authorization endpoint', async() => {

      const server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri
      });

      expect(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
        })
      ).to.equal(server.url + '/authorize?' + params.toString());

    });
    it('should support PKCE', async() => {

      const server = testServer();
      const client = new OAuth2Client({
        server: server.url,
        authorizationEndpoint: '/authorize',
        clientId: 'test-client-id',
      });

      const redirectUri = 'http://my-app.example/redirect';

      const params = new URLSearchParams({
        client_id: 'test-client-id',
        response_type: 'code',
        redirect_uri: redirectUri,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      expect(
        await client.authorizationCode.getAuthorizeUri({
          redirectUri,
          codeVerifier,
        })
      ).to.equal(server.url + '/authorize?' + params.toString());

    });

  });

  describe('Token endpoint calls', () => {

    it('should send requests to the token endpoint', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
      });

      expect(result.accessToken).to.equal('access_token_000');
      expect(result.refreshToken).to.equal('refresh_token_000');
      expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
      expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

      const request = server.lastRequest();
      expect(request.headers.get('Authorization')).to.equal(null);

      expect(request.body).to.eql({
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
      });

    });

    it('should send client_id and client_secret in the Authorization header if secret was specified', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
      });

      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
      });

      expect(result.accessToken).to.equal('access_token_000');
      expect(result.refreshToken).to.equal('refresh_token_000');
      expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
      expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

      const request = server.lastRequest();
      expect(request.headers.get('Authorization')).to.equal('Basic ' + btoa('test-client-id:test-client-secret'));

      expect(request.body).to.eql({
        grant_type: 'authorization_code',
        code: 'code_000',
        redirect_uri: 'http://example/redirect',
      });

    });

    it('should should support PKCE', async() => {

      const server = testServer();

      const client = new OAuth2Client({
        server: server.url,
        tokenEndpoint: '/token',
        clientId: 'test-client-id',
      });


      const result = await client.authorizationCode.getToken({
        code: 'code_000',
        redirectUri: 'http://example/redirect',
        codeVerifier,
      });

      expect(result.accessToken).to.equal('access_token_000');
      expect(result.refreshToken).to.equal('refresh_token_000');
      expect(result.expiresAt).to.be.lessThanOrEqual(Date.now() + 3600_000);
      expect(result.expiresAt).to.be.greaterThanOrEqual(Date.now() + 3500_000);

      const request = server.lastRequest();
      expect(request.headers.get('Authorization')).to.equal(null);

      expect(request.body).to.eql({
        client_id: 'test-client-id',
        grant_type: 'authorization_code',
        code: 'code_000',
        code_verifier: codeVerifier,
        redirect_uri: 'http://example/redirect',
      });

    });

  });
});
