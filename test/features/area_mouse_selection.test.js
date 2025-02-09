/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("area_mouse_selection.html", () => {
    const selectedCellValues = async () => {
        const selectedCells = await page.$$(
            "regular-table tbody tr td.mouse-selected-area",
        );
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({ width: 300, height: 300 });
        await page.goto(
            "http://localhost:8081/dist/features/area_mouse_selection.html",
        );
        await page.waitForSelector("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("includes no selection", async () => {
            const selectedCells = await page.$$(
                "regular-table tbody tr td.mouse-selected-area",
            );
            expect(selectedCells.length).toEqual(0);
        });
    });

    describe("selecting one cell", () => {
        test("includes one selection", async () => {
            const tds = await page.$$(
                "regular-table tbody tr td:nth-of-type(1)",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", { bubbles: true });
                td.dispatchEvent(event);
            }, tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", { bubbles: true });
                td.dispatchEvent(event);
            }, tds[0]);

            const selectedCells = await page.$$(
                "regular-table tbody tr td.mouse-selected-area",
            );
            expect(selectedCells.length).toEqual(1);
        });
    });

    describe("selecting an area", () => {
        test("selects along a row", async () => {
            const row1Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(1) td",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", { bubbles: true });
                td.dispatchEvent(event);
            }, row1Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", { bubbles: true });
                td.dispatchEvent(event);
            }, row1Tds[2]);

            expect(await selectedCellValues()).toEqual(["0", "1", "2"]);
        });

        test("selects along a column, bottom to top", async () => {
            const row1Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(1) td",
            );
            const row5Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(5) td",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", { bubbles: true });
                td.dispatchEvent(event);
            }, row5Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", { bubbles: true });
                td.dispatchEvent(event);
            }, row1Tds[0]);

            expect(await selectedCellValues()).toEqual([
                "0",
                "1",
                "2",
                "3",
                "4",
            ]);
        });

        test("selects in a rectangle, bottom-right to top-left", async () => {
            const row2Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(2) td",
            );
            const row5Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(5) td",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", { bubbles: true });
                td.dispatchEvent(event);
            }, row5Tds[2]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", { bubbles: true });
                td.dispatchEvent(event);
            }, row2Tds[1]);

            expect(await selectedCellValues()).toEqual([
                "2",
                "3",
                "3",
                "4",
                "4",
                "5",
                "5",
                "6",
            ]);
        });

        test("keeps selection on CTRL", async () => {
            const row2Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(2) td",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", { bubbles: true });
                td.dispatchEvent(event);
            }, row2Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", { bubbles: true });
                td.dispatchEvent(event);
            }, row2Tds[1]);

            expect(await selectedCellValues()).toEqual(["1", "2"]);

            const row5Tds = await page.$$(
                "regular-table tbody tr:nth-of-type(5) td",
            );

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {
                    bubbles: true,
                    ctrlKey: true,
                });
                td.dispatchEvent(event);
            }, row5Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {
                    bubbles: true,
                    ctrlKey: true,
                });
                td.dispatchEvent(event);
            }, row5Tds[1]);

            expect(await selectedCellValues()).toEqual(["1", "2", "4", "5"]);
        });
    });
});
