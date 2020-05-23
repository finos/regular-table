const path = require("path");

module.exports = {
    entry: "./dist/js/index.js",
    devtool: "source-map",
    mode: "production",
    externals: [/^[a-z0-9@]/],
    module: {
        rules: [
            {
                test: /\.less$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}, {loader: "less-loader"}],
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: "babel-loader",
            },
        ],
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
    stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
    output: {
        filename: "regular-table.js",
        library: "regular-table",
        libraryTarget: "commonjs2",
        path: path.resolve(__dirname, "../../dist/cjs"),
    },
};
