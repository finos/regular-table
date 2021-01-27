module.exports = {
    server: {
        command: "NODE_ENV=development yarn start 8081",
        launchTimeout: 30000,
        port: 8081,
        waitOnScheme: {
            resources: ["dist/css/material.css", "dist/umd/regular-table.js"],
        },
    },
};
