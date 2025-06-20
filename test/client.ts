import * as assert from 'node:assert';
import { OAuth2Client } from '../src/index.ts';
import { legacyFormUrlEncode } from '../src/client.ts';
import { describe, it } from 'node:test';

describe('tokenResponseToOAuth2Token', () => {
  it('should convert a JSON response to a OAuth2Token', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
    });
    const token = await client.tokenResponseToOAuth2Token(
      Promise.resolve({
        token_type: 'bearer',
        access_token: 'foo-bar',
      })
    );

    assert.deepEqual(token, {
      accessToken: 'foo-bar',
      expiresAt: null,
      refreshToken: null,
      extraParams: {
        token_type: 'bearer'
      }
    });
  });

  it('should error when an invalid JSON object is passed', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
    });

    let caught = false;
    try {
      await client.tokenResponseToOAuth2Token(
        Promise.resolve({
          funzies: 'foo-bar',
        } as any)
      );
    } catch (err) {
      assert.ok(err instanceof TypeError);
      caught = true;
    }

    assert.equal(caught, true);
  });
  it('should error when an empty body is passed', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
    });

    let caught = false;
    try {
      await client.tokenResponseToOAuth2Token(
        Promise.resolve(undefined as any)
      );
    } catch (err) {
      assert.ok(err instanceof TypeError);
      caught = true;
    }

    assert.equal(caught, true);
  });
});

describe('legacyFormUrlEncode', () => {
  it('correctly encodes full character set', () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~ ó';
    assert.equal(
      legacyFormUrlEncode(chars),
      '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ%21%22%23%24%25%26%27%28%29%2A%2B%2C%2D%2E%2F%3A%3B%3C%3D%3E%3F%40%5B%5C%5D%5E%5F%60%7B%7C%7D%7E+%C3%B3');
  });
});
