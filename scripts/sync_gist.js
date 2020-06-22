const fs = require("fs");
const child_process = require("child_process");
const glob = require("glob");

const hashes = {
    two_billion_rows: "483a42e7b877043714e18bea6872b039",
    canvas_data_model: "4c6537e23dff3c8f97c316559cef012e",
    perspective: "d92520387cb7aa5752dad7286cbb89c9",
    minesweeper: "96a9ed60d0250f7d3187c0fed5f5b78c",
    file_browser: "a7b7588c899e3953dd8580e81c51b3f9",
    spreadsheet: "3e0e3d6f8bf8b47294a7847b402b55fb",
};

for (const file in hashes) {
    try {
        // Create project in a tmp directory
        if (fs.existsSync(`dist/${hashes[file]}`)) {
            console.log(`dist/${hashes[file]} exists, skipping checkout`);
        } else {
            child_process.execSync(`git clone https://gist.github.com/${hashes[file]}.git dist/${hashes[file]}`);
        }

        // Run literally for this project
        console.log(child_process.execSync(`yarn literally --format block --output dist/${hashes[file]} examples/${file}.md`).toString());

        // Update git
        process.chdir(`dist/${hashes[file]}`);
        child_process.execSync(`git add thumbnail.png preview.png index.html .block README.md`);
        console.log(child_process.execSync(`git status`).toString());
        console.log(child_process.execSync(`git commit -am"Auto update via sync_gist" --amend`).toString());

        // Run sub command
        const command = process.argv.slice(2);
        if (command.length > 0) {
            console.log(child_process.execSync(command.join(" ")).toString());
        }
        process.chdir("../..");
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
