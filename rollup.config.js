import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import sourcemaps from "rollup-plugin-sourcemaps";
import {terser} from "rollup-plugin-terser";

export default {
    input: "src/js/index.js",
    plugins: [
        babel({
            exclude: "node_modules/**",
            babelHelpers: "bundled",
        }),
        filesize(),
        sourcemaps(),
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
