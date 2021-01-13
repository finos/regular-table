module.exports = {
    preset: process.platform === "darwin" ? "jest-puppeteer-docker" : "jest-puppeteer",
    transform: {},
    coverageDirectory: "coverage",
};
