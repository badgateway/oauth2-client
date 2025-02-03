interface OAuth2TokenExternal {
  expiresAt: number;
  token: string;
  type: string;
}

interface OAuth2TokenInternal {
  expiresAt: number;
  token: string;
  type: string;
}

/**
 * Token information
 */
export interface OAuth2Token {
  external: OAuth2TokenExternal;
  internal: OAuth2TokenInternal;
};
