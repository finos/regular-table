const path = require("path");

module.exports = {
    entry: "./src/js/index.js",
    mode: process.env.DEBUG ? "development" : "production",
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
    output: {
        filename: "regular-table.js",
        library: "regular-table",
        libraryTarget: "umd",
        path: path.resolve(__dirname, "./dist/umd"),
    },
};
