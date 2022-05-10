import { Application, Middleware, Request } from '@curveball/core';
import bodyParser from '@curveball/bodyparser';

export function testServer() {

  let lastRequest: any = null;

  const app = new Application();

  app.use(bodyParser());
  app.use((ctx, next) => {
    lastRequest = ctx.request;
    return next();
  });
  app.use(clientCredentials);
  const server = app.listen(44444);

  return {
    server,
    app,
    lastRequest: (): Request => lastRequest,
    close: () => server.close()
  };

}



const clientCredentials: Middleware = (ctx, next) => {

  if (ctx.path !== '/token/client-credentials') {
    return next();
  }

  ctx.response.type = 'application/json';
  ctx.response.body = {
    access_token: 'access_token_000',
    refresh_token: 'refresh_token_000',
    expires_in: 3600,
  };

};
