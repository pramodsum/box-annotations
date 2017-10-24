require('babel-polyfill');
const path = require('path');
const pkg = require('../package.json');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const DefinePlugin = webpack.DefinePlugin;
const NormalPlugin = webpack.NormalModuleReplacementPlugin;

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
module.exports = {
    devtool: 'inline-source-map',
    bail: true,
    resolve: {
        modules: ['src', 'node_modules'],
        alias: {
            sinon: 'sinon/pkg/sinon'
        }
    },
    resolveLoader: {
        modules: [path.resolve('src'), path.resolve('node_modules')]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: [
                    path.resolve('node_modules')
                ]
            },
            {
                test: /\.s?css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1
                            }
                        },
                        {
                            loader: 'postcss-loader'
                        },
                        {
                            loader: 'sass-loader'
                        }
                    ]
                }),
                exclude: [
                    path.resolve('node_modules')
                ]
            },
            {
                test: /\.(svg|html)$/,
                loader: 'raw-loader',
                exclude: [
                    path.resolve('node_modules')
                ]
            }
        ]
    },
    plugins: [
        new ExtractTextPlugin({
            filename: '[name].css',
            allChunks: true
        }),
        new DefinePlugin({
            __NAME__: JSON.stringify(pkg.name),
            __VERSION__: JSON.stringify(pkg.version),
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                BABEL_ENV: JSON.stringify(process.env.BABEL_ENV)
            }
        }),
        new NormalPlugin(/\/iconv-loader$/, 'node-noop')
    ],
    stats: {
        assets: true,
        colors: true,
        version: false,
        hash: false,
        timings: true,
        chunks: false,
        chunkModules: false,
        children: false
    }
};
