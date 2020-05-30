/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("file_browser.html", () => {
    beforeAll(async () => {
        await page.setViewport({width: 400, height: 100});
    });

    describe("creates a `<table>` body when attached to `document`", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/file_browser.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("with the correct # of rows", async () => {
            const tbody = await page.$("regular-table tbody");
            const num_rows_rendered = await page.evaluate((tbody) => tbody.children.length, tbody);
            expect(num_rows_rendered).toEqual(5);
        });

        test("with the correct # of columns", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const num_cells_rendered = await page.evaluate((first_tr) => first_tr.children.length, first_tr);
            expect(num_cells_rendered).toEqual(4);
        });

        test("with the first row's cell test correct", async () => {
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "add able/",
                "1/1/1971",
                "dir",
                "false"
            ]);
        });
    });

    describe("scrolls via scrollTo() method", () => {
        beforeAll(async () => {
            await page.goto("http://localhost:8081/examples/file_browser.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        test("to (0, 1)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(0, 1, 4, 100);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "add baker/",
                "1/2/1971",
                "dir",
                "false",
            ]);
        });

        test("to (0, 79)", async () => {
            const table = await page.$("regular-table");
            await page.evaluate(async (table) => {
                table.scrollTo(0, 79, 4, 100);
                await table.draw();
            }, table);
            const first_tr = await page.$("regular-table tbody tr:first-child");
            const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
            expect(cell_values).toEqual([
                "file_69.txt",
                "3/21/1971",
                "text",
                "false",
            ]);
        });
    });

    describe("expands and collapses tree rows", () => {
        const first_tr_selector = "regular-table tbody tr:first-child";
        const first_row_header_icon_selector = `${first_tr_selector} .pd-row-header-icon`;

        beforeAll(async () => {
            // refresh page
            await page.goto("http://localhost:8081/examples/file_browser.html");
            await page.waitFor("regular-table table tbody tr td");
        });

        describe("expands", () => {
            beforeAll(async () => {
                // expand first directory row
                let first_row_header_icon = await page.$(first_row_header_icon_selector);
                await first_row_header_icon.click();
            });

            afterAll(async () => {
                // reset scroll position
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    await table.draw({reset_scroll_position: true});
                }, table);
            });

            test("expand the first tree row", async () => {
                // test the tree header icon
                const first_row_header_icon = await page.$(first_row_header_icon_selector);
                const icon_text = await page.evaluate((x) => x.innerText, first_row_header_icon);
                expect(icon_text).toEqual("remove");
            });

            test("first row added by expand is correct", async () => {
                // scroll to and test first row added by expand
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTo(0, 1, 4, 200);
                    await table.draw();
                }, table);

                const first_tr = await page.$(first_tr_selector);
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
                expect(cell_values).toEqual([
                    "add able/",
                    "1/1/1972",
                    "dir",
                    "false"
                ]);
            });

            test("last row added by expand is correct", async () => {
                // scroll to and test first row added by expand
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTo(0, 100, 4, 200);
                    await table.draw();
                }, table);

                const first_tr = await page.$(first_tr_selector);
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
                expect(cell_values).toEqual([
                    "file_89.txt",
                    "4/9/1972",
                    "text",
                    "false"
                ]);
            });
        });

        describe("collapses", () => {
            beforeAll(async () => {
                // collapse first directory row
                let first_row_header_icon = await page.$(first_row_header_icon_selector);
                await first_row_header_icon.click();
            });

            afterAll(async () => {
                // reset scroll position
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    await table.draw({reset_scroll_position: true});
                }, table);
            });

            test("collapse the first tree row", async () => {
                // test the tree header icon
                first_row_header_icon = await page.$(first_row_header_icon_selector);
                const icon_text = await page.evaluate((x) => x.innerText, first_row_header_icon);
                expect(icon_text).toEqual("add");
            });

            test("collapse restores previous rows", async () => {
                // scroll to and test the next row after the collapsed row
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollTo(0, 1, 4, 100);
                    await table.draw();
                }, table);

                const first_tr = await page.$(first_tr_selector);
                const cell_values = await page.evaluate((first_tr) => Array.from(first_tr.children).map((x) => x.textContent.trim()), first_tr);
                expect(cell_values).toEqual([
                    "add baker/",
                    "1/2/1971",
                    "dir",
                    "false"
                ]);
            });
        });
    });
});
