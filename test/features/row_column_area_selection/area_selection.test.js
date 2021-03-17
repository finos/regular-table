/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe.skip("row_column_area_selection.html", () => {
    beforeEach(async () => {
        await page.setViewport({width: 2500, height: 2500});
        await page.goto("http://localhost:8081/dist/examples/row_column_area_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("selecting one cell", () => {
        test("includes one selection", async () => {
            const tds = await page.$$("regular-table tbody tr td:nth-of-type(1)");

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, tds[0]);

            const selectedCells = await page.$$("regular-table tbody tr td.mouse-selected-area");
            expect(selectedCells.length).toEqual(1);
        });
    });
});
