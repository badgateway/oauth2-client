module.exports = [
  {
    entry: './src/index',
    output: {
      path: __dirname + '/browser',
      filename: 'fetch-mw-oauth2.min.js',
      library: 'fetchMwOAuth2',
      libraryTarget: 'umd'
    },

    resolve: {
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'awesome-typescript-loader'
        }
      ]
    },
    node: {
      Buffer: false
    }
  }
];
