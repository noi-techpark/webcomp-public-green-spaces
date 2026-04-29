// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: CC0-1.0

const path = require('path');
const MapLibreAssetsPlugin = require('./webpack.maplibre-assets');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    filename: 'webcomp-boilerplate.min.js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'assets/[name][ext][query]',
    clean: true,
  },
  module: {
    rules: [
      {
        resourceQuery: /inline/,
        type: 'asset/source',
      },
      {
        test: /\.css$/i,
        resourceQuery: { not: [/inline/] },
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg$/i,
        type: 'asset/inline',
      },
      {
        test: /\.(png|jpe?g|gif|webp)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new MapLibreAssetsPlugin(),
  ],
};
