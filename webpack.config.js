// helpers
const camelCaseToDash = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const dashToCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const toUpperCase = (str) => `${str.charAt(0).toUpperCase()}${str.substr(1)}`;
const pascalCase = (str) => toUpperCase(dashToCamelCase(str));

// webpack requires
const webpack = require('webpack');

const {
    removeEmpty
} = require('webpack-config-utils');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// common requires
const {
    resolve
} = require('path');

/**
 * this is equal to 'webpack --env=dev'
 *
 * @see https://webpack.js.org/configuration/configuration-types/#exporting-a-function-to-use-env
 */
const config = (env, argv) => {

    const mode = argv.mode;
    const isProd = mode === 'production';
    const ifProd = (whenProd, whenNot) => (isProd ? whenProd : whenNot);

    /**
     * Configuration for Universal Module Definition bundling.
     */
    return [{

        /**
         * These are the entry point of our library. We tell webpack to use
         * the name we assign later, when creating the bundle. We also use
         * the name to filter the second entry point for applying code
         * minification via UglifyJS
         */
        entry: {
            [`index${ifProd('.min', '')}`]: ['./src/index.ts'],
        },

        /**
         * The output defines how and where we want the bundles. The special
         * value `[name]` in `filename` tell Webpack to use the name we defined above.
         */
        output: {
            path: resolve(__dirname, 'umd'),
            // module format
            libraryTarget: 'umd',
            // library name to be used in browser (e.g. `window.ZXing`).
            library: 'ZXing',
            // will name the AMD module of the UMD build. Otherwise an anonymous define is used.
            umdNamedDefine: true
        },

        /**
         * Add resolve for `ts` files, otherwise Webpack would
         * only look for common JavaScript file extension (.js)
         */
        resolve: {
            extensions: ['.ts'],
        },

        /**
         * Optimizations Webpack shall apply.
         */
        optimization: {
            splitChunks: {
                chunks: 'all'
            }
        },

        /**
         * Activate source maps for the bundles in order to preserve the original
         * source when the user debugs the application
         */
        devtool: 'source-map',

        /**
         * Plugins to be used by webpack.
         */
        plugins: removeEmpty([

            /**
             * Enable scope hoisting.
             */
            new webpack.optimize.ModuleConcatenationPlugin(),

            /**
             * Apply minification only on the second bundle by
             * using a RegEx on the name, which must end with `.min.js`
             */
            ifProd(
                new UglifyJsPlugin({
                    sourceMap: true,
                    uglifyOptions: {
                        compress: true,
                        output: {
                            comments: false
                        }
                    }
                })
            ),

            /**
             * Plugin for defining environment variables.
             */
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: mode
                },
            }),

        ]),

        /**
         * Defines module packing configuration, I guess
         */
        module: {
            rules: [{
                test: /\.ts?$/,
                include: /src/,
                exclude: /src\/test/,
                loader: 'awesome-typescript-loader',
            }],
        },
    }];
};

module.exports = config;
