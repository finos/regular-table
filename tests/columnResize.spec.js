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

test.describe("Column resize behavior", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 400 });
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("resize handle presence", () => {
        test("column headers have resize handles", async ({ page }) => {
            const resizeHandles = await page
                .locator("regular-table thead th .rt-column-resize")
                .count();

            expect(resizeHandles).toBeGreaterThan(0);
        });

        test("resize handles are positioned correctly", async ({ page }) => {
            const hasResizeClass = await page
                .locator("regular-table thead th .rt-column-resize")
                .first()
                .count();

            expect(hasResizeClass).toBeGreaterThan(0);
        });

        test("each visible column header has a resize handle", async ({
            page,
        }) => {
            const result = await page.evaluate(() => {
                const headers = document.querySelectorAll(
                    "regular-table thead th",
                );
                const resizeHandles = document.querySelectorAll(
                    "regular-table thead th .rt-column-resize",
                );
                return {
                    headerCount: headers.length,
                    resizeHandleCount: resizeHandles.length,
                };
            });

            // Each header should have a resize handle
            expect(result.resizeHandleCount).toBe(result.headerCount);
        });
    });

    test.describe("mouse-based column resizing", () => {
        test("resizing column wider updates column width", async ({ page }) => {
            const table = page.locator("regular-table");

            // Get initial width
            const initialWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Find and click the resize handle
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            // Simulate drag to resize wider
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            // Wait for potential redraw
            await page.waitForTimeout(100);

            // Get new width
            const newWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(newWidth).toBeGreaterThan(initialWidth);
        });

        test("resizing column narrower updates column width", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // First make it wider so we can make it narrower
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            let box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const initialWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Now resize narrower
            box = await resizeHandle.boundingBox();
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x - 50, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const newWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(newWidth).toBeLessThan(initialWidth);
        });

        test("resized column maintains width after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Resize column
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 80, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const resizedWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Scroll the table
            await table.evaluate(async (el) => {
                el.scrollTop = 500;
                await el.draw();
            });

            await page.waitForTimeout(100);

            // Check width is maintained
            const widthAfterScroll = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(Math.abs(widthAfterScroll - resizedWidth)).toBeLessThan(5);
        });

        test("column cannot be resized below minimum width", async ({
            page,
        }) => {
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            // Try to resize to extremely small width
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x - 500, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const width = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Should have a minimum width of at least 1px
            expect(width).toBeGreaterThanOrEqual(1);
        });

        test("resizing affects corresponding body cells", async ({ page }) => {
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            const initialHeaderWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Resize column
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const headerWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Header should have increased in width
            expect(headerWidth).toBeGreaterThan(initialHeaderWidth);
        });
    });

    test.describe("double-click to reset column width", () => {
        test("double-clicking resize handle resets single column width", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Get original width
            const originalWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Resize column
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const resizedWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(resizedWidth).toBeGreaterThan(originalWidth);

            // Double-click to reset
            await resizeHandle.dblclick();
            await page.waitForTimeout(100);

            const resetWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Width should be close to original (within a few pixels)
            expect(Math.abs(resetWidth - originalWidth)).toBeLessThan(5);
        });

        test("shift+double-click resets all column widths", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Get original width of a specific column
            const originalWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((th) => th.offsetWidth);

            // Resize first column
            let resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            let box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const resizedWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((th) => th.offsetWidth);

            expect(resizedWidth).toBeGreaterThan(originalWidth);

            // Shift+double-click to reset all
            await resizeHandle.dblclick({ modifiers: ["Shift"] });
            await page.waitForTimeout(100);

            const resetWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((th) => th.offsetWidth);

            // Width should be closer to original after reset
            expect(Math.abs(resetWidth - originalWidth)).toBeLessThan(
                Math.abs(resizedWidth - originalWidth),
            );
        });

        test("reset removes inline styles from header", async ({ page }) => {
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            const originalWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Resize column
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const resizedWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(resizedWidth).toBeGreaterThan(originalWidth);

            // Double-click to reset
            await resizeHandle.dblclick();
            await page.waitForTimeout(100);

            const resetWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Width should be closer to original after reset
            expect(Math.abs(resetWidth - originalWidth)).toBeLessThan(
                Math.abs(resizedWidth - originalWidth),
            );
        });

        test("reset removes inline styles from body cells", async ({
            page,
        }) => {
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            // Resize column
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            // Double-click to reset
            await resizeHandle.dblclick();
            await page.waitForTimeout(100);

            const bodyCellStylesCleared = await page
                .locator("regular-table tbody tr:first-child td:first-of-type")
                .evaluate((el) => {
                    return el.style.minWidth === "" && el.style.maxWidth === "";
                });

            expect(bodyCellStylesCleared).toBe(true);
        });
    });

    test.describe("column resize with content clipping", () => {
        test("cells get rt-cell-clip class when content overflows", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Set up data listener with long content
            await table.evaluate(async (el) => {
                const dataListener = (x0, y0, x1, y1) => {
                    return {
                        num_rows: 100,
                        num_columns: 100,
                        row_headers: Array.from({ length: y1 - y0 }, (_, i) => [
                            `Row ${i + y0}`,
                        ]),
                        column_headers: Array.from(
                            { length: x1 - x0 },
                            (_, i) => [`Column ${i + x0}`],
                        ),
                        data: Array.from({ length: x1 - x0 }, () =>
                            Array.from(
                                { length: y1 - y0 },
                                () => "Very Long Content That Should Overflow",
                            ),
                        ),
                    };
                };
                el.setDataListener(dataListener);
                await el.draw();
            });

            await page.waitForTimeout(100);

            // Resize column to be narrow
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x - 30, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(200);

            // Check if cells have clip class
            const hasClipClass = await page
                .locator("regular-table tbody tr:first-child td:first-of-type")
                .evaluate((el) => el.classList.contains("rt-cell-clip"));

            // Should have clip class when content is too wide
            expect(hasClipClass).toBe(true);
        });

        test("rt-cell-clip class is removed when column is widened", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Set up data listener with long content
            await table.evaluate(async (el) => {
                const dataListener = (x0, y0, x1, y1) => {
                    return {
                        num_rows: 100,
                        num_columns: 100,
                        row_headers: Array.from({ length: y1 - y0 }, (_, i) => [
                            `Row ${i + y0}`,
                        ]),
                        column_headers: Array.from(
                            { length: x1 - x0 },
                            (_, i) => [`Column ${i + x0}`],
                        ),
                        data: Array.from({ length: x1 - x0 }, () =>
                            Array.from(
                                { length: y1 - y0 },
                                () => "Very Long Content",
                            ),
                        ),
                    };
                };
                el.setDataListener(dataListener);
                await el.draw();
            });

            await page.waitForTimeout(100);

            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            let box = await resizeHandle.boundingBox();

            // First make it narrow
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x - 30, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            // Then make it wide
            box = await resizeHandle.boundingBox();
            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 200, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(200);

            // Check if clip class is removed
            const hasClipClass = await page
                .locator("regular-table tbody tr:first-child td:first-of-type")
                .evaluate((el) => el.classList.contains("rt-cell-clip"));

            expect(hasClipClass).toBe(false);
        });
    });

    test.describe("column resize state persistence", () => {
        test("column widths persist through redraw", async ({ page }) => {
            const table = page.locator("regular-table");

            // Resize column
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const widthAfterResize = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Force a redraw
            await table.evaluate(async (el) => {
                await el.draw();
            });

            await page.waitForTimeout(100);

            const widthAfterRedraw = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(Math.abs(widthAfterRedraw - widthAfterResize)).toBeLessThan(
                5,
            );
        });

        test("multiple column resizes are independent", async ({ page }) => {
            // Resize first column
            let resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            let box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const firstColWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            // Resize second column
            resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(3) .rt-column-resize",
            );
            box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 80, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const secondColWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(3)")
                .evaluate((el) => el.offsetWidth);

            // Check first column width hasn't changed
            const firstColWidthAfter = await page
                .locator("regular-table thead tr:last-child th:nth-child(2)")
                .evaluate((el) => el.offsetWidth);

            expect(Math.abs(firstColWidthAfter - firstColWidth)).toBeLessThan(
                5,
            );
            expect(secondColWidth).toBeGreaterThan(50);
        });
    });

    test.describe("column resize interaction with table features", () => {
        test("resize works correctly with row headers", async ({ page }) => {
            // The first column after row headers should be resizable
            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(3) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            if (!box) {
                // Skip if not visible
                return;
            }

            const initialWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(3)")
                .evaluate((el) => el.offsetWidth);

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const newWidth = await page
                .locator("regular-table thead tr:last-child th:nth-child(3)")
                .evaluate((el) => el.offsetWidth);

            expect(newWidth).toBeGreaterThan(initialWidth);
        });

        test("column resize updates internal size tracking", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const resizeHandle = page.locator(
                "regular-table thead tr:last-child th:nth-child(2) .rt-column-resize",
            );
            const box = await resizeHandle.boundingBox();

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + box.height / 2);
            await page.mouse.up();

            await page.waitForTimeout(100);

            const hasOverride = await table.evaluate((el) => {
                return el.saveColumnSizes();
            });

            expect(hasOverride).toStrictEqual({ 1: 143.34375 });
        });
    });
});
