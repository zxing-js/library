const path = require('path')
//const webpack = require('webpack')
//const UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
const env  = require('yargs').argv.env // use --env with webpack 2

const libraryName = 'ZXing'

let outputFile

if (env === 'dist') {
    //plugins.push(new UglifyJsPlugin())
    outputFile = libraryName.toLowerCase() + '.[name].min.js'
} else {
    outputFile = libraryName.toLowerCase() + '.[name].js'
}

const outputDir = path.join(__dirname, 'build-browser')

module.exports = {
    context: __dirname,
    entry: {
        'qrcodereader': './src/browser/BrowserQRCodeReader'
    },
    devtool: 'source-map',
    output: {
        path: outputDir,
        filename: outputFile,
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    externals: {
        'text-encoding': {
            commonjs: 'text-encoding',
            commonjs2: 'text-encoding',
            amd: 'text-encoding',
            root: 'text-encoding'
        }
    },
    module: {
        rules: [{ 
                enforce: 'pre', 
                test: /\.js$/, 
                loader: 'source-map-loader'
            }, 
            {
                test: /\.ts$/,
                use: [
                    'babel-loader', 
                    'awesome-typescript-loader?configFileName=tsconfig-dist.json',
                ],
                //exclude: /node_modules/
            }]
    },
    resolve: {
        modules: ['node_modules', path.resolve('./src')],
        extensions: ['.ts', '.js']
    }
}