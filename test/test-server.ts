import { Application, Middleware, Request } from '@curveball/core';
import bodyParser from '@curveball/bodyparser';
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
  app.use(issueToken);
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



const issueToken: Middleware = (ctx, next) => {

  if (ctx.path !== '/token') {
    return next();
  }

  ctx.response.type = 'application/json';
  ctx.response.body = {
    access_token: 'access_token_000',
    refresh_token: 'refresh_token_000',
    expires_in: 3600,
    foo: 'bar_000',
    bar: 'foo_00'
  };

};
