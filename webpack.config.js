export default [
  {
    entry: './src/index',
    output: {
      path: import.meta.dirname + '/browser',
      filename: 'oauth2-client.min.js',
      library: {
        type: 'module',
      },
    },
    experiments: {
      outputModule: true,
    },
    resolve: {
      extensionAlias: {
        '.js': ['.ts', '.js']
      },
      extensions: ['.web.ts', '.web.js', '.ts', '.js', '.json'],
      fallback: { 'crypto': false }
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader'
        }
      ]
    }
  }
];
