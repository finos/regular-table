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
            selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({width: 2500, height: 2500});
        await page.goto("http://localhost:8081/dist/examples/column_mouse_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("selecting a column range", () => {
        let ths;

        beforeAll(async () => {
            ths = await page.$$("regular-table thead th");
        });

        test("selects the columns' headers and cells", async () => {
            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", { bubbles: true });
                th.dispatchEvent(event);
            }, ths[9]);

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", { bubbles: true, shiftKey: true });
                th.dispatchEvent(event);
            }, ths[11]);

            await page.waitFor("regular-table td.mouse-selected-column");
            expect(await selectedColumns()).toEqual(["Column 2", "Column 3", "Column 4"]);
        });
    });
});
