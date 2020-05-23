const path = require("path");

module.exports = {
    entry: "./dist/js/index.js",
    mode: "production",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.(woff|ttf|eot|svg|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "base64-font-loader",
            },
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
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist/umd"),
    },
};
