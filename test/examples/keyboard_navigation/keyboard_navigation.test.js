/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("keyboard_navigation.html", () => {
    const writeByReturn = async (table, text) => {
        await page.evaluate(
            async (table, text) => {
                const target = document.activeElement;
                target.textContent = text;
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keypress", false, true);
                event.ctrlKey = true;
                event.keyCode = 13;
                table.dispatchEvent(event);
            },
            table,
            text
        );
    };

    const keypressReturn = async (table, times = 1, shiftKey) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(
                async (table, shiftKey) => {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keypress", false, true);
                    event.ctrlKey = true;
                    if (shiftKey) {
                        event.shiftKey = true;
                    }
                    event.keyCode = 13;
                    table.dispatchEvent(event);
                },
                table,
                shiftKey
            );
        });
    };

    const keydownTab = async (table, times = 1, shiftKey = false) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(
                async (table, shiftKey) => {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keydown", false, true);
                    event.keyCode = 9;
                    if (shiftKey) {
                        event.shiftKey = true;
                    }
                    table.dispatchEvent(event);
                },
                table,
                shiftKey
            );
        });
    };

    const keydownLeftArrow = async (table, times = 1) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(async (table) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.keyCode = 37;
                table.dispatchEvent(event);
            }, table);
        });
    };

    const keydownUpArrow = async (table, times = 1) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(async (table) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.keyCode = 38;
                table.dispatchEvent(event);
            }, table);
        });
    };

    const keydownRightArrow = async (table, times = 1) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(async (table) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.keyCode = 39;
                table.dispatchEvent(event);
            }, table);
        });
    };

    const keydownDownArrow = async (table, times = 1) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(async (table) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.keyCode = 40;
                table.dispatchEvent(event);
            }, table);
        });
    };

    beforeAll(async () => {
        await page.goto("http://localhost:8081/dist/examples/keyboard_navigation.html");
        await page.setViewport({width: 500, height: 500});
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("Navigating with the keyboard", () => {
        test("initializes with focus on (0,0)", async () => {
            const table = await page.$("regular-table");
            await writeByReturn(table, "1. test origin");
            const tr = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tr[0]);
            expect(cellValue).toEqual("1. test origin");
        });

        test("moves as right arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownRightArrow(table, 5);
            await writeByReturn(table, "2. right arrow");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(2) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[5]);
            expect(cellValue).toEqual("2. right arrow");

            const ths = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const thValue = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(thValue).toEqual("0");
        });

        test("moves as down arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownDownArrow(table, 5);
            await writeByReturn(table, "3. down arrow");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(8) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[5]);
            expect(cellValue).toEqual("3. down arrow");
        });

        test("moves as up arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownUpArrow(table, 5);
            await writeByReturn(table, "4. up arrow");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(4) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[5]);
            expect(cellValue).toEqual("4. up arrow");
        });

        test("moves as left arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownLeftArrow(table, 3);
            await writeByReturn(table, "5. left arrow");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(5) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[2]);
            expect(cellValue).toEqual("5. left arrow");
        });

        test("moves as return is pressed", async () => {
            const table = await page.$("regular-table");
            keypressReturn(table);
            await writeByReturn(table, "6. return");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(7) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[2]);
            expect(cellValue).toEqual("6. return");
        });

        test("moves as tab is down", async () => {
            const table = await page.$("regular-table");
            keydownTab(table);
            await writeByReturn(table, "7. tab");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(8) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[3]);
            expect(cellValue).toEqual("7. tab");
        });

        test("moves as shift tab is down", async () => {
            const table = await page.$("regular-table");
            keydownTab(table, 1, true);
            await writeByReturn(table, "8. shift tab");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(9) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[2]);
            expect(cellValue).toEqual("8. shift tab");
        });

        test("moves as shift return is pressed", async () => {
            const table = await page.$("regular-table");
            keypressReturn(table, 2, true);
            await writeByReturn(table, "9. shift return");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(8) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[2]);
            expect(cellValue).toEqual("9. shift return");
        });
    });
});
