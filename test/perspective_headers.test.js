/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("perspective_headers.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 200, height: 100});
    });

    describe("Loads a regular-table with perspective backend superstore example", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/perspective_headers.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        describe("grouped column headers", () => {
            test("with the correct top grouped header", async () => {
                const first_tr = await page.$("regular-table thead tr:first-child");
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
                expect(cell_values).toEqual(["   ", " Furniture  "]);
            });

            test("with the correct middle grouped header", async () => {
                const first_tr = await page.$("regular-table thead tr:nth-child(2)");
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
                expect(cell_values).toEqual(["   ", " Bookcases  "]);
            });

            test("with the correct bottom grouped header", async () => {
                const first_tr = await page.$("regular-table thead tr:last-child");
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
                expect(cell_values).toEqual(["    ", " Sales   "]);
            });
        });

        describe("grouped row headers", () => {
            test("with the correct first row's cells", async () => {
                const first_tr = await page.$$("regular-table tbody th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["", "", "", "Central", "", "", "", "Illinois", "", "", "Arlington Heights", "Aurora"]);
            });
        });
    });
});
