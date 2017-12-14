const {
    resolve
} = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const {
    getIfUtils,
    removeEmpty
} = require('webpack-config-utils')

const packageJSON = require('./package.json')
const packageName = normalizePackageName(packageJSON.name)

const LIB_NAME = pascalCase(packageName)
const PATHS = {
    entryPoint: './public_api.ts',
    umd: resolve(__dirname, 'umd')
}
// https://webpack.js.org/configuration/configuration-types/#exporting-a-function-to-use-env
// this is equal to 'webpack --env=dev'
const DEFAULT_ENV = 'dev'

const EXTERNALS = {
    'text-encoding': {
        commonjs: 'text-encoding',
        commonjs2: 'text-encoding',
        amd: 'text-encoding',
        root: 'text-encoding'
    }
}

const RULES = {
    ts: {
        test: /\.tsx?$/,
        include: /src/,
        use: [{
            loader: 'awesome-typescript-loader',
            options: {
                // we don't want any declaration file in the bundles
                // folder since it wouldn't be of any use ans the source
                // map already include everything for debugging
                // This cannot be set because -> Option 'declarationDir' cannot be specified without specifying option 'declaration'.
                // declaration: false,
            },
        }, ],
    },
    tsNext: {
        test: /\.tsx?$/,
        include: /src/,
        use: [{
            loader: 'awesome-typescript-loader',
            options: {
                target: 'es2017',
            },
        }, ],
    },
}

const config = (env = DEFAULT_ENV) => {
    const {
        ifProd,
        ifNotProd
    } = getIfUtils(env)
    const PLUGINS = removeEmpty([
        // enable scope hoisting
        new webpack.optimize.ModuleConcatenationPlugin(),
        // Apply minification only on the second bundle by using a RegEx on the name, which must end with `.min.js`
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
        new webpack.LoaderOptionsPlugin({
            debug: false,
            minimize: true,
        }),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: ifProd('"production"', '"development"')
            },
        }),
    ])

    const UMDConfig = {
        // These are the entry point of our library. We tell webpack to use
        // the name we assign later, when creating the bundle. We also use
        // the name to filter the second entry point for applying code
        // minification via UglifyJS
        entry: {
            [ifProd(`${packageName}.min`, packageName)]: [PATHS.entryPoint],
        },
        // The output defines how and where we want the bundles. The special
        // value `[name]` in `filename` tell Webpack to use the name we defined above.
        // We target a UMD and name it MyLib. When including the bundle in the browser
        // it will be accessible at `window.MyLib`
        output: {
            path: PATHS.umd,
            filename: '[name].js',
            libraryTarget: 'umd',
            library: LIB_NAME,
            // libraryExport:  LIB_NAME,
            // will name the AMD module of the UMD build. Otherwise an anonymous define is used.
            umdNamedDefine: true,
        },
        // Add resolve for `tsx` and `ts` files, otherwise Webpack would
        // only look for common JavaScript file extension (.js)
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
        },
        // add here all 3rd party libraries that you will use as peerDependncies
        // https://webpack.js.org/guides/author-libraries/#add-externals
        externals: EXTERNALS,
        // Activate source maps for the bundles in order to preserve the original
        // source when the user debugs the application
        devtool: 'source-map',
        plugins: PLUGINS,
        module: {
            rules: [RULES.ts],
        },
    }

    return [UMDConfig]
}

module.exports = config

// helpers

function camelCaseToDash(myStr) {
    return myStr.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function dashToCamelCase(myStr) {
    return myStr.replace(/-([a-z])/g, g => g[1].toUpperCase())
}

function toUpperCase(myStr) {
    return `${myStr.charAt(0).toUpperCase()}${myStr.substr(1)}`
}

function pascalCase(myStr) {
    return toUpperCase(dashToCamelCase(myStr))
}

function normalizePackageName(rawPackageName) {
    const scopeEnd = rawPackageName.indexOf('/') + 1

    return rawPackageName.substring(scopeEnd)
}
