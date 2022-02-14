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
                await table.draw();
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
                    await table.draw();
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
                    await table.draw();
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
                    await table.draw();
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
                    await table.draw();
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
                    await table.draw();
                }, table);
            });
        };

        beforeEach(async () => {
            await page.goto("http://localhost:8081/dist/examples/spreadsheet.html");
            await page.waitForSelector("regular-table table tbody tr td");
        });

        test("initializes with focus on (0,0)", async () => {
            const table = await page.$("regular-table");
            await sayHello(table);
            const tr = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cell_values = [];
            for (const td of tr) {
                cell_values.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cell_values).toEqual(["Hello, World!", "", "", "", "", "", ""]);
        });

        test("scrolls as right arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownRightArrow(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells.slice(cells.length - 5)).toEqual(["", "", "", "", "Hello, World!"]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const th_value = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th_value).toEqual("0");
        });

        test("scrolls as down arrow is down", async () => {
            const table = await page.$("regular-table");
            keydownDownArrow(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(4) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", "", "", "", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(4) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("6");
        });

        test("scrolls down and back up", async () => {
            const table = await page.$("regular-table");
            keydownDownArrow(table, 5);
            keydownUpArrow(table, 2);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", "", "", "", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(3) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("3");
        });

        test("scrolls right and back left", async () => {
            const table = await page.$("regular-table");
            keydownRightArrow(table, 10);
            keydownLeftArrow(table, 7);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["", "", "", "Hello, World!"]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("0");
        });

        test("scrolls as return is pressed", async () => {
            const table = await page.$("regular-table");
            keypressReturn(table, 5);
            await sayHello(table);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(4) td");
            const cells = [];
            for (const td of tds) {
                cells.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cells).toEqual(["Hello, World!", "", "", "", "", "", ""]);

            const ths = await page.$$("regular-table tbody tr:nth-of-type(4) th");
            const th = await page.evaluate((th) => th.innerHTML, ths[0]);
            expect(th).toEqual("6");
        });
    });

    describe("Makes a simple edit", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/dist/examples/spreadsheet.html");
            await page.waitForSelector("regular-table table tbody tr td");
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

        test("displays edited input", async () => {
            const tr = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cell_values = [];
            for (const td of tr) {
                cell_values.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(cell_values).toEqual(["Hello, World!", "", "", "", "", "", ""]);
        });

        test("next cell has focus", async () => {
            const contents = await page.evaluate(() => document.activeElement.textContent);
            expect(contents).toEqual("");
        });

        describe("on scroll", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = table.scrollTop + 30;
                    await table.draw();
                }, table);
            });

            test("preserves input", async () => {
                const tr = await page.$$("regular-table tbody tr:nth-of-type(2) td");
                const cell_values = [];
                for (const td of tr) {
                    cell_values.push(await page.evaluate((td) => td.innerHTML, td));
                }
                expect(cell_values).toEqual(["Hello, World!", "", "", "", "", "", ""]);
            });
        });
    });

    describe("Evaluates an expression", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/dist/examples/spreadsheet.html");
            await page.waitForSelector("regular-table table tbody tr td");
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
            const tr2 = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const tds2 = [];
            for (const td of tr2) {
                tds2.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(tds2).toEqual(["1", "", "", ""]);
            const tr3 = await page.$$("regular-table tbody tr:nth-of-type(4) td");
            const tds3 = [];
            for (const td of tr3) {
                tds3.push(await page.evaluate((td) => td.innerHTML, td));
            }
            expect(tds3).toEqual(["2", "3", "", ""]);
        });

        describe("on scroll", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTop = table.scrollTop + 25;
                    await table.draw();
                }, table);
            });

            test("preserves evaluated expression", async () => {
                const tr1 = await page.$$("regular-table tbody tr:nth-of-type(2) td");
                const tds1 = [];
                for (const td of tr1) {
                    tds1.push(await page.evaluate((td) => td.innerHTML, td));
                }
                expect(tds1).toEqual(["1", "", "", ""]);
                const tr2 = await page.$$("regular-table tbody tr:nth-of-type(3) td");
                const tds2 = [];
                for (const td of tr2) {
                    tds2.push(await page.evaluate((td) => td.innerHTML, td));
                }
                expect(tds2).toEqual(["2", "3", "", ""]);
            });
        });
    });
});
