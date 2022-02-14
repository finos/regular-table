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
                modules: process.env.BABEL_MODULE || false,
            },
        ],
    ],
    plugins: [
        ["@babel/plugin-proposal-decorators", {legacy: true}],
        "./scripts/babel-plugin-html-template.js",
    ],
    sourceMaps: true,
};
