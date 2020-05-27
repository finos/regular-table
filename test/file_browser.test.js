/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("file_browser.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 400, height: 100});
    });

    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/file_browser.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(5);
        });

        test("with the correct # of columns", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const num_cells = await page.evaluate((first_tr) => first_tr.children.length, first_tr);
            expect(num_cells).toEqual(4);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "add able/",
                "1/1/1971",
                "dir",
                "false"
            ]);
        });
    });

    describe("scrolls via scrollTo() method", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/file_browser.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("to (0, 1)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(0, 1, 3, 26);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "add easy/",
                "1/5/1971",
                "dir",
                "false",
            ]);
        });

        test("to (0, 4)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(0, 4, 3, 26);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "file_6.txt",
                "1/17/1971",
                "text",
                "false",
            ]);
        });
    });

    // TODO: get the expand/collapse tests working
    // describe("expands and collapses directory nodes", () => {
    //     beforeAll(async () => {
    //         await page.goto("http://localhost:8081/examples/file_browser.html");
    //         await page.waitFor("regular-table table tbody tr td");
    //     });

    //     test("expands the first directory node", async () => {
    //         const first_row_header_icon = await page.$("regular-table tbody tr:first-child .pd-row-header-icon");
    //         await first_row_header_icon.evaluate((x) => x.click());

    //         // test the contents of the first and last nodes added by the expansion
    //         let tr = await page.$("regular-table tbody tr:nth-child(2)");
    //         let cell_values = await page.evaluate((tr) => Array.from(tr.children).map((x) => x.textContent.trim()), tr);
    //         expect(cell_values).toEqual([
    //             "add able/",
    //             "12/31/1970",
    //             "dir",
    //             "false"
    //         ]);

    //         tr = await page.$("regular-table tbody tr:nth-child(101)");
    //         cell_values = await page.evaluate((tr) => Array.from(tr.children).map((x) => x.textContent.trim()), tr);
    //         expect(cell_values).toEqual([
    //             "add able/",
    //             "12/31/1970",
    //             "dir",
    //             "false"
    //         ]);
    //     });
    // });
});
