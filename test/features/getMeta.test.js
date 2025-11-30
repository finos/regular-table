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

describe("getMeta()", () => {
    beforeAll(async () => {
        await page.setViewport({ width: 200, height: 200 });
        await page.goto(
            "http://localhost:8081/test/features/2_row_2_column_headers.html",
        );
        await page.waitForSelector("regular-table table tbody tr td");
    });

    describe("returns the correct metadata", () => {
        test("for {x: 0, y: 0}", async () => {
            const table = await page.$("regular-table");
            const meta = await page.evaluate((table) => {
                return JSON.stringify(
                    table.getMeta(document.querySelector("td")),
                );
            }, table);

            expect(JSON.parse(meta)).toEqual({
                column_header: ["Group 0", "Column 0"],
                row_header: ["Group 0", "Row 0"],
                dx: 0,
                dy: 0,
                size_key: 2,
                _virtual_x: 2,
                value: "0",
                x: 0,
                x0: 0,
                x1: 5,
                y: 0,
                y0: 0,
                y1: 10,
            });
        });

        test("for {row_header_x: 0, y: 0}", async () => {
            const table = await page.$("regular-table");
            const meta = await page.evaluate((table) => {
                return JSON.stringify(
                    table.getMeta(document.querySelector("tbody th")),
                );
            }, table);
            expect(JSON.parse(meta)).toEqual({
                row_header: ["Group 0", "Row 0"],
                size_key: 0,
                _virtual_x: 0,
                value: "Group 0",
                row_header_x: 0,
                y: 0,
                y0: 0,
                y1: 10,
            });
        });

        test("for {x: 0, column_header_y: 0}", async () => {
            const table = await page.$("regular-table");
            const meta = await page.evaluate((table) => {
                return JSON.stringify(
                    table.getMeta(
                        document.querySelector("thead th:nth-child(2)"),
                    ),
                );
            }, table);
            expect(JSON.parse(meta)).toEqual({
                column_header: ["Group 0", "Column 0"],
                size_key: 3,
                _virtual_x: 2,
                value: "Group 0",
                column_header_y: 0,
                x: 0,
                x0: 0,
            });
        });

        describe("with the viewport scrolled to the right", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollLeft = 1000;
                    await table.draw();
                }, table);
            });

            test("for {x: 0, y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(document.querySelector("td")),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 10", "Column 16"],
                    row_header: ["Group 0", "Row 0"],
                    dx: 0,
                    dy: 0,
                    size_key: 18,
                    _virtual_x: 2,
                    value: "16",
                    x: 16,
                    x0: 16,
                    x1: 22,
                    y: 0,
                    y0: 0,
                    y1: 8,
                });
            });

            test("for {row_header_x: 0, y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(document.querySelector("tbody th")),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    row_header: ["Group 0", "Row 0"],
                    size_key: 0,
                    _virtual_x: 0,
                    value: "Group 0",
                    row_header_x: 0,
                    y: 0,
                    y0: 0,
                    y1: 8,
                });
            });

            test.skip("for {x: 0, column_header_y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(
                            document.querySelector("thead th:nth-child(2)"),
                        ),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 10", "Column 16"],
                    size_key: 19,
                    _virtual_x: 2,
                    value: "Group 10",
                    column_header_y: 0,
                    x: 16,
                    x0: 16,
                });
            });
        });

        describe("with the viewport scrolled down", () => {
            beforeAll(async () => {
                const table = await page.$("regular-table");
                await page.evaluate(async (table) => {
                    table.scrollLeft = 0;
                    table.scrollTop = 1000;
                    await table._draw_flush();
                }, table);
            });

            test.skip("for {x: 0, y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(document.querySelector("td")),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 0", "Column 0"],
                    row_header: ["Group 30", "Row 39"],
                    dx: 0,
                    dy: 0,
                    size_key: 2,
                    _virtual_x: 2,
                    value: "39",
                    x: 0,
                    x0: 0,
                    x1: 5,
                    y: 39,
                    y0: 39,
                    y1: 48,
                });
            });

            test("for {row_header_x: 0, y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(document.querySelector("tbody th")),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    row_header: ["Group 50", "Row 52"],
                    size_key: 0,
                    _virtual_x: 0,
                    value: "Group 50",
                    row_header_x: 0,
                    y: 52,
                    y0: 52,
                    y1: 61,
                });
            });

            test("for {x: 0, column_header_y: 0}", async () => {
                const table = await page.$("regular-table");
                const meta = await page.evaluate((table) => {
                    return JSON.stringify(
                        table.getMeta(
                            document.querySelector("thead th:nth-child(2)"),
                        ),
                    );
                }, table);
                expect(JSON.parse(meta)).toEqual({
                    column_header: ["Group 0", "Column 0"],
                    size_key: 4,
                    _virtual_x: 2,
                    value: "Group 0",
                    column_header_y: 0,
                    x: 0,
                    x0: 0,
                });
            });
        });
    });
});
