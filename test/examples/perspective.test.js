/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("perspective.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 200, height: 100});
    });

    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/perspective.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("with the first row's cells from superstore.arrow", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent), first_tr);
            expect(cell_values).toEqual(["1", "CA-2016-152156", "11/8/2016"]);
        });
    });
});
