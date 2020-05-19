const webpack = require("webpack");
const path = require("path");
const PerspectivePlugin = require("@finos/perspective-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const plugins = [new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /(en|es|fr)$/)];

function common({build_worker, no_minify, inline} = {}) {
    plugins.push(new PerspectivePlugin({build_worker: build_worker, workerLoaderOptions: {inline, name: "[name].worker.js"}, wasmLoaderOptions: {inline, name: "[name]"}}));
    return {
        mode: process.env.PSP_NO_MINIFY || process.env.PSP_DEBUG || no_minify ? "development" : process.env.NODE_ENV || "production",
        plugins: plugins,
        module: {
            rules: [
                {
                    test: /\.less$/,
                    exclude: /node_modules/,
                    use: [{loader: "css-loader"}, {loader: "clean-css-loader", options: {level: 2}}, {loader: "less-loader"}]
                },
                {
                    test: /\.(html)$/,
                    use: {
                        loader: "html-loader",
                        options: {}
                    }
                },
                {
                    test: /\.(arrow)$/,
                    use: {
                        loader: "arraybuffer-loader",
                        options: {}
                    }
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
                                path.resolve(__dirname, "../../babel-plugin-transform-tagged-literal.js")
                            ]
                        }
                    }
                }
            ]
        },
        devtool: "source-map",
        node: {
            fs: "empty",
            Buffer: false
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        },
        stats: {modules: false, hash: false, version: false, builtAt: false, entrypoints: false},
        optimization: {
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        output: {
                            ascii_only: true
                        },
                        keep_infinity: true
                    },
                    cache: true,
                    parallel: true,
                    test: /\.js(\?.*)?$/i,
                    exclude: /(node|wasm|asmjs)/,
                    sourceMap: true
                })
            ]
        }
    };
}

// Remove absolute paths from webpack source-maps

const ABS_PATH = path.resolve(__dirname, "..", "..", "..", "..");
const devtoolModuleFilenameTemplate = info => `webpack:///${path.relative(ABS_PATH, info.absoluteResourcePath)}`;

module.exports = (options, f) => {
    let new_config = Object.assign({}, common(options));
    new_config = f(new_config);
    new_config.output.devtoolModuleFilenameTemplate = devtoolModuleFilenameTemplate;
    return new_config;
};
