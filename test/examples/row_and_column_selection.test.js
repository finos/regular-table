/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("row_and_column_selection.html", () => {
    const selectedRows = async () => {
        const selectedCells = await page.$$("regular-table tbody tr th.row-selected");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({width: 2500, height: 2500});
        await page.goto("http://localhost:8081/dist/examples/row_and_column_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("includes no selection", async () => {
            expect(await selectedRows()).toEqual([]);
        });
    });

    describe("selecting one group", () => {
        test("includes the group and the rows", async () => {
            const ths = await page.$$("regular-table tbody tr th:nth-of-type(1)");

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true});
                th.dispatchEvent(event);
            }, ths[0]);

            expect(await selectedRows()).toEqual(["Group 0", "Row 0", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9"]);
        });
    });
});
