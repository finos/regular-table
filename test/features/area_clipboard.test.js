/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("area_clipboard.html", () => {
    const cellValues = async (cssClass) => {
        const selectedCells = await page.$$(
            `regular-table tbody tr td.${cssClass}`
        );
        const values = [];
        for (const td of selectedCells) {
            values.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return values;
    };

    const positions = async (cssClass) => {
        const table = await page.$("regular-table");
        let metas = [];
        const selectedCells = await page.$$(`regular-table tbody tr td.${cssClass}`);
        for (const td of selectedCells) {
            metas.push(await page.evaluate((table, td) => table.getMeta(td), table, td));
        }
        return metas.map(({x, y}) => [x, y]);
    };

    const draw = async () => {
        const table = await page.$("regular-table");
        await page.evaluate(async (table) => {
            await table.draw();
        }, table);
    };

    const copy = async (multi = true) => {
        const table = await page.$("regular-table");
        await page.evaluate(
            async (table, multi) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.ctrlKey = multi;
                event.keyCode = 67;
                table.dispatchEvent(event);
            },
            table,
            multi
        );
    };

    const cut = async (multi = true) => {
        const table = await page.$("regular-table");
        await page.evaluate(
            async (table, multi) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.ctrlKey = multi;
                event.keyCode = 88;
                table.dispatchEvent(event);
            },
            table,
            multi
        );
    };

    const paste = async (multi = true) => {
        const table = await page.$("regular-table");
        await page.evaluate(
            async (table, multi) => {
                const event = document.createEvent("HTMLEvents");
                event.initEvent("keydown", false, true);
                event.ctrlKey = multi;
                event.keyCode = 86;
                table.dispatchEvent(event);
            },
            table,
            multi
        );
    };

    const makeSelection = async (el1, el2, multi = false) => {
        await page.evaluate(
            async (td, multi) => {
                const event = new MouseEvent("mousedown", {bubbles: true, ctrlKey: multi});
                td.dispatchEvent(event);
            },
            el1,
            multi
        );

        await page.evaluate(
            async (td, multi) => {
                const event = new MouseEvent("mouseup", {bubbles: true, ctrlKey: multi});
                td.dispatchEvent(event);
            },
            el2,
            multi
        );
    };

    beforeEach(async () => {
        await page.setViewport({width: 100, height: 100});
        // const context = await browser.defaultBrowserContext();
        // await context.overridePermissions("http://localhost:8081/dist/examples/area_clipboard.html", ["clipboard-write", "clipboard-read"]);
        await page.goto("http://localhost:8081/dist/features/area_clipboard.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("copy/paste", () => {
        test("copies one area", async () => {
            const col1Tds = await page.$$("regular-table tbody tr td:nth-of-type(1)");
            const col2Tds = await page.$$("regular-table tbody tr td:nth-of-type(2)");

            makeSelection(col1Tds[0], col2Tds[1]);
            await copy();

            const selectedCells = await cellValues("mouse-selected-area");
            expect(selectedCells).toEqual(["0, 0", "1, 0", "0, 1", "1, 1"]);

            makeSelection(col1Tds[2], col1Tds[2]);

            await paste();

            expect(await positions("clipboard-paste-selected-area")).toEqual([
                [0, 2],
                [1, 2],
                [0, 3],
                [1, 3],
            ]);

            expect(await cellValues("clipboard-paste-selected-area")).toEqual(["0, 0", "1, 0", "0, 1", "1, 1"]);
        });

        test("copies multi select areas to multiple targets", async () => {
            const col1Tds = await page.$$("regular-table tbody tr td:nth-of-type(1)");
            const col2Tds = await page.$$("regular-table tbody tr td:nth-of-type(2)");

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[0]);

            makeSelection(col2Tds[2], col2Tds[2], true);

            await copy();

            await draw();

            expect(await positions("clipboard-copy-selected-area")).toEqual([
                [0, 0],
                [1, 2],
            ]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            makeSelection(col2Tds[1], col2Tds[1], true);

            await draw();

            expect(await positions("mouse-selected-area")).toEqual([
                [0, 1],
                [1, 1],
            ]);

            await paste();

            await draw();

            expect(await positions("clipboard-paste-selected-area")).toEqual([
                [0, 1],
                [1, 1],
            ]);

            expect(await cellValues("clipboard-paste-selected-area")).toEqual(["0, 0", "1, 2"]);
        });

        test("repeates on multi select area", async () => {
            const col1Tds = await page.$$("regular-table tbody tr td:nth-of-type(1)");
            const col2Tds = await page.$$("regular-table tbody tr td:nth-of-type(2)");

            makeSelection(col1Tds[0], col1Tds[0]);

            await copy();

            await draw();

            expect(await positions("clipboard-copy-selected-area")).toEqual([[0, 0]]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            makeSelection(col2Tds[2], col2Tds[2], true);

            await draw();

            expect(await positions("mouse-selected-area")).toEqual([
                [0, 1],
                [1, 2],
            ]);

            await paste();

            await draw();

            expect(await positions("clipboard-paste-selected-area")).toEqual([
                [0, 1],
                [1, 2],
            ]);

            expect(await cellValues("clipboard-paste-selected-area")).toEqual(["0, 0", "0, 0"]);
        });
    });

    describe("cut/paste", () => {
        test("cuts multi select areas to multiple targets", async () => {
            const col1Tds = await page.$$("regular-table tbody tr td:nth-of-type(1)");
            const col2Tds = await page.$$("regular-table tbody tr td:nth-of-type(2)");

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[0]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[0]);

            makeSelection(col2Tds[2], col2Tds[2], true);

            await cut();

            await draw();

            expect(await positions("clipboard-copy-selected-area")).toEqual([
                [0, 0],
                [1, 2],
            ]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mousedown", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            await page.evaluate(async (td) => {
                const event = new MouseEvent("mouseup", {bubbles: true});
                td.dispatchEvent(event);
            }, col1Tds[1]);

            makeSelection(col2Tds[1], col2Tds[1], true);

            await draw();

            expect(await positions("mouse-selected-area")).toEqual([
                [0, 1],
                [1, 1],
            ]);

            await paste();

            await draw();

            expect(await positions("clipboard-paste-selected-area")).toEqual([
                [0, 1],
                [1, 1],
            ]);

            expect(await cellValues("clipboard-paste-selected-area")).toEqual(["0, 0", "1, 2"]);
            expect(await cellValues("clipboard-copy-selected-area")).toEqual(["", ""]);
        });
    });
});
