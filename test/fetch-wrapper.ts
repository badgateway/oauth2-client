import * as assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';

import { OAuth2Client,OAuth2Fetch } from '../src/index.js';

import { TOKEN_TYPE } from './test-server.js';

describe('FetchWrapper', () => {
  let fetchWrapper: any;

  afterEach(() => {
    if (fetchWrapper) {
      clearTimeout(fetchWrapper.refreshTimer);
    }
  });

  it('should use the token from getNewToken', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar',
    });

    fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => {
        return {
          external: {
            token: 'access',
            expiresAt: Date.now() + 1000_0000,
            type: TOKEN_TYPE.Bearer,
          },
          internal: {
            token: 'refresh',
            expiresAt: Date.now() + 5000_0000,
            type: TOKEN_TYPE.Bearer,
          }
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    assert.equal(response.headers.get('Authorization'), 'Bearer access');
  });

  it("should use the token even if it's delayed", async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar',
    });

    fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: async () => {
        await new Promise((res) => setTimeout(res, 200));
        return {
          external: {
            token: 'access',
            expiresAt: Date.now() + 1000_0000,
            type: TOKEN_TYPE.Bearer,
          },
          internal: {
            token: 'refresh',
            expiresAt: Date.now() + 5000_0000,
            type: TOKEN_TYPE.Bearer,
          }
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    assert.equal(response.headers.get('Authorization'), 'Bearer access');
  });

  it('should use a token from getStoredToken', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar',
    });

    fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => null,
      getStoredToken: () => {
        return {
          external: {
            token: 'access',
            expiresAt: Date.now() + 1000_0000,
            type: TOKEN_TYPE.Bearer,
          },
          internal: {
            token: 'refresh',
            expiresAt: Date.now() + 5000_0000,
            type: TOKEN_TYPE.Bearer,
          }
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    assert.equal(response.headers.get('Authorization'), 'Bearer access');
  });

  it("should still work with getStoredToken even if it's delayed", async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
      clientSecret: 'bar',
    });

    fetchWrapper = new OAuth2Fetch({
      client,
      getNewToken: () => null,
      getStoredToken: async () => {
        await new Promise((res) => setTimeout(res, 200));
        return {
          external: {
            token: 'access',
            expiresAt: Date.now() + 1000_0000,
            type: TOKEN_TYPE.Bearer,
          },
          internal: {
            token: 'refresh',
            expiresAt: Date.now() + 5000_0000,
            type: TOKEN_TYPE.Bearer,
          }
        };
      },
    });

    const mw = fetchWrapper.mw();

    const response = await mw(
      new Request('http://example/'),
      (req): any => req
    );

    assert.equal(response.headers.get('Authorization'), 'Bearer access');
  });
});
