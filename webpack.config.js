const path = require("path");

module.exports = {
    entry: "./src/js/index.js",
    mode: "production",
    devtool: "source-map",
    module: {
        rules: [
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
    output: {
        filename: "regular-table.js",
        library: "regular-table",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "./dist/umd"),
    },
};
