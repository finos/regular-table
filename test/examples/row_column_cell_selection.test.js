/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("row_column_cell_selection.html", () => {
    const selectedCellValues = async () => {
        const selectedCells = await page.$$("regular-table tbody tr td.cell-selected");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    const selectedColumns = async () => {
        const selectedCells = await page.$$("regular-table thead th.column-selected");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
        }
        return selectedValues;
    };

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
        await page.goto("http://localhost:8081/dist/examples/row_column_cell_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("includes no selection", async () => {
            expect(await selectedCellValues()).toEqual([]);
            expect(await selectedRows()).toEqual([]);
            expect(await selectedColumns()).toEqual([]);
        });
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

            const selectedCells = await page.$$("regular-table tbody tr td.cell-selected");
            expect(selectedCells.length).toEqual(1);
        });
    });

    describe("selecting one column", () => {
        beforeEach(async () => {
            const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true});
                th.dispatchEvent(event);
            }, ths[4]);
        });

        test("selects the cells", async () => {
            const selectedCells = await page.$$("regular-table tbody tr td.column-selected");
            const selectedValues = [];
            for (const td of selectedCells) {
                selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
            }
            expect(selectedValues.length).toEqual(131);
        });

        test("includes the column", async () => {
            expect(await selectedColumns()).toEqual(["Column 2"]);
        });
    });

    describe("selecting one row", () => {
        beforeEach(async () => {
            const ths = await page.$$("regular-table tbody tr th:nth-of-type(2)");

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", {bubbles: true});
                th.dispatchEvent(event);
            }, ths[0]);
        });

        test("selects the cells", async () => {
            const selectedCells = await page.$$("regular-table tbody tr td.row-selected");
            const selectedValues = [];
            for (const td of selectedCells) {
                selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
            }
            expect(selectedValues.length).toEqual(35);
        });

        test("selects the row", async () => {
            expect(await selectedRows()).toEqual(["Row 0"]);
        });
    });
});
