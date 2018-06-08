/**
 * Karma configuration file.
 *
 * @see https://karma-runner.github.io/0.13/config/configuration-file.html
 */
import * as path from 'path';

const ROOT = path.resolve(__dirname, '.');

function rootPath() {
    return path.join.apply(
        path, [ROOT].concat(Array.prototype.slice.call(arguments, 0))
    );
}

export default function (config) {
    config.set({

        basePath: '',

        frameworks: ['mocha', 'karma-typescript', 'chai', 'sinon'],

        files: ['src/**/*.ts'],

        preprocessors: {
            '**/*.ts': ['karma-typescript']
        },

        plugins: [
            require('karma-coverage'),
            require('karma-mocha'),
            require('karma-chai'),
            require('karma-sinon'),
            require('karma-remap-coverage'),
            require('karma-typescript'),
            require('karma-typescript-preprocessor'),
        ],

        client: {
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },

        /**
         * add both "karma-coverage" and "karma-remap-coverage" reporters
         */
        reporters: ['progress', 'coverage', 'remap-coverage', 'dots', 'karma-typescript'],

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
        browsers: ['Chrome_headless'],

        customLaunchers: {
            Chrome_headless: {
                base: 'Chrome',
                flags: [
                    ' — headless',
                    ' — disable-gpu',
                    ' — remote-debugging-port=9222'
                ]
            }
        },

        /**
         * Keep testing or not.
         */
        singleRun: false,

        concurrency: Infinity
    });
};
