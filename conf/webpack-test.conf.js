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
