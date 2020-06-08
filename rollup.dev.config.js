import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import livereload from "rollup-plugin-livereload"
import postcss from "rollup-plugin-postcss"
import serve from "rollup-plugin-serve"
import sourcemaps from "rollup-plugin-sourcemaps";

export default commandLineArgs => {
    const port = +commandLineArgs.port || 8080;
    // ref: https://github.com/rollup/rollup/issues/2694#issuecomment-463915954
    delete commandLineArgs.port;

    return [{
        input: "src/less/material.less",
        output: {
            dir: "dist/css",
        },
        plugins: [
            postcss({
                inject: false,
                extract: "material.css",
                sourceMap: true,
            })
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
            livereload("dist"),
            postcss({
                inject: false,
                sourceMap: true,
            }),
            serve({
                contentBase: [".", "examples"],
                port
            }),
            sourcemaps(),
        ],
        watch: {
            clearScreen: false,
        },
    }];
};
