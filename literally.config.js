const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json").toString());

module.exports = {
    files: ["examples/2d_array.md"],
    output: "dist/examples",
    format: "html",
    retarget: [
        {rule: /\/node_modules\//gm, value: "https://cdn.jsdelivr.net/npm/"},
        {rule: /\/dist\//gm, value: `https://cdn.jsdelivr.net/npm/regular-table@${pkg.version}/dist/`},
    ],
};
