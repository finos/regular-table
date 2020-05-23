const path = require("path");

module.exports = {
    entry: "./dist/esm/index.js",
    mode: "production",
    devtool: "source-map",
    module: {
        rules: [
            {
                test: /\.less$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}, {loader: "clean-css-loader", options: {level: 2}}, {loader: "less-loader"}]
            }
        ]
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
    output: {
        filename: "regular-table.js",
        library: "regular-table",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "../../dist/umd")
    }
};
