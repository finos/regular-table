const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const path = require("path");

module.exports = {
    mode: process.env.NODE_ENV || "production",
    entry: "./src/js/bootstrap.js",
    output: {
        filename: "regular-table.js",
        path: path.resolve(__dirname, "dist/umd"),
    },
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: ["babel-loader"],
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: "css-loader",
                        options: {sourceMap: false},
                    },
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                minimize: true,
                                plugins: [require("cssnano")({preset: "default"})],
                            },
                        },
                    },
                    {loader: "less-loader", options: {sourceMap: false}},
                ],
            },
        ],
    },
    plugins: [new WasmPackPlugin({crateDirectory: __dirname})],
    experiments: {
        syncWebAssembly: true,
    },
    devServer: {
        contentBase: __dirname,
        port: 8080,
    },
    devtool: "source-map",
};
