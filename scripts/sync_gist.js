const fs = require("fs");
const child_process = require("child_process");
const glob = require("glob");

compile("examples", {
    two_billion_rows: "483a42e7b877043714e18bea6872b039",
    canvas_data_model: "4c6537e23dff3c8f97c316559cef012e",
    perspective: "d92520387cb7aa5752dad7286cbb89c9",
    minesweeper: "96a9ed60d0250f7d3187c0fed5f5b78c",
    file_browser: "a7b7588c899e3953dd8580e81c51b3f9",
    spreadsheet: "3e0e3d6f8bf8b47294a7847b402b55fb",
});

compile("features", {
    row_mouse_selection: "f880c45f68ba062fd53e39fe13615d6d",
    row_stripes: "4157245997d92219d73ae43c25f29781",
    area_mouse_selection: "4ac513f103a3bcef7b5442f52d9c6072",
    column_mouse_selection: "e89234de558575cdd92bfd111f224895",
});

function compile(name, hashes) {
    for (const file in hashes) {
        let out = `blocks/${name}/${hashes[file]}`;
        try {
            // Create project in a tmp directory
            if (fs.existsSync(out)) {
                console.log(`dist/blocks/${name}/${hashes[file]} exists, skipping checkout`);
            } else {
                try {
                    child_process.execSync(`GIT_TERMINAL_PROMPT=0 git clone https://gist.github.com/${hashes[file]}.git ${out}`);
                } catch (e) {
                    console.error(`Failed to clone creating a local git repo ${hashes[file]}`);
                    fs.mkdirSync(out);
                }
            }

            // Run literally for this project
            console.log(child_process.execSync(`yarn literally -c ${name}/literally.config.js --format block --output ${out} ${name}/${file}.md`).toString());

            // Update git
            process.chdir(out);
            if (!fs.existsSync("./.git")) {
                console.log(child_process.execSync(`git init`).toString());
                console.log(child_process.execSync(`touch README.md`).toString());
                console.log(child_process.execSync(`git add README.md`).toString());
                console.log(child_process.execSync(`git commit -m "First Commit"`).toString());
            }

            child_process.execSync(`git add thumbnail.png preview.png index.html .block README.md`);
            console.log(child_process.execSync(`git status`).toString());
            console.log(child_process.execSync(`git commit -am"Auto update via sync_gist" --amend`).toString());

            // Run sub command
            const command = process.argv.slice(2);
            if (command.length > 0) {
                console.log(child_process.execSync(command.join(" ")).toString());
            }
            process.chdir("../../..");
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
