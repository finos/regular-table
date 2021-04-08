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

    describe("initial view", () => {
        test("includes defaults", async () => {
            expect(await selectedColumns()).toEqual(["Column 6", "Column 8", "Column 9"]);
        });
    });

    describe("column selection", () => {
        describe("selecting the origin header", () => {
            test("includes no selection", async () => {
                const ths = await page.$$("regular-table thead th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[0]);

                expect(await selectedColumns()).toEqual([]);
            });
        });

        describe("selecting the first column group", () => {
            let ths;

            beforeAll(async () => {
                ths = await page.$$("regular-table thead th");
            });

            test("includes the group and the columns", async () => {
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[1]);

                expect(await selectedColumns()).toEqual(["Group 0", "Column 0", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6", "Column 7", "Column 8", "Column 9"]);
            });

            test("splitting the group with ctrl", async () => {
                expect(await selectedColumns()).toEqual(["Group 0", "Column 0", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6", "Column 7", "Column 8", "Column 9"]);

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                    th.dispatchEvent(event);
                }, ths[9]);

                expect(await selectedColumns()).toEqual(["Column 0", "Column 1", "Column 3", "Column 4", "Column 5", "Column 6", "Column 7", "Column 8", "Column 9"]);
            });
        });
    });
});
