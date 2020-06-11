/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("2d_array.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 400, height: 100});
    });

    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/dist/examples/2d_array.html");
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
            expect(num_cells).toEqual(3);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["0", "A", "true"]);
        });
    });

    describe("scrolls via scrollTo() method", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/dist/examples/2d_array.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("to (0, 1)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table._invalid_schema = true;
                table.scrollTo(0, 1, 3, 26);
                await table.draw({invalid_viewport: true});
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["1", "B", "false"]);
        });

        test("to (0, 4)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table._invalid_schema = true;
                table.scrollTo(0, 4, 3, 26);
                await table.draw({invalid_viewport: true});
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["3", "D", "false"]);
        });
    });
});
