const webpack = require('webpack');
const conf = require('./gulp.conf');
const path = require('path');

const FailPlugin = require('webpack-fail-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');

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
                loaders: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?minimize!sass-loader!postcss-loader'
                })
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
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&minetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: "url-loader?limit=50000&name=[path][name].[ext]"
            }
        ]
    },
    plugins: [
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        FailPlugin,
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
            conf.paths.src
        ),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': '"production"'
        }),
        new webpack.optimize.CommonsChunkPlugin({name: 'vendor'}),
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
            }
        })
    ],
    output: {
        path: path.join(process.cwd(), conf.paths.dist),
    },
    resolve: {
        extensions: [
            '.webpack.js',
            '.web.js',
            '.js',
            '.ts'
        ]
    },
    entry: `./${conf.path.src('core-games-ui/jtb.core.games.ui.module.ts')}`
};
