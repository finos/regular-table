const path = require("path");
const common = require("./common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./src/js/index.js",
        externals: [/^[a-z0-9@]/],
        output: {
            filename: "html-grid.js",
            library: "html-grid",
            libraryTarget: "commonjs2",
            path: path.resolve(__dirname, "../../dist/cjs")
        }
    })
);
