import bodyParser from '@curveball/bodyparser';
import { Application, Middleware, Request } from '@curveball/core';
import * as http from 'http';

type TestServer = {
  server: http.Server;
  app: Application;
  lastRequest: () => Request;
  port: number;
  url: string;
  close: () => Promise<void>;
}

let serverCache: null|TestServer = null;

export function testServer() {

  if (serverCache) return serverCache;

  let lastRequest: any = null;

  const app = new Application();

  app.use(bodyParser());
  app.use((ctx, next) => {
    lastRequest = ctx.request;
    return next();
  });
  app.use(oauth2Error);
  app.use(jsonError);
  app.use(generalHttpError);
  app.use(issueToken);
  app.use(revokeToken);
  app.use(discover);
  const port = 40000 + Math.round(Math.random()*9999);
  const server = app.listen(port);

  serverCache = {
    server,
    app,
    lastRequest: (): Request => lastRequest,
    port,
    url: 'http://localhost:' + port,
    close: async() => {

      return new Promise<void>(res => {
        server.close(() => res());
      });

    }

  };
  return serverCache;

}

const oauth2Error: Middleware = (ctx, next) => {

  if (ctx.request.body?.client_id !== 'oauth2-error') {
    return next();
  }

  ctx.response.body = {
    error: 'invalid_client',
    error_description: 'OOps!',
  };

  ctx.response.status = 400;
  ctx.response.type = 'application/json';


};
const jsonError: Middleware = (ctx, next) => {

  if (ctx.request.body?.client_id !== 'json-error') {
    return next();
  }

  ctx.response.body = {
    type: 'https://example/dummy',
    title: 'OOps!',
    status: 418,
  };

  ctx.response.status = 418;
  ctx.response.type = 'application/problem+json';

};
const generalHttpError: Middleware = (ctx, next) => {

  if (ctx.request.body?.client_id !== 'general-http-error') {
    return next();
  }

  ctx.response.body = 'We\'re super broken RN!';
  ctx.response.status = 500;
  ctx.response.type = 'text/plain';

};

const issueToken: Middleware = (ctx, next) => {

  if (ctx.path !== '/token') {
    return next();
  }

  ctx.response.type = 'application/json';
  if (ctx.request.body.refresh_token === 'refresh_token_000') {

    ctx.response.body = {
      access_token: 'access_token_001',
      refresh_token: 'refresh_token_001',
      expires_in: 3600,
    };

  } else if (ctx.request.body.refresh_token === 'refresh_token_001') {

    ctx.response.body = {
      access_token: 'access_token_002',
      expires_in: 3600,
    };

  } else {

    ctx.response.body = {
      access_token: 'access_token_000',
      refresh_token: 'refresh_token_000',
      expires_in: 3600,
    };
  }

};


const revokeToken: Middleware = (ctx, next) => {

  if (ctx.path !== '/revoke') {
    return next();
  }

  ctx.response.type = 'application/octet-stream';
  ctx.response.body = 'SUCCESS!';
};


const discover: Middleware = (ctx, next) => {

  if (ctx.path !== '/discover') {
    return next();
  }

  ctx.response.type = 'application/json';
  ctx.response.body = {
    revocation_endpoint: '/revoke',
  };
};
