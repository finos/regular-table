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

test.describe("CSS variables and sub-cell scrolling", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/examples/react/index.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test("CSS variables are initially set to 0 at origin", async ({ page }) => {
        const cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const style = getComputedStyle(table);
            return {
                transformX: style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: style.getPropertyValue("--regular-table--clip-x"),
                clipY: style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(cssVars.transformX).toBe("0px");
        expect(cssVars.transformY).toBe("0px");
        expect(cssVars.clipX).toBe("0px");
        expect(cssVars.clipY).toBe("0px");
    });

    test("CSS variables update correctly on vertical scroll", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll vertically by a fractional amount
        await table.evaluate(async (el) => {
            // Scroll by approximately 2.5 rows
            el.scrollTop = 250;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        const cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(-3.164, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(3.164, 3);
    });

    test("CSS variables update correctly on horizontal scroll", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll horizontally by a fractional amount
        await table.evaluate(async (el) => {
            el.scrollLeft = 180;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        const cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(-59.3125, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(59.3125, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(0, 3);
    });

    test("CSS variables update correctly on diagonal scroll", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll both vertically and horizontally
        await table.evaluate(async (el) => {
            el.scrollTop = 300;
            el.scrollLeft = 220;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        const cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(-38.969, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(-15.197, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(38.969, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(15.197, 3);
    });

    test("CSS variables reset when scrolling back to origin", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll away from origin
        await table.evaluate(async (el) => {
            el.scrollTop = 400;
            el.scrollLeft = 300;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        // Verify variables are set
        const scrolledVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
            };
        });

        expect(parseFloat(scrolledVars.transformX)).toBeCloseTo(-58.625, 3);
        expect(parseFloat(scrolledVars.clipX)).toBeCloseTo(58.625, 3);

        // Scroll back to origin
        await table.evaluate(async (el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        const originVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(originVars.transformX)).toBeCloseTo(0, 3);
        expect(parseFloat(originVars.transformY)).toBeCloseTo(0, 3);
        expect(parseFloat(originVars.clipX)).toBeCloseTo(0, 3);
        expect(parseFloat(originVars.clipY)).toBeCloseTo(0, 3);
    });

    test.skip("CSS variables are consistent after multiple scrolls", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll 500x200
        await table.evaluate(async (el) => {
            el.scrollTop = 500;
            el.scrollLeft = 200;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        let cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(-18.969, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(-6.328, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(18.969, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(6.328, 3);

        // Scroll 1000x400
        await table.evaluate(async (el) => {
            el.scrollTop = 1000;
            el.scrollLeft = 400;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(-37.9375, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(-12.655, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(37.9375, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(12.655, 3);

        // Scroll 300x100
        await table.evaluate(async (el) => {
            el.scrollTop = 300;
            el.scrollLeft = 100;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(-39.65625, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(-15.197, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(39.65625, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(15.197, 3);

        // Scroll 0x0
        await table.evaluate(async (el) => {
            el.scrollTop = 0;
            el.scrollLeft = 0;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        cssVars = await page.evaluate(() => {
            const table = document.querySelector("regular-table");
            const shadowRoot = table.shadowRoot;
            const styleSheet = shadowRoot.adoptedStyleSheets[1];
            const rule = styleSheet.cssRules[0];
            return {
                transformX: rule.style.getPropertyValue(
                    "--regular-table--transform-x",
                ),
                transformY: rule.style.getPropertyValue(
                    "--regular-table--transform-y",
                ),
                clipX: rule.style.getPropertyValue("--regular-table--clip-x"),
                clipY: rule.style.getPropertyValue("--regular-table--clip-y"),
            };
        });

        expect(parseFloat(cssVars.transformX)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.transformY)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.clipX)).toBeCloseTo(0, 3);
        expect(parseFloat(cssVars.clipY)).toBeCloseTo(0, 3);
    });

    test("CSS clip-path properties are applied to correct elements", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll to create sub-cell offsets
        await table.evaluate(async (el) => {
            el.scrollTop = 150;
            el.scrollLeft = 150;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        // Check that first row first cell has clip-path
        const firstCellClipPath = await page
            .locator("regular-table tbody tr:first-child td:first-of-type")
            .evaluate((el) => getComputedStyle(el).clipPath);

        // Parse the polygon values and compare with tolerance
        const firstCellMatch = firstCellClipPath.match(
            /polygon\(([\d.]+)px ([\d.]+)px, ([\d.]+)px [\d.]+%, [\d.]+% [\d.]+%, [\d.]+% ([\d.]+)px\)/,
        );
        expect(parseFloat(firstCellMatch[1])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstCellMatch[2])).toBeCloseTo(17.098, 3);
        expect(parseFloat(firstCellMatch[3])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstCellMatch[4])).toBeCloseTo(17.098, 3);

        // Check that first row cells have clip-path
        const firstRowCellClipPath = await page
            .locator("regular-table tbody tr:first-child td:nth-child(3)")
            .evaluate((el) => getComputedStyle(el).clipPath);

        const firstRowMatch = firstRowCellClipPath.match(
            /polygon\(([\d.]+)px ([\d.]+)px, ([\d.]+)px [\d.]+%, [\d.]+% [\d.]+%, [\d.]+% ([\d.]+)px\)/,
        );
        expect(parseFloat(firstRowMatch[1])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstRowMatch[2])).toBeCloseTo(17.098, 3);
        expect(parseFloat(firstRowMatch[3])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstRowMatch[4])).toBeCloseTo(17.098, 3);

        // Check that first column cells have clip-path
        const firstColCellClipPath = await page
            .locator("regular-table tbody tr:nth-child(2) td:first-of-type")
            .evaluate((el) => getComputedStyle(el).clipPath);

        const firstColMatch = firstColCellClipPath.match(
            /polygon\(([\d.]+)px ([\d.]+)px, ([\d.]+)px [\d.]+%, [\d.]+% [\d.]+%, [\d.]+% ([\d.]+)px\)/,
        );
        expect(parseFloat(firstColMatch[1])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstColMatch[2])).toBeCloseTo(0, 3);
        expect(parseFloat(firstColMatch[3])).toBeCloseTo(29.313, 3);
        expect(parseFloat(firstColMatch[4])).toBeCloseTo(0, 3);
    });

    test("CSS transform properties are applied to correct elements", async ({
        page,
    }) => {
        const table = page.locator("regular-table");

        // Scroll to create sub-cell offsets
        await table.evaluate(async (el) => {
            el.scrollTop = 175;
            el.scrollLeft = 125;
            await el.draw();
            await new Promise((resolve) => requestAnimationFrame(resolve));
        });

        // Check that td cells have transform applied
        const cellTransform = await page
            .locator("regular-table tbody tr:first-child td:first-of-type")
            .evaluate((el) => getComputedStyle(el).transform);

        const cellMatch = cellTransform.match(
            /matrix\([\d.]+, [\d.]+, [\d.]+, [\d.]+, ([-\d.]+), ([-\d.]+)\)/,
        );
        expect(parseFloat(cellMatch[1])).toBeCloseTo(-4.313, 3);
        expect(parseFloat(cellMatch[2])).toBeCloseTo(0, 3);

        // Check that tbody has transform applied
        const tbodyTransform = await page
            .locator("regular-table tbody")
            .evaluate((el) => getComputedStyle(el).transform);

        const tbodyMatch = tbodyTransform.match(
            /matrix\([\d.]+, [\d.]+, [\d.]+, [\d.]+, ([-\d.]+), ([-\d.]+)\)/,
        );
        expect(parseFloat(tbodyMatch[1])).toBeCloseTo(0, 3);
        expect(parseFloat(tbodyMatch[2])).toBeCloseTo(-4.115, 3);

        // Check that thead th cells have transform applied
        const headerTransform = await page
            .locator("regular-table thead th:not(.rt-group-corner)")
            .first()
            .evaluate((el) => getComputedStyle(el).transform);

        const headerMatch = headerTransform.match(
            /matrix\([\d.]+, [\d.]+, [\d.]+, [\d.]+, ([-\d.]+), ([-\d.]+)\)/,
        );
        expect(parseFloat(headerMatch[1])).toBeCloseTo(-4.313, 3);
        expect(parseFloat(headerMatch[2])).toBeCloseTo(0, 3);
    });
});
