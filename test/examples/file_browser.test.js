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

describe("file_browser.html", () => {
    beforeAll(async () => {
        await page.setViewport({ width: 400, height: 100 });
    });

    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto(
                "http://localhost:8081/dist/examples/file_browser.html",
            );
            await page.waitForSelector("regular-table table tbody tr td");
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate(
                (first_tr) =>
                    Array.from(first_tr.children).map((x) =>
                        x.textContent.trim(),
                    ),
                first_tr,
            );
            expect(cell_values.slice(0, 1)).toEqual(["Dir_0"]);
            expect(cell_values.length).toEqual(5);
        });
    });

    describe("when a directory row header is clicked", () => {
        describe("in a collapsed state", () => {
            beforeAll(async () => {
                let dir = await page.$(
                    "regular-table tbody tr:first-child th:last-of-type",
                );
                await dir.click();
            });

            afterAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = 0;
                    await table.draw();
                }, table);
            });

            test("it expands, inserting contents in the next rows", async () => {
                const first_row_header_icon = await page.$(
                    "regular-table tbody tr:nth-child(2) th:last-of-type",
                );
                const icon_text = await page.evaluate(
                    (x) => x.innerText,
                    first_row_header_icon,
                );
                expect(icon_text).toEqual("Dir_0");
            });
        });

        describe("in an expanded state", () => {
            beforeAll(async () => {
                let dir = await page.$(
                    "regular-table tbody tr:first-child th:last-of-type",
                );
                await dir.click();
            });

            afterAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = 0;
                    await table.draw();
                }, table);
            });

            test("it collapses, removing the inserted elements", async () => {
                const first_row_header_icon = await page.$(
                    "regular-table tbody tr:nth-child(2) th:last-of-type",
                );
                const icon_text = await page.evaluate(
                    (x) => x.innerText,
                    first_row_header_icon,
                );
                expect(icon_text).toEqual("Dir_1");
            });
        });
    });
});
