module.exports = {
    presets: [[
        "@babel/preset-env", {targets: {esmodules: true}}
    ]],
    plugins: [
        "lodash",
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-optional-chaining",
        "./babel-plugin-transform-tagged-literal.js"
    ]
};
