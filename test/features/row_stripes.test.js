/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("row_stripes.html", () => {
    beforeAll(async () => {
        await page.setViewport({ width: 200, height: 100 });
        await page.goto("http://localhost:8081/dist/features/row_stripes.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("row style alternates", async () => {
            const tds1 = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const backgroundColor1 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds1[0]);
            expect(backgroundColor1).toEqual("rgb(234, 237, 239)");

            const tds2 = await page.$$("regular-table tbody tr:nth-of-type(2) td");
            const backgroundColor2 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds2[0]);
            expect(backgroundColor2).toEqual("rgb(255, 255, 255)");
        });
    });

    describe("initial view", () => {
        beforeAll(async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTop = table.scrollTop + 42;
                await table._draw_flush();
            }, table);
        });

        test("row style alternates in reverse", async () => {
            const tds1 = await page.$$("regular-table tbody tr:nth-of-type(1) td");
            const backgroundColor1 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds1[0]);
            expect(backgroundColor1).toEqual("rgb(255, 255, 255)");

            const tds2 = await page.$$("regular-table tbody tr:nth-of-type(2) td");
            const backgroundColor2 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds2[0]);
            expect(backgroundColor2).toEqual("rgb(234, 237, 239)");
        });
    });

    test("removes style listener", async () => {
        await page.evaluate(() => {
            window.removeStripes();
        });

        const table = await page.$("regular-table");
        await page.evaluate(async (table) => {
            // Scroll a few pages down to verify that the style listener wasn't called
            table.scrollBy(0, window.innerHeight * 10);
            await table._draw_flush();
        }, table);

        const tds1 = await page.$$("regular-table tbody tr:nth-of-type(1) td");
        const backgroundColor1 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds1[0]);
        expect(backgroundColor1).toEqual("rgba(0, 0, 0, 0)");

        const tds2 = await page.$$("regular-table tbody tr:nth-of-type(2) td");
        const backgroundColor2 = await page.evaluate((td) => getComputedStyle(td).getPropertyValue("background-color"), tds2[0]);
        expect(backgroundColor2).toEqual("rgba(0, 0, 0, 0)");
    });
});
