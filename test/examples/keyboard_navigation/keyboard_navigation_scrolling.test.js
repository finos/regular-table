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

    let table;

    beforeAll(async () => {
        await page.setViewport({width: 150, height: 150});
        await page.goto("http://localhost:8081/dist/examples/keyboard_navigation.html");
        await page.waitFor("regular-table table tbody tr td");
        table = await page.$("regular-table");
    });

    describe("Scrolling with the arrow keys", () => {
        test("scrolls as right arrow is down", async () => {
            const text = "1. scrolling right";

            keydownRightArrow(table, 5);
            await writeByReturn(table, text);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");

            const rowThs = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const rowHeaderValue = await page.evaluate((th) => th.innerHTML, rowThs[0]);
            expect(rowHeaderValue).toEqual("0");

            const colThs = await page.$$("regular-table thead th");
            const colThValues = [];
            for (const td of colThs) {
                colThValues.push(await page.evaluate((td) => td.textContent.trim(), td));
            }
            expect(colThValues).toEqual(["", "C", "D", "E", "F"]);

            const cellValue = await page.evaluate((td) => td.innerHTML, tds[tds.length - 1]);
            expect(cellValue).toEqual(text);
        });

        xtest("scrolls as down arrow is down", async () => {
            const text = "2. scrolling down";

            keydownDownArrow(table, 5);
            await writeByReturn(table, text);

            const rowThs = await page.$$("regular-table tbody tr:nth-of-type(1) th");
            const rowHeaderValue = await page.evaluate((th) => th.innerHTML, rowThs[0]);
            expect(rowHeaderValue).toEqual("4");

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[tds.length - 1]);

            expect(cellValue).toEqual(text);
        });

        xtest("scrolls as left arrow is down", async () => {
            const text = "3. scrolling left";

            keydownLeftArrow(table, 5);
            await writeByReturn(table, text);

            const colThs = await page.$$("regular-table thead th");

            const colThValues = [];
            for (const td of colThs) {
                colThValues.push(await page.evaluate((td) => td.textContent.trim(), td));
            }
            expect(colThValues).toEqual(["", "A", "B"]);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(3) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[0]);

            expect(cellValue).toEqual(text);
        });

        xtest("scrolls as up arrow is down", async () => {
            const text = "4. scrolling up";

            keydownUpArrow(table, 10);
            await writeByReturn(table, text);

            const colThs = await page.$$("regular-table thead th");

            const colThValues = [];
            for (const td of colThs) {
                colThValues.push(await page.evaluate((td) => td.textContent.trim(), td));
            }
            expect(colThValues).toEqual(["", "A", "B"]);

            const tds = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const cellValue = await page.evaluate((td) => td.innerHTML, tds[0]);

            expect(cellValue).toEqual(text);
        });
    });
});
