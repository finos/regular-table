/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
    // context:
    resolve: {
        alias: {
            "html-grid": path.resolve(__dirname, '../../packages/html-grid/src/js')
        }
    },
    mode: process.env.NODE_ENV || "development",
    entry: ["babel-polyfill", "./src/index.js"],
    output: {
        filename: "index.js"
    },
    plugins: [
        new HtmlWebPackPlugin({
            title: "html-grid Webpack Example"
        }),
        new PerspectivePlugin()
    ],
    module: {
        rules: [
            {
                test: /\.less$/,
                exclude: /node_modules/,
                use: [{loader: "css-loader"}, {loader: "clean-css-loader", options: {level: 2}}, {loader: "less-loader"}]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [[
                            "@babel/preset-env",
                            {
                                targets: {
                                    chrome: "70",
                                    node: "12",
                                    ios: "13"
                                },
                                modules: process.env.BABEL_MODULE || false,
                                useBuiltIns: "usage",
                                corejs: 3
                            }
                        ]],
                        plugins: [
                            "lodash",
                            ["@babel/plugin-proposal-decorators", {legacy: true}],
                            "transform-custom-element-classes",
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-proposal-optional-chaining",
                            path.resolve(__dirname, "../../packages/html-grid/babel-plugin-transform-tagged-literal.js")
                        ]
                    }
                }
            },
            {
                test: /\.css$/,
                use: [{loader: "style-loader"}, {loader: "css-loader"}]
            }
        ]
    },
    devServer: {
        contentBase: [path.join(__dirname, "dist"), path.join(__dirname, "../simple")]
    },
    devtool: "source-map"
};
