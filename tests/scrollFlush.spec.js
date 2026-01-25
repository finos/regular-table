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

test.describe("Scroll traffic and flush to origin", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.goto("/tests/large_data.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test("renders correct DOM at origin after heavy scroll traffic and flush", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Generate heavy scroll traffic with many rapid scroll operations
        await table.evaluate(async (el) => {
            let scrollPositions = [];
            for (let i = 0; i < 100; i++) {
                scrollPositions.push({
                    top: Math.round(Math.random() * 50) * 1000,
                    left: Math.round(Math.random() * 50) * 1000,
                });
            }

            for (const pos of scrollPositions) {
                el.scrollTop = pos.top;
                el.scrollLeft = pos.left;
                await el.flush();
            }
        });

        // Scroll back to origin and use flush() to wait for rendering
        await table.evaluate(async (el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
            await el.flush();
        });

        // Validate DOM structure
        const hasTableTag = await page.locator("regular-table table").count();
        const hasThead = await page.locator("regular-table thead").count();
        const hasTbody = await page.locator("regular-table tbody").count();

        expect(hasTableTag).toBe(1);
        expect(hasThead).toBe(1);
        expect(hasTbody).toBe(1);

        // Validate first cell content is at origin (0,0 should produce "0")
        const firstCell = await page
            .locator("regular-table tbody tr:first-child td:first-of-type")
            .textContent();
        expect(firstCell).toBe("0");

        // Validate row header shows Row 0
        const firstRowHeader = await page
            .locator("regular-table tbody tr:first-child th:nth-child(2)")
            .textContent();
        expect(firstRowHeader).toBe("Row 0");

        // Validate column header shows Column 0
        const firstColHeader = await page
            .locator("regular-table thead tr:nth-child(2) th:nth-child(3)")
            .textContent();
        expect(firstColHeader).toBe("Column 0");
    });

    test("validates all visible cells at origin after scroll traffic", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        await table.evaluate(async (el) => {
            for (let i = 0; i < 100; i++) {
                el.scrollTop = (i * 997) % 20000;
                el.scrollLeft = (i * 1009) % 20000;
                await el.flush();
            }
        });

        // Flush to origin
        await table.evaluate(async (el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
            await el.flush();
        });

        // Validate first row cell values (should be column indices: 0, 1, 2, ...)
        const firstRowCells = await page
            .locator("regular-table tbody tr:first-child")
            .evaluate((el) =>
                Array.from(el.querySelectorAll("td")).map(
                    (td) => td.textContent,
                ),
            );

        firstRowCells.forEach((cell, idx) => {
            expect(cell).toBe(String(idx));
        });

        const allRowsFirstCells = await page
            .locator("regular-table tbody tr")
            .evaluateAll((rows) =>
                rows.map((row) => {
                    const td = row.querySelector("td");
                    return td ? td.textContent : null;
                }),
            );

        allRowsFirstCells.forEach((cell, rowIdx) => {
            if (cell !== null) {
                expect(cell).toBe(String(rowIdx));
            }
        });
    });
});
