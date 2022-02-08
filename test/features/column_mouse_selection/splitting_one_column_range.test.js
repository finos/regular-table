/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("column_mouse_selection.html", () => {
    const selectedColumns = async () => {
        const selectedCells = await page.$$("regular-table thead th.mouse-selected-column");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.firstChild.innerHTML, td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({ width: 2500, height: 2500 });
        await page.goto("http://localhost:8081/dist/features/column_mouse_selection.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    describe("splitting a column range", () => {
        let ths;

        beforeAll(async () => {
            ths = await page.$$("regular-table thead th");
        });

        test("selects the columns' headers and cells", async () => {
            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                th.dispatchEvent(event);
            }, ths[17]);

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                th.dispatchEvent(event);
            }, ths[13]);

            await page.waitForSelector("regular-table td.mouse-selected-column");
            expect(await selectedColumns()).toEqual(["Column 6", "Column 7", "Column 8", "Column 9", "Column 10"]);
            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                th.dispatchEvent(event);
            }, ths[15]);

            await page.waitForSelector("regular-table td.mouse-selected-column");
            expect(await selectedColumns()).toEqual(["Column 6", "Column 7", "Column 9", "Column 10"]);
        });
    });
});
