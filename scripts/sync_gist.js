const fs = require("fs");
const child_process = require("child_process");
const rimraf = require("rimraf");
const pkg = JSON.parse(fs.readFileSync("package.json").toString());

const hashes = {
    two_billion_rows: "483a42e7b877043714e18bea6872b039",
    canvas_data_model: "4c6537e23dff3c8f97c316559cef012e",
    perspective_headers: "d92520387cb7aa5752dad7286cbb89c9",
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
        fs.copyFileSync(`images/${file}.preview.png`, `dist/${hashes[file]}/preview.png`);
        fs.copyFileSync(`images/${file}.thumbnail.png`, `dist/${hashes[file]}/thumbnail.png`);

        if (!fs.existsSync(`dist/${hashes[file]}/.block`)) {
            fs.writeFileSync(`dist/${hashes[file]}/.block`, "license: apache-2.0");
        }

        // Retarget source assets to jsdelivr
        let source = fs.readFileSync(`examples/${file}.html`).toString();
        source = source.replace(/\.\.\/node_modules\//g, `https://cdn.jsdelivr.net/npm/`);
        source = source.replace(/\.\.\//g, `https://cdn.jsdelivr.net/npm/regular-table@${pkg.version}/`);

        // Remove inline license
        source = source.replace(/<!--(.|\n)*?-->/, "");

        // Generate the README.md
        let [readme] = /<!--((.|\n)*?)-->/.exec(source);
        source = source.replace(/<!--(.|\n)*?-->/, "");
        readme = readme
            .replace(/(<!--|-->)/g, "")
            .trim()
            .replace(/^    /gm, "");

        // Write
        fs.writeFileSync(`dist/${hashes[file]}/README.md`, readme);
        fs.writeFileSync(`dist/${hashes[file]}/index.html`, source.trim());

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
        rimraf(`dist/${hashes[file]}`, () => console.log(`Cleaned ${hashes[file]}`));
    }
}

let output = `||||
|:--|:--|:--|
`;
let titles = "",
    links = "";
for (let i = 0; i < Object.keys(hashes).length; i++) {
    if (i % 3 === 0) {
        if (i !== 0) {
            output += titles + "\n" + links + "\n";
        }
        titles = "|";
        links = "|";
    }
    titles += Object.keys(hashes)[i] + "|";
    links += `[![${Object.keys(hashes)[i]}](https://bl.ocks.org/texodus/raw/${hashes[Object.keys(hashes)[i]]}/thumbnail.png)](https://bl.ocks.org/texodus/${hashes[Object.keys(hashes)[i]]})|`;
}

output += titles + "\n" + links + "\n";
console.log(output);
