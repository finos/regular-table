/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("web_worker.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 250, height: 100});
    });

    // TODO don't run these, they depend on unpkg.com
    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/web_worker.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows).toEqual(5);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["0", "1", "2", "3"]);
        });
    });

    describe("scrolls down", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/web_worker.html");
            const table = await page.$("regular-table");
            await page.waitFor("regular-table table tbody tr td");
            await page.evaluate(async (table) => {
                table.scrollTop = 1000;
                await table.draw();
            }, table);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["200,002", "200,003", "200,004", "200,005"]);
        });
    });
});
