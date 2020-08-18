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
    const keydownRightArrow = async (table, times = 1, shiftKey = false) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(
                async (table, shiftKey) => {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keydown", false, true);
                    event.keyCode = 39;
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

    const keydownDownArrow = async (table, times = 1, shiftKey = false) => {
        Array.from(Array(times)).forEach(async () => {
            await page.evaluate(
                async (table, shiftKey) => {
                    const event = document.createEvent("HTMLEvents");
                    event.initEvent("keydown", false, true);
                    event.keyCode = 40;
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

    let table;

    beforeAll(async () => {
        await page.goto("http://localhost:8081/dist/examples/keyboard_navigation.html");
        await page.setViewport({width: 150, height: 150});
        await page.waitFor("regular-table table tbody tr td");
        table = await page.$("regular-table");
    });

    describe("Selecting an area with the keyboard", () => {
        test("adds an area selection", async () => {
            await keydownRightArrow(table, 2, true);
            await keydownDownArrow(table, 2, true);

            const tds = await page.$$("regular-table tbody tr td.keyboard-selected-area");
            expect(tds.length).toEqual(9);
        });
    });
});
