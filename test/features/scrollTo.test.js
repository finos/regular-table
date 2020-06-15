/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("scrollTo", () => {
    beforeAll(async () => {
        await page.setViewport({width: 200, height: 200});
        await page.goto("http://localhost:8081/test/features/2_row_2_column_headers.html");
        await page.evaluate(async () => {
            await document.querySelector("regular-table").draw();
        });
    });

    afterEach(async () => {
        const table = await page.$("regular-table");
        await page.evaluate(async (table) => {
            table.reset_scroll();
            await table.draw();
        }, table);
    });

    describe("sets the correct position", () => {
        test("for scrollTo position {x: 2, y: 0}", async () => {
            const table = await page.$("regular-table");

            await page.evaluate(async (table) => {
                table.scrollTo(2, 0, 1000, 1000);
                await table.draw();
            }, table);

            const meta = await page.evaluate((table) => {
                return table.getMeta(document.querySelector("td"));
            }, table);
            expect(meta.x).toEqual(1);
        });

        test("for scrollTo position {x: 1000, y: 0}", async () => {
            const table = await page.$("regular-table");

            await page.evaluate(async (table) => {
                table.scrollTo(1000, 0, 1000, 1000);
                await table.draw();
            }, table);

            const meta = await page.evaluate((table) => {
                return table.getMeta(document.querySelector("td"));
            }, table);
            expect(meta.x).toEqual(999);
        });

        test("for scrollTo position {x: 0, y: 1}", async () => {
            const table = await page.$("regular-table");

            await page.evaluate(async (table) => {
                table.scrollTo(0, 1, 1000, 1000);
                await table.draw();
            }, table);

            const meta = await page.evaluate((table) => {
                return table.getMeta(document.querySelector("td"));
            }, table);
            expect(meta.y).toEqual(1);
        });

        test("for scrollTo position {x: 211, y: 647}", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(211, 647, 1000, 1000);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["Group 640", "Row 647", "858"]);
        });
    });
});
