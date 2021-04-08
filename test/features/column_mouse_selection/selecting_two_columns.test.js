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
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("selecting two columns", () => {
        describe("without CTRL pressed", () => {
            test("includes only the most recent selection", async () => {
                const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[3]);

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: false});
                    th.dispatchEvent(event);
                }, ths[5]);

                expect(await selectedColumns()).toEqual(["Column 3"]);
            });
        });

        describe("with CTRL pressed", () => {
            test("includes both columns", async () => {
                const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[3]);

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                    th.dispatchEvent(event);
                }, ths[5]);

                expect(await selectedColumns()).toEqual(["Column 1", "Column 3"]);
            });
        });
    });
});
