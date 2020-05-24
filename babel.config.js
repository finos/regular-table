module.exports = {
    presets: [
        [
            "@babel/preset-env",
            {
                targets: {
                    chrome: "70",
                    node: "12",
                    ios: "13",
                },
                useBuiltIns: "usage",
                corejs: 3,
            },
        ],
    ],
    plugins: [
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "transform-custom-element-classes",
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-optional-chaining",
        "./babel-plugin-html-template.js",
        "./babel-plugin-css-template.js",
    ],
};
