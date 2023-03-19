// nosemgrep

const fs = require("fs");
const child_process = require("child_process");
const glob = require("glob");

compile("examples", [
    "two_billion_rows",
    "canvas_data_model",
    "perspective",
    "minesweeper",
    "file_browser",
    "spreadsheet",
]);

compile("features", [
    "row_mouse_selection",
    "row_stripes",
    "area_mouse_selection",
    "column_mouse_selection",
]);

function compile(name, hashes) {
    for (const file in hashes) {
        let out = `docs/static/blocks/${hashes[file]}`;
        console.log(out);
        try {
            // Create project in a tmp directory
            if (fs.existsSync(out)) {
                console.log(
                    `dist/blocks/${name}/${hashes[file]} exists, skipping checkout`
                );
            } else {
                fs.mkdirSync(out, { resursive: true });
            }

            // Run literally for this project
            console.log(
                child_process
                    .execSync(
                        `yarn literally -c ${name}/literally.config.js --format block --output ${out} ${name}/${hashes[file]}.md`
                    )
                    .toString()
            );

            // // Update git
            // process.chdir(out);
            // if (!fs.existsSync("./.git")) {
            //     console.log(child_process.execSync(`git init`).toString());
            //     console.log(child_process.execSync(`touch README.md`).toString());
            //     console.log(child_process.execSync(`git add README.md`).toString());
            //     console.log(child_process.execSync(`git commit -m "First Commit"`).toString());
            // }

            // child_process.execSync(`git add thumbnail.png preview.png index.html .block README.md`);
            // console.log(child_process.execSync(`git status`).toString());
            // console.log(child_process.execSync(`git commit -am"Auto update via sync_gist" --amend`).toString());

            // Run sub command
            // const command = process.argv.slice(2);
            // if (command.length > 0) {
            //     console.log(
            //         child_process.execSync(command.join(" ")).toString()
            //     );
            // }
            //  process.chdir("../../..");
        } catch (e) {
            console.error(`${file} dist failed!`, e);
        } finally {
        }
    }

    let output = `||||
|:--|:--|:--|
`;

    let titles = "",
        links = "",
        list = "";

    for (let i = 0; i < Object.keys(hashes).length; i++) {
        if (i % 3 === 0) {
            if (i !== 0) {
                output += titles + "\n" + links + "\n";
            }

            titles = "|";
            links = "|";
        }

        const title = Object.keys(hashes)[i];
        const hash = hashes[title];
        titles += title + "|";
        links += `[![${title}](https://bl.ocks.org/texodus/raw/${hash}/thumbnail.png)](https://bl.ocks.org/texodus/${hash})|`;
    }

    glob("examples/**/*.md", (_, files) => {
        for (let title of files) {
            title = title.replace(/examples\//, "");
            list += `- [${title}](examples/${title})\n`;
        }

        output += titles + "\n" + links + "\n\n" + list;
        console.log(output);
    });
}
