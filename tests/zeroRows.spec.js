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

import { test, expect } from "@playwright/test";

const NUM_COLUMNS = 20;
const NUM_ROW_HEADERS = 2;

/**
 * Install a data listener whose row count can be toggled to zero via
 * `window.__num_rows`. Row headers are deliberately narrow and column
 * headers deliberately wide, so that a data column mis-keyed into a
 * row-header size slot is visible as a large width change.
 */
async function install(page) {
    await page.evaluate(
        ({ NUM_COLUMNS, NUM_ROW_HEADERS }) => {
            const range = (x0, x1, f) =>
                Array.from(Array(Math.max(0, x1 - x0)).keys()).map((x) =>
                    f(x + x0),
                );

            window.__num_rows = 100;
            const dataListener = async (x0, y0, x1, y1) => {
                const num_rows = window.__num_rows;
                y1 = Math.min(y1, num_rows);
                return {
                    num_rows,
                    num_columns: NUM_COLUMNS,
                    num_row_headers: NUM_ROW_HEADERS,
                    num_column_headers: 1,
                    row_headers: range(y0, y1, (i) => [`${i}`, `${i}`]),
                    column_headers: range(x0, x1, (i) => [
                        `A very long column header ${i}`,
                    ]),
                    data: range(x0, x1, (x) =>
                        range(y0, y1, (y) => `${x * y}`),
                    ),
                };
            };

            const table = document.querySelector("regular-table");
            table.setDataListener(dataListener);
        },
        { NUM_COLUMNS, NUM_ROW_HEADERS },
    );
}

async function redraw(page, num_rows) {
    await page.evaluate(async (num_rows) => {
        window.__num_rows = num_rows;
        const table = document.querySelector("regular-table");
        await table.draw();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
    }, num_rows);
}

/**
 * Snapshot the last `<thead>` row: size key, corner-ness and width of
 * each `<th>`.
 */
async function measure(page) {
    return await page.evaluate(() => {
        const table = document.querySelector("regular-table");
        const ths = Array.from(
            document.querySelectorAll("regular-table thead tr:last-child th"),
        );

        return ths.map((th) => {
            const meta = table.getMeta(th);
            return {
                size_key: meta.size_key,
                x: meta.x,
                corner: th.classList.contains("rt-group-corner"),
                col_class: Array.from(th.classList).find((c) =>
                    /^rt-col-\d+$/.test(c),
                ),
                width: th.getBoundingClientRect().width,
            };
        });
    });
}

test.describe("Zero-row draws with row headers", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 400 });
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
        await install(page);
        await page.evaluate(async () => {
            await document.fonts.ready;
        });

        await redraw(page, 100);
    });

    test("corner headers are drawn and data columns keep their size keys", async ({
        page,
    }) => {
        const before = await measure(page);
        expect(before.slice(0, NUM_ROW_HEADERS).map((h) => h.size_key)).toEqual(
            [0, 1],
        );

        expect(before[NUM_ROW_HEADERS].size_key).toBe(NUM_ROW_HEADERS);

        await redraw(page, 0);
        expect(await page.locator("regular-table tbody tr").count()).toBe(0);

        const empty = await measure(page);
        const corners = empty.slice(0, NUM_ROW_HEADERS);
        expect(corners.every((h) => h.corner)).toBe(true);
        expect(corners.map((h) => h.size_key)).toEqual([0, 1]);
        expect(corners.map((h) => h.col_class)).toEqual([
            "rt-col-0",
            "rt-col-1",
        ]);

        const first_data = empty[NUM_ROW_HEADERS];
        expect(first_data.corner).toBe(false);
        expect(first_data.x).toBe(0);
        expect(first_data.size_key).toBe(NUM_ROW_HEADERS);
        expect(first_data.col_class).toBe(`rt-col-${NUM_ROW_HEADERS}`);
    });

    test("row header widths survive a round trip through zero rows", async ({
        page,
    }) => {
        const before = await measure(page);
        const before_widths = before
            .slice(0, NUM_ROW_HEADERS)
            .map((h) => h.width);

        await redraw(page, 0);
        await redraw(page, 100);

        const after = await measure(page);
        expect(after.slice(0, NUM_ROW_HEADERS).map((h) => h.size_key)).toEqual([
            0, 1,
        ]);

        expect(after.slice(0, NUM_ROW_HEADERS).map((h) => h.width)).toEqual(
            before_widths,
        );
    });
});
