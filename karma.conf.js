/**
 * Karma configuration file.
 *
 * @see https://karma-runner.github.io/0.13/config/configuration-file.html
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '.');

function rootPath() {
    return path.join.apply(
        path, [ROOT].concat(Array.prototype.slice.call(arguments, 0))
    );
}

module.exports = (config) => {
    config.set({

        basePath: '',

        frameworks: ['mocha', 'jasmine', 'chai', 'sinon'],

        files: [
            rootPath('src', 'test.ts'),
        ],

        preprocessors: {
            [rootPath('src', '**/*.spec.ts')]: ['webpack'],
            [rootPath('src', 'test.ts')]: ['coverage']
        },

        plugins: [
            require('karma-chrome-launcher'),
            require('karma-coverage'),
            require('karma-jasmine'),
            require('karma-jasmine-html-reporter'),
            require('karma-mocha'),
            require('karma-chai'),
            require('karma-phantomjs-launcher'),
            require('karma-remap-coverage'),
            require('karma-sinon'),
            require('karma-webpack'),
        ],

        client: {
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },

        /**
         * add both "karma-coverage" and "karma-remap-coverage" reporters
         */
        reporters: ['progress', 'kjhtml', 'coverage', 'remap-coverage'],

        /**
         * save interim raw coverage report in memory
         */
        coverageReporter: {
            type: 'in-memory'
        },

        /**
         * define where to save final remaped coverage reports
         */
        remapCoverageReporter: {
            'text-summary': null,
            html: './coverage/html',
            cobertura: './coverage/cobertura.xml'
        },

        /**
         * Port to listen in browser.
         */
        port: 9876,

        /**
         * Cool colors in CLI
         */
        colors: true,

        /**
         * Wath kinda logs should be shown
         */
        logLevel: config.LOG_INFO,

        /**
         * Watch for code modifications
         */
        autoWatch: true,

        /**
         * What browsers should be used
         */
        browsers: ['Chrome', 'PhantomJS'],

        /**
         * Keep testing or not.
         */
        singleRun: false,

        concurrency: Infinity
    });
};
