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

test.describe("getMeta()", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 200, height: 200 });
        await page.goto("/tests/2_row_2_column_headers.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("returns the correct metadata", () => {
        test("for {x: 0, y: 0}", async ({ page }) => {
            const table = page.locator("regular-table");
            const meta = await table.evaluate((el) => {
                return JSON.stringify(el.getMeta(document.querySelector("td")));
            });

            expect(JSON.parse(meta)).toEqual({
                column_header: ["Group 0", "Column 0"],
                row_header: ["Group 0", "Row 0"],
                dx: 0,
                dy: 0,
                size_key: 2,
                virtual_x: 2,
                value: "0",
                x: 0,
                x0: 0,
                x1: 5,
                y: 0,
                y0: 0,
                y1: 10,
            });
        });

        test("for {row_header_x: 0, y: 0}", async ({ page }) => {
            const table = page.locator("regular-table");
            const meta = await table.evaluate((el) => {
                return JSON.stringify(
                    el.getMeta(document.querySelector("tbody th")),
                );
            });
            expect(JSON.parse(meta)).toEqual({
                row_header: ["Group 0", "Row 0"],
                size_key: 0,
                virtual_x: 0,
                value: "Group 0",
                row_header_x: 0,
                y: 0,
                y0: 0,
                y1: 10,
            });
        });

        test("for {x: 0, column_header_y: 0}", async ({ page }) => {
            const table = page.locator("regular-table");
            const meta = await table.evaluate((el) => {
                return JSON.stringify(
                    el.getMeta(document.querySelector("thead th:nth-child(2)")),
                );
            });
            expect(JSON.parse(meta)).toEqual({
                column_header: ["Group 0", "Column 0"],
                size_key: 3,
                virtual_x: 2,
                value: "Group 0",
                column_header_y: 0,
                x: 0,
                x0: 0,
            });
        });

        test.describe("with the viewport scrolled to the right", () => {
            test.beforeEach(async ({ page }) => {
                const table = page.locator("regular-table");
                await table.evaluate(async (el) => {
                    el.scrollLeft = 1000;
                    await el.draw();
                });
            });

            test("for {x: 0, y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(document.querySelector("td")),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 10", "Column 16"],
                    row_header: ["Group 0", "Row 0"],
                    dx: 0,
                    dy: 0,
                    size_key: 18,
                    virtual_x: 2,
                    value: "16",
                    x: 16,
                    x0: 16,
                    x1: 22,
                    y: 0,
                    y0: 0,
                    y1: 8,
                });
            });

            test("for {row_header_x: 0, y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(document.querySelector("tbody th")),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    row_header: ["Group 0", "Row 0"],
                    size_key: 0,
                    virtual_x: 0,
                    value: "Group 0",
                    row_header_x: 0,
                    y: 0,
                    y0: 0,
                    y1: 8,
                });
            });

            test.skip("for {x: 0, column_header_y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(
                            document.querySelector("thead th:nth-child(2)"),
                        ),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 10", "Column 16"],
                    size_key: 19,
                    virtual_x: 2,
                    value: "Group 10",
                    column_header_y: 0,
                    x: 16,
                    x0: 16,
                });
            });
        });

        test.describe("with the viewport scrolled down", () => {
            test.beforeEach(async ({ page }) => {
                const table = page.locator("regular-table");
                await table.evaluate(async (el) => {
                    el.scrollLeft = 0;
                    el.scrollTop = 1000;
                    await el.flush();
                });
            });

            test.skip("for {x: 0, y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(document.querySelector("td")),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 0", "Column 0"],
                    row_header: ["Group 30", "Row 39"],
                    dx: 0,
                    dy: 0,
                    size_key: 2,
                    virtual_x: 2,
                    value: "39",
                    x: 0,
                    x0: 0,
                    x1: 5,
                    y: 39,
                    y0: 39,
                    y1: 48,
                });
            });

            test("for {row_header_x: 0, y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(document.querySelector("tbody th")),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    row_header: ["Group 50", "Row 52"],
                    size_key: 0,
                    virtual_x: 0,
                    value: "Group 50",
                    row_header_x: 0,
                    y: 52,
                    y0: 52,
                    y1: 61,
                });
            });

            test("for {x: 0, column_header_y: 0}", async ({ page }) => {
                const table = page.locator("regular-table");
                const meta = await table.evaluate((el) => {
                    return JSON.stringify(
                        el.getMeta(
                            document.querySelector("thead th:nth-child(2)"),
                        ),
                    );
                });
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 0", "Column 0"],
                    size_key: 4,
                    virtual_x: 2,
                    value: "Group 0",
                    column_header_y: 0,
                    x: 0,
                    x0: 0,
                });
            });
        });
    });
});
