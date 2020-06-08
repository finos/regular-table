import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import postcss from "rollup-plugin-postcss"
import sourcemaps from "rollup-plugin-sourcemaps";
import {terser} from "rollup-plugin-terser";

export default [{
    input: "src/less/material.less",
    output: {
        dir: "dist/css",
    },
    plugins: [
        postcss({
            inject: false,
            extract: "material.css",
            sourceMap: false,
            minimize: true,
        }),
    ],
    watch: {
        clearScreen: false,
    },
},
{
    input: "src/js/index.js",
    output: {
        sourcemap: true,
        file: "dist/umd/regular-table.js",
    },
    plugins: [
        babel({
            exclude: "node_modules/**",
            babelHelpers: "bundled",
        }),
        filesize(),
        postcss({
            inject: false,
            sourceMap: false,
            minimize: true,
        }),
        sourcemaps(),
        terser(),
    ],
    watch: {
        clearScreen: false,
    },
}];
