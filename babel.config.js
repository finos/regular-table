module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    chrome: "70",
                    node: "12",
                    ios: "13",
                    esmodules: true,
                },
                useBuiltIns: "usage",
                corejs: 3
            }
        ]
    ],
    plugins: [
        "lodash",
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-optional-chaining",
        "./babel-plugin-transform-tagged-literal.js"
    ]
};
