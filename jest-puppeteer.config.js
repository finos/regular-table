module.exports = {
    server: {
        command: "yarn start -p 8081",
        launchTimeout: 30000,
        port: 8081,
        waitOnScheme: {
            resources: ["dist/css/material.css", "dist/esm/regular-table.js"],
        },
    },
};
