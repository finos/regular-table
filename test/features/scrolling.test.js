/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("scrolling", () => {
    beforeAll(async () => {
        await page.setViewport({width: 260, height: 200});
    });

    describe("scrolls down", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/test/features/2_row_2_column_headers.html");
            await page.waitFor("regular-table table tbody tr td");
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTop = 1000;
                await table.draw();
            }, table);
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(10);
        });

        test("with the correct # of columns", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const num_cells = await page.evaluate((first_tr) => first_tr.children.length, first_tr);
            expect(num_cells).toEqual(5);
        });

        test("with the first row's <td> test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.querySelectorAll("td")).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["40", "41", "42"]);
        });
    });

    describe("scrolls right", () => {
        beforeAll(async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTop = 0;
                table.scrollLeft = 1000;
                await table.draw();
            }, table);
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(10);
        });

        test("with the correct # of columns", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const num_cells = await page.evaluate((first_tr) => first_tr.children.length, first_tr);
            expect(num_cells).toEqual(4);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.querySelectorAll("td")).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["16", "17"]);
        });
    });

    describe("scrolls via scrollTo() method", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/two_billion_rows.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test.skip("https://github.com/jpmorganchase/regular-table/issues/15", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(0, 647, 1000, 1000);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["647"]);
        });
    });
});
