import { OAuth2Fetch, OAuth2Client } from '../';
import { expect } from 'chai';

describe('FetchWrapper', () => {

  it('should use the token from getNewToken', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar'
    });

    const fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => {
        return {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresAt: Date.now()+1000_0000,
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    expect(
      response.headers.get('Authorization')
    ).to.equal('Bearer access');

  });

  it('should use the token even if it\'s delayed', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar'
    });

    const fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: async() => {
        await new Promise(res => setTimeout(res, 200));
        return {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresAt: Date.now()+1000_0000,
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    expect(
      response.headers.get('Authorization')
    ).to.equal('Bearer access');

  });

  it('should use a token from getStoredToken', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar'
    });

    const fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => null,
      getStoredToken: () => {
        return {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresAt: Date.now()+1000_0000,
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    expect(
      response.headers.get('Authorization')
    ).to.equal('Bearer access');

  });

  it('should still work with getStoredToken even if it\'s delayed', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar'
    });

    const fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => null,
      getStoredToken: async() => {
        await new Promise(res => setTimeout(res, 200));
        return {
          accessToken: 'access',
          refreshToken: 'refresh',
          expiresAt: Date.now()+1000_0000,
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    expect(
      response.headers.get('Authorization')
    ).to.equal('Bearer access');

  });
});
