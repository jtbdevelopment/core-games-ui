const webpack = require('webpack');
const conf = require('./gulp.conf');
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
                loader: 'tslint-loader',
                enforce: 'pre'
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loaders: [
                    'ts-loader'
                ]
            },
            {
                test: /src\/.+\.ts$/,
                exclude: /(node_modules|\.spec\.ts$|\.module\.ts$)/,
                loader: 'sourcemap-istanbul-instrumenter-loader?force-sourcemap=true',
                enforce: 'post'
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
        new webpack.ContextReplacementPlugin(
            /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
            conf.paths.src
        ),
        new webpack.SourceMapDevToolPlugin({
            filename: null,
            test: /\.(ts|js)($|\?)/i
        }),
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
    resolve: {
        extensions: [
            '.webpack.js',
            '.web.js',
            '.js',
            '.ts'
        ]
    }
};
