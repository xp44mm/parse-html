const path = require('path')
const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',

    output: {
        filename: '[name].[contenthash].js',
    },

    devServer: {
        port: 3000,
        disableHostCheck: true,
        open: true,
    },

})
