const fs = require("fs");
const child_process = require("child_process");

compile({
    examples: ["two_billion_rows", "canvas_data_model", "perspective", "minesweeper", "file_browser", "spreadsheet"],
    features: ["row_mouse_selection", "row_stripes", "area_mouse_selection", "column_mouse_selection"],
});

function compile(data) {
    const folders = Object.keys(data);
    const readme = generate_readme(data);

    // clone the gh-pages branch
    child_process.execSync("rm -rf blocks");
    child_process.execSync("mkdir -p blocks");
    child_process.execSync("mkdir -p blocks/dist");

    // build the examples in dist
    child_process.execSync("yarn build:rollup");
    child_process.execSync("yarn build:examples");

    // // copy everything over, just use shell commands
    child_process.execSync(`cp -r ./dist/{umd,css} ./blocks/dist/`);
    child_process.execSync(`cp -r ./dist/{${folders.join(",")}} ./blocks/dist/`);
    child_process.execSync(`cp -r ./dist/{${folders.join(",")}} ./blocks/`);
    folders.forEach((folder) => {
        child_process.execSync(`cp  ./${folder}/*.png ./blocks/${folder}/`);
    });

    // write readme
    fs.writeFileSync("./blocks/README.md", readme);

    // // Update git
    child_process.execSync("git init -b gh-pages blocks/");
    child_process.execSync("git -C blocks/ remote add origin git@github.com:finos/regular-table.git");
    child_process.execSync(`git -C blocks/ add ${folders.join(" ")}`);
    child_process.execSync('git -C blocks/ commit -m "deploying docs"');

    // child_process.execSync('git -C blocks push origin gh-pages -f');
}

function partition(input, spacing) {
    let output = [];
    for (let i = 0; i < input.length; i += spacing) {
        output[output.length] = input.slice(i, i + spacing);
    }

    return output;
}

function generate_readme(data) {
    const folders = Object.keys(data);
    let ret = "";
    folders.forEach((folder) => {
        ret += `# ${folder.charAt(0).toUpperCase() + folder.slice(1)}\n`;
        const files = data[folder];
        ret += `<table><tbody>${partition(files, 3)
            .map((row) => `<tr>${row.map((y) => `<td>${y}</td>`).join("")}</tr><tr>${row.map((y) => `<td><a href="./${folder}/${y}.html"><img height="125" src="./${folder}/${y}.png"></img></a></td>`).join("")}</tr>`)
            .join("")}</tbody></table>\n\n`;
    });
    return ret;
}
