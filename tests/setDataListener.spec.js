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

test.describe("setDataListener()", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("basic functionality", () => {
        test("sets a data listener and draws the table", async ({ page }) => {
            const table = page.locator("regular-table");
            const hasCells = await table.evaluate(async (el) => {
                return document.querySelectorAll("td").length > 0;
            });
            expect(hasCells).toBe(true);
        });

        test("renders correct initial data", async ({ page }) => {
            const table = page.locator("regular-table");
            const firstCell = page.locator(
                "regular-table tbody tr:first-child td:first-of-type",
            );
            const cellText = await firstCell.textContent();
            expect(cellText).toBe("0");
        });

        test("renders correct row headers", async ({ page }) => {
            const firstRowHeader = page.locator(
                "regular-table tbody tr:first-child th:first-child",
            );
            const headerText = await firstRowHeader.textContent();
            expect(headerText).toBe("Group 0");
        });

        test("renders correct column headers", async ({ page }) => {
            const firstColHeader = page.locator(
                "regular-table thead tr:first-child th:nth-child(2)",
            );
            const headerText = await firstColHeader.textContent();
            expect(headerText).toBe("Group 0");
        });
    });

    test.describe("data listener callback", () => {
        test("receives correct viewport coordinates", async ({ page }) => {
            const table = page.locator("regular-table");
            const callbackArgs = await table.evaluate(async (el) => {
                let capturedArgs = null;
                const testListener = (x0, y0, x1, y1) => {
                    capturedArgs = { x0, y0, x1, y1 };
                    return {
                        num_rows: 100,
                        num_columns: 100,
                        row_headers: [],
                        column_headers: [],
                        data: [],
                    };
                };

                el.setDataListener(testListener);
                await el.draw();
                return capturedArgs;
            });

            expect(callbackArgs).toBeTruthy();
            expect(callbackArgs.x0).toBe(22);
            expect(callbackArgs.y0).toBe(0);
            expect(callbackArgs.x1).toBeGreaterThan(0);
            expect(callbackArgs.y1).toBeGreaterThan(0);
        });

        test("updates when table is scrolled", async ({ page }) => {
            const table = page.locator("regular-table");
            const scrollResults = await table.evaluate(async (el) => {
                let callCount = 0;
                const testListener = (x0, y0, x1, y1) => {
                    callCount++;
                    return {
                        num_rows: 1000,
                        num_columns: 1000,
                        row_headers: Array.from({ length: y1 - y0 }, (_, i) => [
                            `Group ${Math.floor((i + y0) / 10) * 10}`,
                            `Row ${i + y0}`,
                        ]),
                        column_headers: Array.from(
                            { length: x1 - x0 },
                            (_, i) => [
                                `Group ${Math.floor((i + x0) / 10) * 10}`,
                                `Column ${i + x0}`,
                            ],
                        ),
                        data: Array.from({ length: x1 - x0 }, () =>
                            Array.from({ length: y1 - y0 }, () => "data"),
                        ),
                    };
                };

                el.setDataListener(testListener);
                await el.draw();
                const initialCallCount = callCount;

                el.scrollTop = 500;
                await el.draw();
                const afterScrollCallCount = callCount;

                return {
                    initialCallCount,
                    afterScrollCallCount,
                    scrollChanged: afterScrollCallCount > initialCallCount,
                };
            });

            expect(scrollResults.scrollChanged).toBe(true);
        });
    });

    test.describe("replacing data listener", () => {
        test("can replace existing data listener", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                const listener1 = () => ({
                    num_rows: 10,
                    num_columns: 10,
                    row_headers: [["Original"]],
                    column_headers: [["Original"]],
                    data: [["original"]],
                });

                const listener2 = () => ({
                    num_rows: 10,
                    num_columns: 10,
                    row_headers: [["Replaced"]],
                    column_headers: [["Replaced"]],
                    data: [["replaced"]],
                });

                el.setDataListener(listener1);
                await el.draw();
                const firstCell = document.querySelector("td").textContent;

                el.setDataListener(listener2);
                await el.draw();
                const secondCell = document.querySelector("td").textContent;

                return { firstCell, secondCell };
            });

            expect(result.firstCell).toBe("original");
            expect(result.secondCell).toBe("replaced");
        });
    });
});
