/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("fixed_column_width.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 400, height: 100});
    });

    describe("creates a `<table>` with fixed column widths", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/fixed_column_width.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("fixed th has min-width", async () => {
            const first_tr = await page.$("regular-table thead tr:first-child");
            const minWidths = await page.evaluate((first_tr) => Array.from(first_tr.children)
                .map((x) => getComputedStyle(x).getPropertyValue('min-width')), first_tr);
            const fixedWidth = minWidths[0];
            const notSetWidth = minWidths[1];
            expect(fixedWidth).toEqual("100px");
            expect(notSetWidth).toEqual("0px");
        });

        test("fixed th has max-width", async () => {
            const first_tr = await page.$("regular-table thead tr:first-child");
            const max_widths = await page.evaluate((first_tr) => Array.from(first_tr.children)
                .map((x) => getComputedStyle(x).getPropertyValue('max-width')), first_tr);
            const fixed_width = max_widths[0];
            const not_set_width = max_widths[1];
            expect(fixed_width).toEqual("100px");
            expect(not_set_width).toEqual("none");
        });


        test("fixed td has min-width", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const minWidths = await page.evaluate((first_tr) => Array.from(first_tr.children)
                .map((x) => getComputedStyle(x).getPropertyValue('min-width')), first_tr);
            const fixedWidth = minWidths[0];
            const notSetWidth = minWidths[1];
            expect(fixedWidth).toEqual("100px");
            expect(notSetWidth).toEqual("0px");
        });

        test("fixed td has max-width", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const max_widths = await page.evaluate((first_tr) => Array.from(first_tr.children)
                .map((x) => getComputedStyle(x).getPropertyValue('max-width')), first_tr);
            const fixed_width = max_widths[0];
            const not_set_width = max_widths[1];
            expect(fixed_width).toEqual("100px");
            expect(not_set_width).toEqual("none");
        });

        test("cell value do not overflow", async () => {
            const first_td = await page.$("regular-table tbody tr td:first-child");
            const { text_overflow, overflow, white_space } = await page.evaluate((first_td) => {
                first_td.text_content = 'ABCDEFGHABCDEFGHABCDEFGHABCDEFGH';
                const styles = getComputedStyle(first_td);
                return {
                    text_overflow: styles.getPropertyValue('text-overflow'),
                    overflow: styles.getPropertyValue('overflow'),
                    white_space: styles.getPropertyValue('white-space')
                };
            }, first_td);
            expect(text_overflow).toEqual("ellipsis");
            expect(overflow).toEqual("hidden");
            expect(white_space).toEqual("nowrap");
        });

        test("ths do not allow text selection", async () => {
            const first_tr = await page.$("regular-table thead tr:first-child");
            const user_selects = await page.evaluate((first_tr) => Array.from(first_tr.children)
                .map((x) => getComputedStyle(x).getPropertyValue('user-select')), first_tr);
            expect(user_selects).toEqual(["none", "none", "none", "none"]);
        });
    });
});
