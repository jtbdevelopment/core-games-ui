const conf = require('./gulp.conf');

module.exports = function (config) {
    const configuration = {
        basePath: '../',
        singleRun: false,
        autoWatch: true,
        logLevel: 'INFO',
        browserDisconnectTolerance: 2,
        browserNoActivityTimeout: 50000,
        junitReporter: {
            outputDir: 'test-reports'
        },
        browsers: [
            //'Chrome'
            'PhantomJS'
        ],
        frameworks: [
            'jasmine'
        ],
        files: [
            'node_modules/es6-shim/es6-shim.js',
            conf.path.src('index.spec.ts')
        ],
        preprocessors: {
            [conf.path.src('index.spec.ts')]: [
                'webpack', 'sourcemap'
            ]
        },
        reporters: ['progress', 'karma-remap-istanbul'],
        remapIstanbulReporter: {
            reports: {
                html: 'coverage/html',
                'text-summary': null
            }
        },
        webpack: require('./webpack-test.conf'),
        webpackMiddleware: {
            noInfo: true
        },
        phantomjsLauncher: {
            // Have phantomjs exit if a ResourceError is encountered (useful if karma exits without killing phantom)
            exitOnResourceError: true
        },
        plugins: [
            require('karma-jasmine'),
            require('karma-junit-reporter'),
            require('karma-coverage'),
//      require('karma-chrome-launcher'),
            require('karma-phantomjs-launcher'),
            require('karma-webpack'),
            require('karma-sourcemap-loader'),
            require('karma-remap-istanbul')
        ]
    };

    console.log(configuration.files);
    config.set(configuration);
};
