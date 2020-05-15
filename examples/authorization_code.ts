import OAuth2 from 'fetch-mw-oauth2';

// If on Node.js
// @ts-ignore
global.fetch = require("node-fetch");
// @ts-ignore
global.Request = require("node-fetch").Request;

(async () => {

  const oauth2 = new OAuth2({
    grantType: 'authorization_code',
    clientId: '...',
    code: '...',
    redirect_uri: 'https://resource-app.example.org/cb',
    tokenEndpoint: 'https://auth.example.org/token',
    codeVerifier: '...' // Optional if PKCE wasn't used in authorization request
  });

  const response = await oauth2.fetch('https://resource-server.example.org/');
  console.log(response.status);

})();
