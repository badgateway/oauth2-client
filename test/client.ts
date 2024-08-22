import { expect } from 'chai';

import { OAuth2Client } from '../src';


describe('tokenResponseToOAuth2Token', () => {

  it('should convert a JSON response to a OAuth2Token', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
    });
    const token = await client.tokenResponseToOAuth2Token(Promise.resolve({
      token_type: 'bearer',
      access_token: 'foo-bar',
    }));

    expect(token).to.deep.equal({
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
      await client.tokenResponseToOAuth2Token(Promise.resolve({
        funzies: 'foo-bar',
      } as any));
    } catch (err) {
      expect(err).to.be.an.instanceof(TypeError);
      caught = true;
    }
    
    expect(caught).to.equal(true);

  });
  it('should error when an empty body is passed', async () => {

    const client = new OAuth2Client({
      clientId: 'foo',
    });

    let caught = false;
    try {
      await client.tokenResponseToOAuth2Token(Promise.resolve(undefined as any));
    } catch (err) {
      expect(err).to.be.an.instanceof(TypeError);
      caught = true;
    }
    
    expect(caught).to.equal(true);

  });
});
