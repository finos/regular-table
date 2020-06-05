/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

const fs = require("fs");
var CleanCSS = require("clean-css");
// var input = 'a{font-weight:bold;}';
// var options = { /* options */ };
var plugin = new CleanCSS({level: 2});

// Replace whitespace in `css` tagged literals for minification.
module.exports = function (babel) {
    const t = babel.types;
    return {
        visitor: {
            TaggedTemplateExpression(path) {
                const node = path.node;
                if (t.isIdentifier(node.tag, {name: "css"})) {
                    for (const type of ["raw", "cooked"]) {
                        for (const element of node.quasi.quasis) {
                            const value = element.value[type];
                            const output = fs.readFileSync(value).toString();
                            element.value[type] = plugin.minify(output).styles;
                        }
                    }
                }
            },
        },
    };
};
