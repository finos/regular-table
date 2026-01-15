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

test.describe("react.html", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 200, height: 100 });
    });

    test.describe("creates a `<table>` body when attached to `document`", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/examples/react/index.html");
            await page.waitForSelector("regular-table table tbody tr td");
        });

        test("with the correct # of rows", async ({ page }) => {
            const tbody = page.locator("regular-table tbody");
            const num_rows = await tbody.evaluate((el) => el.children.length);
            expect(num_rows).toEqual(5);
        });

        test("with the first row's cell text correct", async ({ page }) => {
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const cell_values = await first_tr.evaluate((el) =>
                Array.from(el.children).map((x) => x.textContent),
            );
            expect(cell_values).toEqual(["Group 0", "Row 0", "0", "1"]);
        });
    });

    test.describe("scrolls correctly to bottom and right edges", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/examples/react/index.html");
            await page.waitForSelector("regular-table table tbody tr td");
        });

        test("scrolls to bottom and displays correct DOM", async ({ page }) => {
            const table = page.locator("regular-table");

            // Get the max scroll position for the table (1000 rows total)
            const maxScrollTop = await table.evaluate(async (el) => {
                // Scroll to a very large value to reach the end
                el.scrollTop = 999999;
                await el.draw();
                return el.scrollTop;
            });

            // Verify we scrolled down significantly
            expect(maxScrollTop).toBeGreaterThan(1000);

            // Check that rows are rendered at the bottom
            const tbody = page.locator("regular-table tbody");
            const num_rows = await tbody.evaluate((el) => el.children.length);
            expect(num_rows).toBeGreaterThan(0);

            // Check that the visible rows are near the end of the data
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const row_header = await first_tr
                .locator("th:nth-child(2)")
                .textContent();

            // Should show rows with high numbers (near row 1000)
            expect(row_header).toMatch(/Row \d+/);
            const row_num = parseInt(
                row_header.match(/Row ([\d,]+)/)[1].replace(/,/g, ""),
            );
            expect(row_num).toBeGreaterThan(900);
        });

        test("scrolls to right edge and displays correct DOM", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Get the max scroll position for the table (50 columns total)
            const maxScrollLeft = await table.evaluate(async (el) => {
                // Scroll to a very large value to reach the end
                el.scrollLeft = 999999;
                await el.draw();
                return el.scrollLeft;
            });

            // Verify we scrolled right significantly
            expect(maxScrollLeft).toBeGreaterThan(500);

            // Check that cells are rendered at the right edge
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const num_cells = await first_tr.evaluate(
                (el) => el.querySelectorAll("td").length,
            );
            expect(num_cells).toBeGreaterThan(0);

            // Check that the visible columns are near the end of the data
            const thead = page.locator("regular-table thead");
            const first_col_header = await thead
                .locator("tr:first-child th:nth-child(2)")
                .textContent();

            // Should show columns with high numbers (near column 50)
            expect(first_col_header).toMatch(/Group \d+/);
            const col_group = parseInt(
                first_col_header.match(/Group (\d+)/)[1],
            );
            expect(col_group).toBeGreaterThan(30);
        });

        test("scrolls to bottom-right corner and displays correct DOM", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Scroll to bottom-right corner
            await table.evaluate(async (el) => {
                el.scrollTop = 999999;
                el.scrollLeft = 999999;
                await el.draw();
            });

            const scrollPos = await table.evaluate((el) => ({
                scrollTop: el.scrollTop,
                scrollLeft: el.scrollLeft,
            }));

            // Verify we scrolled in both directions
            expect(scrollPos.scrollTop).toBeGreaterThan(1000);
            expect(scrollPos.scrollLeft).toBeGreaterThan(500);

            // Check that the table structure is intact
            const tbody = page.locator("regular-table tbody");
            const num_rows = await tbody.evaluate((el) => el.children.length);
            expect(num_rows).toBeGreaterThan(0);

            const first_tr = page.locator("regular-table tbody tr:first-child");
            const num_cells = await first_tr.evaluate(
                (el) => el.querySelectorAll("td").length,
            );
            expect(num_cells).toBeGreaterThan(0);

            // Check row headers show high row numbers
            const row_header = await first_tr
                .locator("th:nth-child(2)")
                .textContent();
            expect(row_header).toMatch(/Row \d+/);
            const row_num = parseInt(
                row_header.match(/Row ([\d,]+)/)[1].replace(/,/g, ""),
            );
            expect(row_num).toBeGreaterThan(900);

            // Check column headers show high column numbers
            const thead = page.locator("regular-table thead");
            const col_header = await thead
                .locator("tr:first-child th:nth-child(2)")
                .textContent();
            expect(col_header).toMatch(/Group \d+/);
            const col_group = parseInt(col_header.match(/Group (\d+)/)[1]);
            expect(col_group).toBeGreaterThan(30);

            // Check that cell values are correct (they should be high numbers)
            const first_cell = await first_tr
                .locator("td:first-of-type")
                .textContent();
            expect(first_cell).toMatch(/^[\d,]+$/);
            const cell_value = parseInt(first_cell.replace(/,/g, ""));
            expect(cell_value).toBeGreaterThan(900);
        });

        test("can scroll back to origin after scrolling to edges", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Scroll to bottom-right
            await table.evaluate(async (el) => {
                el.scrollTop = 999999;
                el.scrollLeft = 999999;
                await el.draw();
            });

            // Scroll back to origin
            await table.evaluate(async (el) => {
                el.scrollTop = 0;
                el.scrollLeft = 0;
                await el.draw();
            });

            // Check that we're back at the beginning
            const first_tr = page.locator("regular-table tbody tr:first-child");
            const cell_values = await first_tr.evaluate((el) =>
                Array.from(el.children).map((x) => x.textContent),
            );

            // Should start with the expected headers and first cells
            expect(cell_values[0]).toEqual("Group 0");
            expect(cell_values[1]).toEqual("Row 0");
            expect(cell_values[2]).toEqual("0");
            expect(cell_values[3]).toEqual("1");
        });
    });
});
