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
        await page.setViewport({width: 400, height: 200});
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
                expect(cell_values).toEqual(["   ", " Bookcases  ", " Chairs  "]);
            });

            test("with the correct bottom grouped header", async () => {
                const first_tr = await page.$("regular-table thead tr:last-child");
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
                expect(cell_values).toEqual(["   ", "   ", "   ", "   ", " Sales  ", " Profit  ", " Sales  ", " Profit  "]);
            });
        });

        describe("grouped row headers", () => {
            test("with the correct first row's cells", async () => {
                const first_tr = await page.$$("regular-table tbody th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["TOTAL", "", "Central", "", "Illinois", "", "Arlington Heights", "Aurora", "Bloomington", "Bolingbrook", "Buffalo Grove", "Carol Stream", "Champaign"]);
            });
        });

        describe("headers sorted when clicked", () => {
            beforeAll(async () => {
                await page.click("thead tr:last-child th:last-child");
                await page.evaluate(async () => {
                    await document.querySelector("regular-table").draw();
                });
            });

            test("with the correct column header leaves", async () => {
                const first_tr = await page.$$("regular-table thead tr:last-child th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.textContent, tr));
                }
                expect(cell_values).toEqual(["   ", "   ", "   ", "   ", " Sales  ", " Profit  ", " Sales  ", " Profit  "]);
            });

            test("with the correct first row's cells", async () => {
                const first_tr = await page.$$("regular-table tbody th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["TOTAL", "", "West", "", "California", "", "Los Angeles", "San Francisco", "San Diego", "Sacramento", "Anaheim", "Brentwood", "San Jose"]);
            });
        });

        describe.skip("headers sorted when clicked a 2nd time", () => {
            beforeAll(async () => {
                await page.click("thead tr:last-child th:last-child");
                await page.evaluate(async () => {
                    await document.querySelector("regular-table").draw();
                });
            });

            test("with the correct column header leaves", async () => {
                const first_tr = await page.$$("regular-table thead tr:last-child th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.textContent, tr));
                }
                expect(cell_values).toEqual(["   ", "   ", "   ", "   ", " Sales  ", " Profit  ", " Sales  ", " Profit  "]);
            });

            test("with the correct first row's cells", async () => {
                const first_tr = await page.$$("regular-table tbody th");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["TOTAL", "", "", "", "", "West", "", "California", "", "Los Angeles", "San Francisco", "San Diego", "Anaheim", "Fresno", "Sacramento", "San Jose"]);
            });
        });
    });
});
