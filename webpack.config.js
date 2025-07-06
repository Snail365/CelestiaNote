// webpack.config.js
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/script.js',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'Model/[name][ext]',
    clean: true,
  },
  resolve: {
    extensions: ['.js'],
  },
  module: { // 念のため多くの拡張子に対応
    rules: [
      {
        test: /\.(obj|mtl|glb|gltf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: 'single', // ランタイムコードを分離
  },
  devtool: false, // 開発時はコメントアウト、本番時はfalse
  mode: 'production', // 開発時は'development'、本番時は'production'

  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body',
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css', // 出力されるCSSファイル名
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: './src/Model', to: 'Model' },
        { from: './src/texture', to: 'Texture' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 9000,
    hot: true,
    watchFiles: ['src/**/*'], // srcフォルダないの変更を監視(一部リソースのキャッシュ対策)
    client: {
      overlay: false,
    },
  },
  performance: {
    hints: false, // ファイルサイズ警告を非表示（初期読み込みは遅くなるが動作自体に影響はない）
  },
};
