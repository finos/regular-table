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

test.describe("`rt-col-{size_key}` column class contract", () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 400 });
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test("body cells are not annotated by default", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const table = document.querySelector("regular-table");
            await table.draw();
            let tagged = 0;
            for (const td of table.querySelectorAll("tbody td")) {
                if (
                    Array.from(td.classList).some((c) =>
                        c.startsWith("rt-col-"),
                    )
                ) {
                    tagged++;
                }
            }

            return tagged;
        });

        expect(result).toBe(0);
    });

    test("column_classes is applied correctly", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const table = document.querySelector("regular-table");
            table.setDataListener(window.dataListener, {
                column_classes: true,
            });
            await table.draw();
            let checked = 0;
            const missing = [];
            for (const cell of table.querySelectorAll(
                "tbody td, tbody th, thead tr:last-child th",
            )) {
                const meta = table.getMeta(cell);
                if (meta?.size_key === undefined) {
                    continue;
                }

                checked++;
                if (!cell.classList.contains(`rt-col-${meta.size_key}`)) {
                    missing.push(cell.outerHTML.slice(0, 60));
                }
            }

            return { checked, missing };
        });

        expect(result.checked).toBeGreaterThan(50);
        expect(result.missing).toEqual([]);
    });

    test("horizontal scroll respects column_classes", async ({ page }) => {
        const result = await page.evaluate(async () => {
            const table = document.querySelector("regular-table");
            table.setDataListener(window.dataListener, {
                column_classes: true,
            });
            table.scrollLeft = 500;
            await table.draw();
            const mismatched = [];
            for (const td of table.querySelectorAll("tbody td")) {
                const meta = table.getMeta(td);
                if (!td.classList.contains(`rt-col-${meta.size_key}`)) {
                    mismatched.push(meta.size_key);
                }
            }

            return mismatched;
        });

        expect(result).toEqual([]);
    });
});
