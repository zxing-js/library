const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './src/index.ts',
    output: {
        path: resolve(__dirname, 'bundles'),
        filename: '[name].js',
        libraryTarget: 'umd',
        library: pascalCase(packageName),
        // libraryExport:  LIB_NAME,
        // will name the AMD module of the UMD build. Otherwise an anonymous define is used.
        umdNamedDefine: true,
    },
    resolve: {
        extensions: ['.ts', '.js', '.tsx', '.jsx'],
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
};
