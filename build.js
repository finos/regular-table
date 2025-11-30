// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▀░█▀▄░█▀▀░█▀▀░█░█░█░░░█▀█░█▀▄░░░░░▀█▀░█▀█░█▀▄░█░░░█▀▀░▀▄░░░░░░░░░░
// ░░░░░░░░░▀▄░░█▀▄░█▀▀░█░█░█░█░█░░░█▀█░█▀▄░▀▀▀░░█░░█▀█░█▀▄░█░░░█▀▀░░▄▀░░░░░░░░░
// ░░░░░░░░░░░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀░▀░░░░░░▀░░▀░▀░▀▀░░▀▀▀░▀▀▀░▀░░░░░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  *  Copyright (c) 2020, the Regular Table Authors. This file is part   *  ┃
// ┃  *  of the Regular Table library, distributed under the terms of the   *  ┃
// ┃  *  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). *  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const esbuild = require("esbuild");
const { BuildCss } = require("@prospective.co/procss/target/cjs/procss.js");
const fs = require("fs");
const path_mod = require("path");

const BUILD = [
    {
        entryPoints: ["src/js/index.js"],
        format: "esm",
        loader: {
            ".css": "text",
            ".html": "text",
        },
        outfile: "dist/esm/regular-table.js",
        target: ["es2021"],
        bundle: true,
        minify: !process.env.PSP_DEBUG,
        minify: true,
        sourcemap: true,
        metafile: true,
        entryNames: "[name]",
        chunkNames: "[name]",
        assetNames: "[name]",
    },
];

function add(builder, path) {
    builder.add(
        path,
        fs.readFileSync(path_mod.join("./src/less", path)).toString(),
    );
}

async function compile_css() {
    fs.mkdirSync("dist/css", { recursive: true });
    const builder1 = new BuildCss("");
    add(builder1, "./container.less");
    fs.writeFileSync(
        "dist/css/container.css",
        builder1.compile().get("container.css"),
    );

    const builder2 = new BuildCss("");
    add(builder2, "./sub-cell-offsets.less");
    fs.writeFileSync(
        "dist/css/sub-cell-offsets.css",
        builder2.compile().get("sub-cell-offsets.css"),
    );

    const builder3 = new BuildCss("");
    add(builder3, "./sub-cell-scrolling.less");
    add(builder3, "./material.less");
    fs.writeFileSync(
        "dist/css/material.css",
        builder3.compile().get("material.css"),
    );
    fs.writeFileSync(
        "dist/css/sub-cell-scrolling.css",
        builder3.compile().get("sub-cell-scrolling.css"),
    );
}

async function build_all() {
    await compile_css();
    await Promise.all(
        BUILD.map(async (x) => {
            console.log("");
            const result = await esbuild.build(x);
            for (const { inputs, bytes } of Object.values(
                result.metafile.outputs,
            )) {
                for (const input of Object.keys(inputs)) {
                    if (inputs[input].bytesInOutput / bytes < 0.05) {
                        delete inputs[input];
                    }
                }
            }

            const text = await esbuild.analyzeMetafile(result.metafile, {
                color: true,
            });

            console.log(text);
        }),
    );
}

build_all();
