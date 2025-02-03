import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import { OAuth2Client } from '../src/index.js';

import { TOKEN_TYPE } from './test-server.js';

describe('tokenResponseToOAuth2Token', () => {
  it('should convert a JSON response to a OAuth2Token', async () => {
    const client = new OAuth2Client({
      clientId: 'foo',
    });
    const token = await client.tokenResponseToOAuth2Token(
      Promise.resolve({
        external: {
          access_token: 'foo-bar',
          expires_in: 300,
          token_type: TOKEN_TYPE.Bearer,
        },
        internal: {
          access_token: 'foo-bar',
          expires_in: 3600,
          token_type: TOKEN_TYPE.Bearer,
        }
      })
    );

    assert.equal(token.external.token, 'foo-bar');
    assert.equal(token.internal.token, 'foo-bar');
    assert.ok((token.external.expiresAt as number) <= Date.now() + 300_000);
    assert.ok((token.internal.expiresAt as number) <= Date.now() + 3600_000);
    assert.equal(token.external.type, TOKEN_TYPE.Bearer);
    assert.equal(token.internal.type, TOKEN_TYPE.Bearer);
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
