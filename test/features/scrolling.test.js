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
        await page.setViewport({ width: 260, height: 200 });
    });

    describe("scrolls down", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/test/features/2_row_2_column_headers.html");
            await page.waitForSelector("regular-table table tbody tr td");
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTop = 1000;
                await table._draw_flush();
            }, table);
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(9);
        });

        test("with the correct # of columns", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const num_cells = await page.evaluate((first_tr) => first_tr.children.length, first_tr);
            expect(num_cells).toEqual(6);
        });

        test("with the first row's <td> test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.querySelectorAll("td")).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["52", "53", "54", "55"]);
        });
    });

    describe("scrolls right", () => {
        beforeAll(async () => {
            const table = await page.$("regular-table");
            await page.waitForSelector("regular-table table tbody tr td");
            await page.evaluate(async (table) => {
                table.scrollTop = 0;
                table.scrollLeft = 1000;
                await table._draw_flush();
            }, table);
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(8);
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
});
