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
    beforeAll(async () => {
        await page.setViewport({width: 150, height: 150});
    });

    describe("Navigating with the arrow keys", () => {
        const sayHello = async (table) => {
            await page.evaluate(async (table) => {
                const target = document.activeElement;
                target.textContent = "Hello, World!";
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keypress", false, true);
                event.ctrlKey = true;
                event.keyCode = 13;
                table.dispatchEvent(event);
            }, table);
        };

        const keypressReturn = async (table, times = 1) => {
            Array.from(Array(times)).forEach(async () => {
                await page.evaluate(async (table) => {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keypress", false, true);
                    event.ctrlKey = true;
                    event.keyCode = 13;
                    table.dispatchEvent(event);
                }, table);
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

        beforeEach(async () => {
            await page.goto("http://localhost:8081/dist/examples/keyboard_navigation.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("initializes with focus on (0,0)", async () => {
            const table = await page.$("regular-table");
            await sayHello(table);
            const tr = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cell_values = [];
            for (const td of tr) {
                cell_values.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cell_values).toEqual(["Hello, World!", "", "", "", "", ""]);
        });

        xtest("scrolls as right arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownRightArrow(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["", "", "", "", "", "Hello, World!"]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const th_value = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th_value).toEqual("0");
        });

        xtest("scrolls as down arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownDownArrow(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(3) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("5");
        });

        xtest("scrolls down and back up", async () => {
            const table = await page.$("regular-table");
            keydownDownArrow(table, 5);
            keydownUpArrow(table, 2);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(3) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("3");
        });

        xtest("scrolls right and back left", async () => {
            const table = await page.$("regular-table");
            keydownRightArrow(table, 10);
            keydownLeftArrow(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["", "", "", "", "", "Hello, World!"]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("0");
        });

        xtest("scrolls as return is pressed", async () => {
            const table = await page.$("regular-table");
            keypressReturn(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(3) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("5");
        });
    });
});
