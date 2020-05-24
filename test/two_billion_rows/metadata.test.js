/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("Two billion rows", () => {
    beforeAll(async () => {
        await page.setViewport({width: 200, height: 100});
        await page.goto("http://localhost:8081/examples/two_billion_rows.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("get_meta()", () => {
        test("returns the correct value for (0,0)", async () => {
            const table = await page.$("regular-table");
            const meta = await page.evaluate((table) => {
                return JSON.stringify(table.get_meta(document.querySelector("td")));
            }, table);
            expect(JSON.parse(meta)).toEqual({
                cidx: 0,
                column: "Column 0",
                is_open: false,
                ridx: 0,
                size_key: "Column 0|undefined",
                value: "0",
            });
        });

        describe("with the viewport scrolled to the right", () => {
            beforeAll(async () => {
                await page.goto("http://localhost:8081/examples/two_billion_rows.html");
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollLeft = 1000;
                    await table.draw();
                }, table);
            });

            test("returns the correct value for (0,0)", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(table.get_meta(document.querySelector("td")));
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    cidx: 16,
                    column: "Column 16",
                    is_open: false,
                    ridx: 0,
                    size_key: "Column 16|undefined",
                    value: "16",
                });
            });
        });

        describe("with the viewport scrolled down", () => {
            beforeAll(async () => {
                await page.goto("http://localhost:8081/examples/two_billion_rows.html");
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = 1000;
                    await table.draw();
                }, table);
            });

            test("returns the correct value for (0,0)", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(table.get_meta(document.querySelector("td")));
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    cidx: 0,
                    column: "Column 0",
                    is_open: false,
                    ridx: 200002,
                    size_key: "Column 0|undefined",
                    value: "200,002",
                });
            });
        });
    });
});
