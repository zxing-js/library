// helpers
const camelCaseToDash = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
const dashToCamelCase = (str) => str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
const toUpperCase = (str) => `${str.charAt(0).toUpperCase()}${str.substr(1)}`;
const pascalCase = (str) => toUpperCase(dashToCamelCase(str));
const normalizePackageName = (rawPkgName) => rawPkgName.substring(rawPkgName.indexOf('/') + 1);

// webpack requires
const webpack = require('webpack');

const {
    getIfUtils,
    removeEmpty
} = require('webpack-config-utils');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// common requires
const {
    resolve
} = require('path');

const packageJSON = require('./package.json');
const packageName = normalizePackageName(packageJSON.name);

/**
 * this is equal to 'webpack --env=dev'
 *
 * @see https://webpack.js.org/configuration/configuration-types/#exporting-a-function-to-use-env
 */
const config = (env = 'dev') => {

    const {
        ifProd,
        ifNotProd
    } = getIfUtils(env);

    /**
     * Configuration for Universal Module Definition bundling.
     */
    const UMDConfig = {

        /**
         * These are the entry point of our library. We tell webpack to use
         * the name we assign later, when creating the bundle. We also use
         * the name to filter the second entry point for applying code
         * minification via UglifyJS
         */
        entry: {
            [ifProd(`${packageName}.min`, packageName)]: ['./src/index.ts'],
        },

        /**
         * The output defines how and where we want the bundles. The special
         * value `[name]` in `filename` tell Webpack to use the name we defined above.
         * We target a UMD and name it MyLib. When including the bundle in the browser
         * it will be accessible at `window.MyLib`
         */
        output: {
            path: resolve(__dirname, 'bundles'),
            filename: '[name].js',
            libraryTarget: 'umd',
            library: pascalCase(packageName),
            // libraryExport:  LIB_NAME,
            // will name the AMD module of the UMD build. Otherwise an anonymous define is used.
            umdNamedDefine: true,
        },

        /**
         * Add resolve for `tsx` and `ts` files, otherwise Webpack would
         * only look for common JavaScript file extension (.js)
         */
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
        },

        /**
         * Add here all 3rd party libraries that you will use as peerDependncies
         * https://webpack.js.org/guides/author-libraries/#add-externals
         */
        externals: {
            'text-encoding': {
                commonjs: 'text-encoding',
                commonjs2: 'text-encoding',
                amd: 'text-encoding',
                root: 'text-encoding'
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
             *  enable scope hoisting
             */
            new webpack.optimize.ModuleConcatenationPlugin(),

            /**
             * Apply minification only on the second bundle by using a RegEx on the name, which must end with `.min.js`
             */
            ifProd(
                new UglifyJsPlugin({
                    sourceMap: true,
                    compress: {
                        screw_ie8: true,
                        warnings: false,
                    },
                    output: {
                        comments: false
                    },
                })
            ),

            /**
             * Sets the options for webpack loader plugin.
             */
            new webpack.LoaderOptionsPlugin({
                debug: false,
                minimize: true,
            }),

            /**
             * Plugin for defining environment variables.
             */
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: ifProd('"production"', '"development"')
                },
            }),

        ]),

        /**
         * Defines module packing configuration, I guess
         */
        module: {
            rules: [{
                test: /\.tsx?$/,
                include: /src/,
                loader: 'awesome-typescript-loader',
            }],
        },
    };

    return [UMDConfig];
};

module.exports = config;
