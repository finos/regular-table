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

test.describe("scrollToCell()", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("basic scrolling functionality", () => {
        test("scrolls to cell at position (0, 0)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 0);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(0);
            expect(meta.y).toBe(0);
        });

        test("scrolls to cell at position (2, 0)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(2, 0);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(2);
            expect(meta.y).toBe(0);
        });

        test("scrolls to cell at position (0, 5)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 5);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(0);
            expect(meta.y).toBe(5);
        });

        test("scrolls to cell at position (10, 20)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(10, 20);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(10);
            expect(meta.y).toBe(20);
        });
    });

    test.describe("scrolling to large coordinates", () => {
        test("scrolls to large x coordinate (100, 0)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(100, 0);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBeGreaterThanOrEqual(100);
        });

        test("scrolls to large y coordinate (0, 500)", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 500);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.y).toBeGreaterThanOrEqual(500);
        });

        test("scrolls to large x and y coordinates (200, 300)", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(200, 300);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBeGreaterThanOrEqual(200);
            expect(meta.y).toBeGreaterThanOrEqual(300);
        });
    });

    test.describe("sequential scrolling", () => {
        test("scrolls correctly when called multiple times", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // First scroll
            await table.evaluate(async (el) => {
                await el.scrollToCell(5, 10);
            });

            let meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(5);
            expect(meta.y).toBe(10);

            // Second scroll
            await table.evaluate(async (el) => {
                await el.scrollToCell(15, 25);
            });

            meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(15);
            expect(meta.y).toBe(25);
        });

        test("can scroll back to origin after scrolling away", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Scroll away from origin
            await table.evaluate(async (el) => {
                await el.scrollToCell(50, 50);
            });

            // Scroll back to origin
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 0);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            expect(meta.x).toBe(0);
            expect(meta.y).toBe(0);
        });
    });

    test.describe("content verification after scrolling", () => {
        test("displays correct row headers after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 25);
            });

            const firstRowHeader = page.locator(
                "regular-table tbody tr:first-child th:first-child",
            );
            const headerText = await firstRowHeader.textContent();

            expect(headerText).toBe("Group 20");
        });

        test("displays correct column headers after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(25, 0);
            });

            const firstColHeader = page.locator(
                "regular-table thead tr:first-child th:nth-child(2)",
            );
            const headerText = await firstColHeader.textContent();

            expect(headerText).toBe("Group 20");
        });

        test("displays correct cell data after scrolling", async ({ page }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                await el.scrollToCell(10, 15);
            });

            const firstCell = page.locator(
                "regular-table tbody tr:first-child td:first-of-type",
            );
            const cellText = await firstCell.textContent();

            // Cell at (10, 15) should contain the sum (25) formatted as "25"
            expect(cellText).toBe("25");
        });
    });

    test.describe("scroll position updates", () => {
        test("updates scrollTop when scrolling vertically", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            await table.evaluate(async (el) => {
                await el.scrollToCell(0, 20);
            });

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            expect(newScrollTop).toBeGreaterThan(initialScrollTop);
        });

        test("updates scrollLeft when scrolling horizontally", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialScrollLeft = await table.evaluate(
                (el) => el.scrollLeft,
            );

            await table.evaluate(async (el) => {
                await el.scrollToCell(20, 0);
            });

            const newScrollLeft = await table.evaluate((el) => el.scrollLeft);

            expect(newScrollLeft).toBeGreaterThan(initialScrollLeft);
        });

        test("updates both scroll positions when scrolling diagonally", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialPositions = await table.evaluate((el) => ({
                scrollTop: el.scrollTop,
                scrollLeft: el.scrollLeft,
            }));

            await table.evaluate(async (el) => {
                await el.scrollToCell(20, 20);
            });

            const newPositions = await table.evaluate((el) => ({
                scrollTop: el.scrollTop,
                scrollLeft: el.scrollLeft,
            }));

            expect(newPositions.scrollTop).toBeGreaterThan(
                initialPositions.scrollTop,
            );
            expect(newPositions.scrollLeft).toBeGreaterThan(
                initialPositions.scrollLeft,
            );
        });
    });

    test.describe("edge cases", () => {
        test("handles scrolling to negative coordinates gracefully", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // This should not throw an error
            await table.evaluate(async (el) => {
                await el.scrollToCell(-1, -1);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            // Should stay at or near origin
            expect(meta.x).toBeGreaterThanOrEqual(0);
            expect(meta.y).toBeGreaterThanOrEqual(0);
        });

        test("handles scrolling beyond table bounds", async ({ page }) => {
            const table = page.locator("regular-table");

            // Try to scroll beyond the 1000x1000 table
            await table.evaluate(async (el) => {
                await el.scrollToCell(2000, 2000);
            });

            const meta = await table.evaluate((el) => {
                return el.getMeta(document.querySelector("td"));
            });

            // Should be clamped to valid coordinates
            expect(meta.x).toBeLessThan(1000);
            expect(meta.y).toBeLessThan(1000);
        });
    });

    test.describe("async behavior", () => {
        test("waits for animation frame before completing", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const result = await table.evaluate(async (el) => {
                const start = performance.now();
                await el.scrollToCell(10, 10);
                const end = performance.now();
                return end - start;
            });

            // Should take at least some time for animation frame
            expect(result).toBeGreaterThan(0);
        });

        test("redraws the table after scrolling", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let drawCalled = false;
                const originalDraw = el.flush;
                el.flush = async function () {
                    drawCalled = true;
                    return originalDraw.call(this);
                };

                await el.scrollToCell(5, 5);

                // Restore original
                el.flush = originalDraw;

                return drawCalled;
            });

            expect(result).toBe(true);
        });
    });
});
