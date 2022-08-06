/* global __dirname, require, module*/

const webpack = require('webpack');
// const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const env = require('yargs').argv.env; // use --env with webpack 2

let libraryName = 'guardLens';

let plugins = [], outputFile;

if (env === 'build') {
  plugins.push(new UglifyJsPlugin());
  outputFile = libraryName + '.min.js';
} else {
  outputFile = libraryName + '.js';
}

// copy file to browser extension dir
let copyToExtensionDir = new CopyPlugin([
    {
      from: path.resolve(__dirname, `lib/${libraryName}.js`), 
      to:  path.resolve(__dirname, `../web-extension/${libraryName}.js`)
    }]);

plugins.push(copyToExtensionDir);

const config = {
  entry: __dirname + '/src/index.js',
  devtool: 'source-map',
  output: {
    path: __dirname + '/lib',
    filename: outputFile,
    library: libraryName,
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /(\.jsx|\.js)$/,
        loader: 'babel-loader',
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /(\.jsx|\.js)$/,
        loader: 'eslint-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    modules: [path.resolve('./node_modules'), path.resolve('./src')],
    extensions: ['.json', '.js']
  },
  plugins: plugins
};

module.exports = config;
