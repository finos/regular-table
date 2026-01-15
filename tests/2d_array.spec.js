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

test.describe("2d_array.html", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 400, height: 100 });
    });

    test.describe("creates a `<table>` body when attached to `document`", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/examples/2d_array/index.html");
            await page.waitForSelector("regular-table table tbody tr td");
        });

        test("with the correct # of rows", async ({ page }) => {
            const tbody = page.locator("regular-table tbody");
            const num_rows = await tbody.evaluate((el) => el.children.length);
            expect(num_rows).toEqual(5);
        });

        test("with the correct # of columns", async ({ page }) => {
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const num_cells = await first_tr.evaluate(
                (el) => el.children.length,
            );
            expect(num_cells).toEqual(3);
        });

        test("with the first row's cell text correct", async ({ page }) => {
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const cell_values = await first_tr.evaluate((el) =>
                Array.from(el.children).map((x) => x.textContent),
            );
            expect(cell_values).toEqual(["0", "A", "true"]);
        });
    });

    test.describe("scrolls via scrollToCell() method", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/examples/2d_array/index.html");
            await page.waitForSelector("regular-table table tbody tr td");
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.draw({ invalid_viewport: true });
            });
        });

        test("to (0, 1)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 1);
            });

            const first_tr = page.locator("regular-table tbody tr:first-child");
            const cell_values = await first_tr.evaluate((el) =>
                Array.from(el.children).map((x) => x.textContent),
            );

            expect(cell_values).toEqual(["1", "B", "false"]);
        });

        test("to (0, 4)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 3);
            });

            const first_tr = page.locator("regular-table tbody tr:first-child");
            const cell_values = await first_tr.evaluate((el) =>
                Array.from(el.children).map((x) => x.textContent),
            );

            expect(cell_values).toEqual(["3", "D", "false"]);
        });
    });
});
