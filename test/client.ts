import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

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
