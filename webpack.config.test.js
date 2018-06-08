const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    resolve: {
        extensions: ['.ts'],
    },
    module: {
        rules: [{
            test: /\.ts$/,
            exclude: /node_modules/,
            include: path.resolve('src'), // instrument only testing sources with Istanbul, after ts-loader runs
            use: ['istanbul-instrumenter-loader', 'ts-loader']
        }],
    },
    target: 'node',  // webpack should compile node compatible code
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    devtool: 'inline-cheap-module-source-map'
};
