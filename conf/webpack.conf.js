const webpack = require('webpack');
const conf = require('./gulp.conf');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const FailPlugin = require('webpack-fail-plugin');
const WatchIgnorePlugin = require('watch-ignore-webpack-plugin');
const ChunksPlugin = require('webpack-split-chunks');
const autoprefixer = require('autoprefixer');

//  TODO - figure out why chunk plugin is emiting 0.js stuff
module.exports = {
    module: {
        loaders: [
            {
                test: /\.json$/,
                loaders: [
                    'json-loader'
                ]
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'tslint-loader',
                enforce: 'pre'
            },
            {
                test: /\.(css|scss)$/,
                loaders: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                    'postcss-loader'
                ]
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loaders: [
                    'ts-loader'
                ]
            },
            {
                test: /\.html$/,
                loaders: [
                    'html-loader'
                ]
            }
        ]
    },
    plugins: [
        new ChunksPlugin({
            to: 'vendor',
            test: /node_modules/ // or an array of regex
        }),
        new WatchIgnorePlugin([
            path.resolve(__dirname, './node_modules/')
        ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        FailPlugin,
        new HtmlWebpackPlugin({
            template: conf.path.src('index.html')
        }),
        new webpack.ContextReplacementPlugin(/angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/, conf.paths.src),
        new webpack.LoaderOptionsPlugin({
            options: {
                postcss: () => [autoprefixer],
                resolve: {},
                ts: {
                    configFile: 'tsconfig.json'
                },
                tslint: {
                    configuration: require('../tslint.json')
                }
            },
            debug: true
        })
    ],
    devtool: 'source-map',
    output: {
        path: path.join(process.cwd(), conf.paths.tmp)
    },
    resolve: {
        extensions: [
            '.webpack.js',
            '.web.js',
            '.js',
            '.ts'
        ]
    },
    entry: `./${conf.path.src('index')}`
};
