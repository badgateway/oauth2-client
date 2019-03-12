import fetchMwOAuth2 from '../src';

// If on Node.js
// @ts-ignore
global.fetch = require("node-fetch");
// @ts-ignore
global.Request = require("node-fetch").Request;

(async () => {

  const newFetch = fetchMwOAuth2({
    clientId: '...',
    clientSecret: '...',
    grantType: 'client_credentials',
    tokenEndpoint: 'https://my-auth-server.example.org',
    scopes: ['foo', 'bar'],
  });

  const response = await newFetch('https://my-resource-server.example.org');
  console.log(response.status);

})();
