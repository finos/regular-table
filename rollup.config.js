import {terser} from "rollup-plugin-terser";
import filesize from "rollup-plugin-filesize";
import sourcemaps from "rollup-plugin-sourcemaps";
import babel from "@rollup/plugin-babel";

export default {
    input: "src/js/index.js",
    plugins: [
        babel({
            exclude: "node_modules/**",
            babelHelpers: "bundled",
        }),
        sourcemaps(),
        filesize(),
        terser(),
    ],
    watch: {
        clearScreen: false,
    },
    output: {
        sourcemap: true,
        file: "dist/umd/regular-table.js",
    },
};
