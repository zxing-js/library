const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/index.ts',
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: [nodeExternals()],
    module: {
        loaders: [{
            test: /\.ts?$/,
            exclude: /node_modules/,
            loader: 'ts-loader',
        }]
    },
    target: 'node',
    devtool: '#inline-cheap-module-source-map',
};
