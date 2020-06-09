/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("spreadsheet.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 100, height: 100});
    });

    describe("Makes a simple edit", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/spreadsheet.html");
            await page.waitFor("regular-table table tbody tr td");
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                const cell = table.querySelector("table tbody").children[2].children[1];
                cell.textContent = "Hello, World!";
                cell.focus();
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keypress", false, true);
                event.ctrlKey = true;
                event.keyCode = 13;
                table.dispatchEvent(event);
            }, table);
        });

        test("displays input", async () => {
            const first_tr = await page.$$("regular-table tbody td");
            const cell_values = [];
            for (const tr of first_tr) {
                cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
            }
            expect(cell_values).toEqual(["", "", "Hello, World!", "", ""]);
        });

        test("next cell has focus", async () => {
            const contents = await page.evaluate(() => document.activeElement.textContent);
            expect(contents).toEqual("");
        });

        describe("on scroll", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = table.scrollTop + 20;
                    await table.draw();
                }, table);
            });

            test("preserves input", async () => {
                const first_tr = await page.$$("regular-table tbody td");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["", "Hello, World!", "", "", ""]);
            });
        });
    });

    describe("Evaluates an expression", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/spreadsheet.html");
            await page.waitFor("regular-table table tbody tr td");
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                for (const [x, y, v] of [
                    [2, 1, "1"],
                    [3, 1, "2"],
                    [3, 2, "=sum(A0..A3)"],
                ]) {
                    const cell = table.querySelector("table tbody").children[x].children[y];
                    cell.textContent = v;
                    cell.focus();
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keypress", false, true);
                    event.ctrlKey = true;
                    event.keyCode = 13;
                    table.dispatchEvent(event);
                }
            }, table);
        });

        test("displays evaluated expression", async () => {
            const first_tr = await page.$$("regular-table tbody td");
            const cell_values = [];
            for (const tr of first_tr) {
                cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
            }
            expect(cell_values).toEqual(["", "", "", "", "", "", "", "", "1", "", "", "", "2", "3", "", "", "", "", "", ""]);
        });

        describe("on scroll", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = table.scrollTop + 20;
                    await table.draw();
                }, table);
            });

            test("preserves evaluated expression", async () => {
                const first_tr = await page.$$("regular-table tbody td");
                const cell_values = [];
                for (const tr of first_tr) {
                    cell_values.push(await page.evaluate((tr) => tr.innerHTML, tr));
                }
                expect(cell_values).toEqual(["", "", "", "", "1", "", "", "", "2", "3", "", "", "", "", "", "", "", "", "", ""]);
            });
        });
    });
});
