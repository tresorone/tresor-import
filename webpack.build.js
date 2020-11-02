const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// bundles tresor-import source into the dist folder for distribution to Tresor One or other apps

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  // devtool: 'inline-source-map',
  output: {
    filename: 'tresor-import.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
  module: {
    rules: [
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
        ie8: false,
        warnings: false, // Suppress uglification warnings
        output: {
          comments: false,
        },
      },
    }),
  ],
};
