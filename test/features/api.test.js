/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("JS API", () => {
    beforeAll(async () => {
        await page.goto("http://localhost:8081/test/features/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test("preserve_state works", async () => {
        const table = await page.$("regular-table");
        const meta = await page.evaluate(async (table) => {
            await table.draw();
            table._column_sizes.override[0] = 200;
            await table.draw();
            table.setDataListener(window.dataListener, {
                preserve_state: true,
            });

            await table.draw();
            return JSON.stringify(table.getMeta(document.querySelector("td")));
        }, table);

        expect(JSON.parse(meta)).toEqual({
            column_header: ["Group 0", "Column 0"],
            row_header: ["Group 0", "Row 0"],
            dx: 0,
            dy: 0,
            size_key: 2,
            _virtual_x: 2,
            value: "0",
            x: 0,
            x0: 0,
            x1: 15,
            y: 0,
            y0: 0,
            y1: 29,
        });
    });
});
