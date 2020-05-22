const path = require("path");
const common = require("./common.config.js");

module.exports = common({}, config =>
    Object.assign(config, {
        entry: "./src/js/index.js",
        output: {
            filename: "html-grid.js",
            library: "html-grid",
            libraryTarget: "umd",
            path: path.resolve(__dirname, "../../dist/umd")
        }
    })
);
