const path = require('path');
const WaitPlugin = require('./demo/WaitPlugin');

// bundles source of tresor-import AND demo page into demo/bundle to power the demo

const importConfig = {
  mode: 'development',
  watch: true,
  entry: './src/index.js',
  devtool: 'inline-source-map',
  output: {
    filename: 'tresor-import.js',
    path: path.resolve(__dirname, 'demo/bundle'),
    libraryTarget: 'umd',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    },
  },
};

const demoConfig = {
  mode: 'development',
  watch: true,
  entry: './demo/js/main.js',
  devtool: 'inline-source-map',
  output: {
    filename: 'tresor-demo.js',
    path: path.resolve(__dirname, 'demo/bundle'),
    libraryTarget: 'umd',
  },
  plugins: [
    // Prevent error `Module demo/bundle/tresor-import.js not found` due to parallel build of webpack.
    new WaitPlugin(path.resolve(__dirname, 'demo/bundle', 'tresor-import.js')),
  ],
};

module.exports = [importConfig, demoConfig];
