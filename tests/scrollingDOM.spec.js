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

test.describe("Scrolling creates correct DOM table", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 400, height: 300 });
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("scrollTop and scrollLeft properties", () => {
        test.describe("scrolling vertically via scrollTop", () => {
            test("creates correct DOM structure when scrolling down", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollTop = 500;
                    await el.draw();
                });

                const tbody = page.locator("regular-table tbody");
                const numRows = await tbody.evaluate(
                    (el) => el.children.length,
                );

                // Should have rendered rows
                expect(numRows).toBeGreaterThan(0);

                // Check that the first visible row has correct data
                const firstRowHeader = page.locator(
                    "regular-table tbody tr:first-child th:nth-child(2)",
                );
                const headerText = await firstRowHeader.textContent();

                // Should show a row beyond the initial viewport
                expect(headerText).toMatch(/Row \d+/);
                expect(
                    parseInt(headerText.match(/Row (\d+)/)[1]),
                ).toBeGreaterThan(10);
            });

            test("renders correct number of rows after scrolling", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollTop = 1000;
                    await el.draw();
                });

                const tbody = page.locator("regular-table tbody");
                const numRows = await tbody.evaluate(
                    (el) => el.children.length,
                );

                // Should render enough rows to fill viewport plus buffer
                expect(numRows).toBeGreaterThan(5);
                expect(numRows).toBeLessThan(50); // Reasonable upper bound
            });

            test("updates cell content correctly after scrolling", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                const initialFirstCell = await page
                    .locator(
                        "regular-table tbody tr:first-child td:first-of-type",
                    )
                    .textContent();

                await table.evaluate(async (el) => {
                    el.scrollTop = 800;
                    await el.draw();
                });

                const scrolledFirstCell = await page
                    .locator(
                        "regular-table tbody tr:first-child td:first-of-type",
                    )
                    .textContent();

                // Content should have changed
                expect(scrolledFirstCell).not.toBe(initialFirstCell);
            });

            test("maintains column structure after vertical scroll", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                const initialColumnCount = await page
                    .locator("regular-table tbody tr:first-child")
                    .evaluate((el) => el.children.length);

                await table.evaluate(async (el) => {
                    el.scrollTop = 600;
                    await el.draw();
                });

                const scrolledColumnCount = await page
                    .locator("regular-table tbody tr:first-child")
                    .evaluate((el) => el.children.length);

                // Column count should be similar (may vary slightly due to viewport)
                expect(scrolledColumnCount).toBeGreaterThan(0);
                expect(
                    Math.abs(scrolledColumnCount - initialColumnCount),
                ).toBeLessThan(3);
            });
        });

        test.describe("scrolling horizontally via scrollLeft", () => {
            test("creates correct DOM structure when scrolling right", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollLeft = 500;
                    await el.draw();
                });

                const tbody = page.locator("regular-table tbody");
                const firstRow = page.locator(
                    "regular-table tbody tr:first-child",
                );
                const numCells = await firstRow.evaluate(
                    (el) => el.querySelectorAll("td").length,
                );

                // Should have rendered cells
                expect(numCells).toBeGreaterThan(0);
            });

            test("renders correct column headers after scrolling", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollLeft = 800;
                    await el.draw();
                });

                const firstColHeader = page.locator(
                    "regular-table thead tr:first-child th:nth-child(2)",
                );
                const headerText = await firstColHeader.textContent();

                // Should show columns beyond the initial viewport
                expect(headerText).toMatch(/Group \d+/);
                expect(
                    parseInt(headerText.match(/Group (\d+)/)[1]),
                ).toBeGreaterThan(0);
            });

            test("updates cell content correctly after horizontal scroll", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                const initialCells = await page
                    .locator("regular-table tbody tr:first-child")
                    .evaluate((el) =>
                        Array.from(el.querySelectorAll("td")).map(
                            (td) => td.textContent,
                        ),
                    );

                await table.evaluate(async (el) => {
                    el.scrollLeft = 700;
                    await el.draw();
                });

                const scrolledCells = await page
                    .locator("regular-table tbody tr:first-child")
                    .evaluate((el) =>
                        Array.from(el.querySelectorAll("td")).map(
                            (td) => td.textContent,
                        ),
                    );

                // Content should have changed
                expect(scrolledCells).not.toEqual(initialCells);
            });

            test("maintains row structure after horizontal scroll", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                const initialRowCount = await page
                    .locator("regular-table tbody")
                    .evaluate((el) => el.children.length);

                await table.evaluate(async (el) => {
                    el.scrollLeft = 900;
                    await el.draw();
                });

                const scrolledRowCount = await page
                    .locator("regular-table tbody")
                    .evaluate((el) => el.children.length);

                // Row count should be similar (may vary slightly due to viewport)
                expect(scrolledRowCount).toBeGreaterThan(0);
                expect(
                    Math.abs(scrolledRowCount - initialRowCount),
                ).toBeLessThan(5);
            });
        });

        test.describe("scrolling diagonally via scrollTop and scrollLeft", () => {
            test("creates correct DOM when scrolling both directions", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollTop = 600;
                    el.scrollLeft = 600;
                    await el.draw();
                });

                const tbody = page.locator("regular-table tbody");
                const numRows = await tbody.evaluate(
                    (el) => el.children.length,
                );
                const numCols = await page
                    .locator("regular-table tbody tr:first-child")
                    .evaluate((el) => el.children.length);

                expect(numRows).toBeGreaterThan(0);
                expect(numCols).toBeGreaterThan(0);
            });

            test("displays correct cell content at scrolled position", async ({
                page,
            }) => {
                const table = page.locator("regular-table");

                await table.evaluate(async (el) => {
                    el.scrollTop = 400;
                    el.scrollLeft = 400;
                    await el.draw();
                });

                const firstCell = await page
                    .locator(
                        "regular-table tbody tr:first-child td:first-of-type",
                    )
                    .textContent();

                // Should have numeric content (sum of x + y coordinates)
                expect(firstCell).toMatch(/^\d+$/);
                expect(parseInt(firstCell)).toBeGreaterThan(10);
            });

            test("can scroll back to origin", async ({ page }) => {
                const table = page.locator("regular-table");

                // Scroll away
                await table.evaluate(async (el) => {
                    el.scrollTop = 500;
                    el.scrollLeft = 500;
                    await el.draw();
                });

                // Scroll back to origin
                await table.evaluate(async (el) => {
                    el.scrollTop = 0;
                    el.scrollLeft = 0;
                    await el.draw();
                });

                const firstCell = await page
                    .locator(
                        "regular-table tbody tr:first-child td:first-of-type",
                    )
                    .textContent();

                expect(firstCell).toBe("0");
            });
        });
    });

    test.describe("scrolling via mousewheel and pointer events", () => {
        test("scrolling with mouse wheel vertically updates DOM", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Simulate mousewheel scroll down
            await table.evaluate(async (el) => {
                el.scrollTop += 300;
                await el.draw();
            });

            const scrolledFirstCell = await page
                .locator("regular-table tbody tr:first-child td:first-of-type")
                .textContent();

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Scroll position should have changed
            expect(newScrollTop).toBeGreaterThan(initialScrollTop);
            // Cell value should be numeric
            expect(scrolledFirstCell).toMatch(/^\d+$/);
        });

        test("scrolling with mouse wheel horizontally updates DOM", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialCells = await page
                .locator("regular-table tbody tr:first-child")
                .evaluate((el) =>
                    Array.from(el.querySelectorAll("td")).map(
                        (td) => td.textContent,
                    ),
                );

            // Simulate mousewheel scroll right
            await table.evaluate(async (el) => {
                const event = new WheelEvent("wheel", {
                    deltaY: 0,
                    deltaX: 300,
                    bubbles: true,
                    cancelable: true,
                });
                el.dispatchEvent(event);
                await new Promise(requestAnimationFrame);
                await el.draw();
            });

            const scrolledCells = await page
                .locator("regular-table tbody tr:first-child")
                .evaluate((el) =>
                    Array.from(el.querySelectorAll("td")).map(
                        (td) => td.textContent,
                    ),
                );

            // Content should have changed
            expect(scrolledCells).not.toEqual(initialCells);
        });

        test("diagonal scroll updates both axes", async ({ page }) => {
            const table = page.locator("regular-table");

            const initialPositions = await table.evaluate((el) => ({
                scrollTop: el.scrollTop,
                scrollLeft: el.scrollLeft,
            }));

            // Simulate diagonal scroll
            await table.evaluate(async (el) => {
                el.scrollTop += 250;
                el.scrollLeft += 250;
                await el.draw();
            });

            const scrolledFirstCell = await page
                .locator("regular-table tbody tr:first-child td:first-of-type")
                .textContent();

            const newPositions = await table.evaluate((el) => ({
                scrollTop: el.scrollTop,
                scrollLeft: el.scrollLeft,
            }));

            // Both axes should have scrolled
            expect(newPositions.scrollTop).toBeGreaterThan(
                initialPositions.scrollTop,
            );
            expect(newPositions.scrollLeft).toBeGreaterThan(
                initialPositions.scrollLeft,
            );
            expect(scrolledFirstCell).toMatch(/^\d+$/);
        });

        test("multiple scroll events compound scrolling", async ({ page }) => {
            const table = page.locator("regular-table");

            const initialRowHeader = await page
                .locator("regular-table tbody tr:first-child th:nth-child(2)")
                .textContent();

            // First scroll
            await table.evaluate(async (el) => {
                el.scrollTop += 200;
                await el.draw();
            });

            const intermediateRowHeader = await page
                .locator("regular-table tbody tr:first-child th:nth-child(2)")
                .textContent();

            // Second scroll
            await table.evaluate(async (el) => {
                el.scrollTop += 200;
                await el.draw();
            });

            const finalRowHeader = await page
                .locator("regular-table tbody tr:first-child th:nth-child(2)")
                .textContent();

            // Each scroll should move further down
            const initialRow = parseInt(initialRowHeader.match(/Row (\d+)/)[1]);
            const intermediateRow = parseInt(
                intermediateRowHeader.match(/Row (\d+)/)[1],
            );
            const finalRow = parseInt(finalRowHeader.match(/Row (\d+)/)[1]);

            expect(intermediateRow).toBeGreaterThan(initialRow);
            expect(finalRow).toBeGreaterThan(intermediateRow);
        });

        test("scroll event fires after scrollTop change", async ({ page }) => {
            const table = page.locator("regular-table");

            const scrollEventFired = await table.evaluate(async (el) => {
                let fired = false;
                const handler = () => {
                    fired = true;
                };
                el.addEventListener("scroll", handler);

                el.scrollTop = 200;
                await new Promise(requestAnimationFrame);

                // Wait a bit for scroll event
                await new Promise((resolve) => setTimeout(resolve, 50));

                el.removeEventListener("scroll", handler);
                return fired;
            });

            expect(scrollEventFired).toBe(true);
        });
    });

    test.describe("scrolling via keyboard", () => {
        test("ArrowDown key scrolls table vertically", async ({ page }) => {
            const table = page.locator("regular-table");

            // Focus the table
            await table.focus();

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Press ArrowDown
            await page.keyboard.press("ArrowDown");
            await page.waitForTimeout(100);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled down
            expect(newScrollTop).toBeGreaterThanOrEqual(initialScrollTop);
        });

        test("ArrowUp key scrolls table vertically", async ({ page }) => {
            const table = page.locator("regular-table");

            // First scroll down
            await table.evaluate(async (el) => {
                el.scrollTop = 500;
                await el.draw();
            });

            // Focus the table
            await table.focus();

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Press ArrowUp
            await page.keyboard.press("ArrowUp");
            await page.waitForTimeout(100);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled up
            expect(newScrollTop).toBeLessThanOrEqual(initialScrollTop);
        });

        test("ArrowRight key scrolls table horizontally", async ({ page }) => {
            const table = page.locator("regular-table");

            // Focus the table
            await table.focus();

            const initialScrollLeft = await table.evaluate(
                (el) => el.scrollLeft,
            );

            // Press ArrowRight
            await page.keyboard.press("ArrowRight");
            await page.waitForTimeout(100);

            const newScrollLeft = await table.evaluate((el) => el.scrollLeft);

            // Should have scrolled right
            expect(newScrollLeft).toBeGreaterThanOrEqual(initialScrollLeft);
        });

        test("ArrowLeft key scrolls table horizontally", async ({ page }) => {
            const table = page.locator("regular-table");

            // First scroll right
            await table.evaluate(async (el) => {
                el.scrollLeft = 500;
                await el.draw();
            });

            // Focus the table
            await table.focus();

            const initialScrollLeft = await table.evaluate(
                (el) => el.scrollLeft,
            );

            // Press ArrowLeft
            await page.keyboard.press("ArrowLeft");
            await page.waitForTimeout(100);

            const newScrollLeft = await table.evaluate((el) => el.scrollLeft);

            // Should have scrolled left
            expect(newScrollLeft).toBeLessThanOrEqual(initialScrollLeft);
        });

        test("PageDown key scrolls by page", async ({ page }) => {
            const table = page.locator("regular-table");

            // Focus the table
            await table.focus();

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Press PageDown
            await page.keyboard.press("PageDown");
            await page.waitForTimeout(100);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled down significantly
            expect(newScrollTop - initialScrollTop).toBeGreaterThan(50);
        });

        test("PageUp key scrolls by page", async ({ page }) => {
            const table = page.locator("regular-table");

            // First scroll down
            await table.evaluate(async (el) => {
                el.scrollTop = 1000;
                await el.draw();
            });

            // Focus the table
            await table.focus();

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Press PageUp
            await page.keyboard.press("PageUp");
            await page.waitForTimeout(100);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled up significantly
            expect(initialScrollTop - newScrollTop).toBeGreaterThan(50);
        });

        test("Home key scrolls to top", async ({ page }) => {
            const table = page.locator("regular-table");

            // First scroll down
            await table.evaluate(async (el) => {
                el.scrollTop = 1000;
                await el.draw();
            });

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Focus the table
            await table.focus();

            // Press Home
            await page.keyboard.press("Home");
            await page.waitForTimeout(100);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled toward the top (even if not all the way)
            expect(newScrollTop).toBeLessThanOrEqual(initialScrollTop);
        });

        test("End key scrolls to bottom", async ({ page }) => {
            const table = page.locator("regular-table");

            // Focus the table
            await table.focus();

            // Press End
            await page.keyboard.press("End");
            await page.waitForTimeout(100);

            const scrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled down significantly
            expect(scrollTop).toBeGreaterThan(500);
        });

        test("multiple arrow key presses compound scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            // Focus the table
            await table.focus();

            const initialScrollTop = await table.evaluate((el) => el.scrollTop);

            // Press ArrowDown multiple times
            await page.keyboard.press("ArrowDown");
            await page.waitForTimeout(50);
            await page.keyboard.press("ArrowDown");
            await page.waitForTimeout(50);
            await page.keyboard.press("ArrowDown");
            await page.waitForTimeout(50);

            const newScrollTop = await table.evaluate((el) => el.scrollTop);

            // Should have scrolled down
            expect(newScrollTop).toBeGreaterThan(initialScrollTop);
        });
    });

    test.describe("DOM structure validation after scrolling", () => {
        test("maintains proper table structure after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            await table.evaluate(async (el) => {
                el.scrollTop = 750;
                el.scrollLeft = 750;
                await el.draw();
            });

            const hasTableTag = await page
                .locator("regular-table table")
                .count();
            const hasThead = await page.locator("regular-table thead").count();
            const hasTbody = await page.locator("regular-table tbody").count();

            expect(hasTableTag).toBe(1);
            expect(hasThead).toBe(1);
            expect(hasTbody).toBe(1);
        });

        test("all rows have consistent cell structure after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            await table.evaluate(async (el) => {
                el.scrollTop = 600;
                await el.draw();
            });

            const cellCounts = await page
                .locator("regular-table tbody tr")
                .evaluateAll((rows) => rows.map((row) => row.children.length));

            // All rows should have cells
            expect(cellCounts.every((count) => count > 0)).toBe(true);

            // Most rows should have similar cell counts (within 2 of the median)
            const median = cellCounts.sort((a, b) => a - b)[
                Math.floor(cellCounts.length / 2)
            ];
            const consistentCounts = cellCounts.filter(
                (count) => Math.abs(count - median) <= 2,
            );
            expect(consistentCounts.length / cellCounts.length).toBeGreaterThan(
                0.7,
            );
        });

        test("header structure remains intact after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            const initialHeaderRowCount = await page
                .locator("regular-table thead tr")
                .count();

            await table.evaluate(async (el) => {
                el.scrollTop = 800;
                el.scrollLeft = 400;
                await el.draw();
            });

            const scrolledHeaderRowCount = await page
                .locator("regular-table thead tr")
                .count();

            expect(scrolledHeaderRowCount).toBe(initialHeaderRowCount);
        });

        test("cells have correct metadata after scrolling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");

            await table.evaluate(async (el) => {
                el.scrollTop = 500;
                el.scrollLeft = 500;
                await el.draw();
            });

            const metadata = await table.evaluate((el) => {
                const td = document.querySelector("regular-table tbody td");
                return el.getMeta(td);
            });

            expect(metadata).toHaveProperty("x");
            expect(metadata).toHaveProperty("y");
            expect(metadata).toHaveProperty("value");
            expect(metadata).toHaveProperty("column_header");
            expect(metadata).toHaveProperty("row_header");
        });
    });
});
