// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▀░█▀▄░█▀▀░█▀▀░█░█░█░░░█▀█░█▀▄░░░░░▀█▀░█▀█░█▀▄░█░░░█▀▀░▀▄░░░░░░░░░░
// ░░░░░░░░░▀▄░░█▀▄░█▀▀░█░█░█░█░█░░░█▀█░█▀▄░▀▀▀░░█░░█▀█░█▀▄░█░░░█▀▀░░▄▀░░░░░░░░░
// ░░░░░░░░░░░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀░▀░░░░░░▀░░▀░▀░▀▀░░▀▀▀░▀▀▀░▀░░░░░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  *  Copyright (c) 2020, the Regular Table Authors. This file is part   *  ┃
// ┃  *  of the Regular Table library, distributed under the terms of the   *  ┃
// ┃  *  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). *  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

describe.skip("row_column_area_selection.html", () => {
    const selectedColumns = async () => {
        const selectedCells = await page.$$(
            "regular-table thead th.mouse-selected-column",
        );
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(
                await page.evaluate((td) => td.firstChild.innerHTML, td),
            );
        }
        return selectedValues;
    };

    beforeEach(async () => {
        await page.setViewport({ width: 2500, height: 2500 });
        await page.goto(
            "http://localhost:8081/dist/examples/row_column_area_selection.html",
        );
        await page.waitForSelector("regular-table table tbody tr td");
    });

    describe("selecting one column", () => {
        test("selects the cells", async () => {
            const ths = await page.$$(
                "regular-table thead tr:nth-of-type(2) th",
            );

            await page.evaluate(async (th) => {
                const event = new MouseEvent("click", { bubbles: true });
                th.dispatchEvent(event);
            }, ths[4]);
            const selectedCells = await page.$$(
                "regular-table tbody tr td.mouse-selected-column",
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
            expect(await selectedColumns()).toEqual(["Column 2"]);
        });
    });
});
