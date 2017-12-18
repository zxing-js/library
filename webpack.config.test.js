const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/index.ts',
    output: {
        filename: 'dist/bundle.js'
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx']
    },
    externals: [nodeExternals()],
    module: {
        loaders: [{
            test: /\.ts?$/,
            exclude: /node_modules/,
            loader: 'ts-loader'
        }]
    },
    target: 'node'
}
