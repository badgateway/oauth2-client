import { generateCodeVerifier } from '../src';
import { expect } from 'chai';

describe('generateCodeVerifier', () => {

  it('should generate a 32byte base4url string', () => {

    const out = generateCodeVerifier();
    expect(out).to.match(/^[A-Za-z0-9-_]{43}$/);

  });

});
