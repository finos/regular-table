// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

const fs = require("fs");

fs.cpSync("../dist/examples", "static/blocks", { recursive: true });
console.log("\n");

function make(name, type = "examples") {
    const record = {
        img: `img/${name}.png`,
        url: `block?example=${name}`,
        name: `${name}`,
        files: [
            {
                name: `${name}.md`,
                contents: fs.readFileSync(`../${type}/${name}.md`).toString(),
            },
        ],
    };

    console.log(
        `<a href="https://finos.github.io/regular-table/${record.url}">
<img width="30%" src="https://finos.github.io/regular-table/${record.img}"/>
</a>`
    );

    return record;
}
/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "regular-table",
    favicon: "https://www.finos.org/hubfs/FINOS/finos-logo/favicon.ico",
    url: "https://finos.github.io/",
    baseUrl: "/regular-table/",
    organizationName: "finos",
    projectName: "regular-table",
    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },
    customFields: {
        examples: [
            make("two_billion_rows"),
            make("canvas_data_model"),
            make("minesweeper"),
            make("file_browser"),
            make("spreadsheet"),
        ],
        features: [
            make("row_mouse_selection", "features"),
            make("area_mouse_selection", "features"),
            make("row_stripes", "features"),
            make("column_mouse_selection", "features"),
        ],
    },
    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    sidebarPath: require.resolve("./sidebars.js"),
                },
                theme: {
                    customCss: require.resolve("./src/css/custom.css"),
                },
            }),
        ],
    ],
    stylesheets: [
        {
            href:
                "https://fonts.googleapis.com/css?display=block&family=Roboto+Mono:400",
            type: "text/css",
        },
    ],
    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: "img/logo.png",
            navbar: {
                title: "regular-table",
                items: [
                    {
                        href: "https://github.com/finos/regular-table",
                        label: "GitHub",
                        position: "right",
                    },
                ],
            },
            footer: {
                style: "dark",
                links: [
                    {
                        title: "More",
                        items: [
                            {
                                label: "GitHub",
                                href: "https://github.com/finos/regular-table",
                            },
                        ],
                    },
                ],
            },
            prism: {
                theme: lightCodeTheme,
                darkTheme: darkCodeTheme,
            },
        }),
};

module.exports = config;
