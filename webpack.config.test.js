const nodeExternals = require('webpack-node-externals');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    resolve: {
        extensions: ['.ts', '.js'],
    },
    externals: [nodeExternals()],
    module: {
        rules: [{
            test: /\.ts?$/,
            exclude: /node_modules/,
            use: 'ts-loader',
        }],
    },
    target: 'node',
};
