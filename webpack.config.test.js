const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = (env, argv) => {
    const isDebug = env == 'dbg';
    const ifDebug = (whenDebug, whenNot) => (isDebug ? whenDebug : whenNot);

    return {
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
                use: ifDebug('ts-loader', ['istanbul-instrumenter-loader', 'ts-loader'])
            }],
        },
        target: 'node',  // webpack should compile node compatible code
        externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
        devtool: 'inline-cheap-module-source-map'
    };
};
