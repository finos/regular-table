import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'
import sourcemaps from "rollup-plugin-sourcemaps";

export default commandLineArgs => {
    const port = +commandLineArgs.port || 8080;
    // ref: https://github.com/rollup/rollup/issues/2694#issuecomment-463915954
    delete commandLineArgs.port;

    return {
        input: "src/js/index.js",
        plugins: [
            babel({
                exclude: "node_modules/**",
                babelHelpers: "bundled",
            }),
            filesize(),
            livereload('dist'),
            serve({
                contentBase: [".", "examples"],
                port
            }),
            sourcemaps(),
        ],
        watch: {
            clearScreen: false,
        },
        output: {
            sourcemap: true,
            file: "dist/umd/regular-table.js",
        },
    };
};
