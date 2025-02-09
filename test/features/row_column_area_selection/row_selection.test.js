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
    const selectedRows = async () => {
        const selectedCells = await page.$$(
            "regular-table tbody tr th.mouse-selected-row",
        );
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    let ths;

    beforeEach(async () => {
        await page.setViewport({ width: 2500, height: 2500 });
        await page.goto(
            "http://localhost:8081/dist/examples/row_column_area_selection.html",
        );
        await page.waitForSelector("regular-table table tbody tr td");
        ths = await page.$$("regular-table tbody tr th:nth-of-type(2)");
    });

    describe("selecting one row", () => {
        test("selects the cells", async () => {
            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", { bubbles: true });
                th.dispatchEvent(event);
            }, ths[0]);

            const selectedCells = await page.$$(
                "regular-table tbody tr td.mouse-selected-row",
            );
            const selectedValues = [];
            for (const td of selectedCells) {
                selectedValues.push(
                    await page.evaluate(
                        (td) =>
                            td.innerHTML
                                .trim()
                                .split(" ")
                                .slice(0, 2)
                                .join(" "),
                        td,
                    ),
                );
            }
            expect(selectedValues.length > 0).toEqual(true);
            expect(await selectedRows()).toEqual(["Row 0"]);
        });
    });
});
