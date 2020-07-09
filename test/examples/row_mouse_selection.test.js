/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("row_mouse_selection.html", () => {
    const selectedRows = async () => {
        const selectedCells = await page.$$("regular-table tbody tr th.mouse-selected-row");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({width: 2500, height: 2500});
        await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("includes no selection", async () => {
            expect(await selectedRows()).toEqual([]);
        });
    });

    describe("row selection", () => {
        describe("selecting one row group", () => {
            test("includes the group and the rows", async () => {
                const groupHeader0 = await page.$("regular-table tbody tr th:nth-of-type(1)");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, groupHeader0);

                expect(await selectedRows()).toEqual(["Group 0", "Row 0", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9"]);
            });

            test("splitting the group with ctrl", async () => {
                expect(await selectedRows()).toEqual(["Group 0", "Row 0", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9"]);

                const rowHeader3 = await page.$("regular-table tbody tr:nth-of-type(4) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                    th.dispatchEvent(event);
                }, rowHeader3);

                expect(await selectedRows()).toEqual(["Row 0", "Row 1", "Row 2", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9"]);
            });
        });

        describe("selecting one row", () => {
            beforeEach(async () => {
                await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
                await page.waitFor("regular-table table tbody tr td");
            });

            test("selects the row header and cells then deselects", async () => {
                const rowHeader1 = await page.$("regular-table tbody tr:nth-of-type(2) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, rowHeader1);
                await page.waitFor("regular-table td.mouse-selected-row");
                const selectedCells = await page.$$("regular-table tbody tr td.mouse-selected-row");
                expect(await selectedRows()).toEqual(["Row 1"]);
                expect(selectedCells.length > 0).toEqual(true);

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                    th.dispatchEvent(event);
                }, rowHeader1);
                expect(await selectedRows()).toEqual([]);
            });
        });

        describe("selecting a row range", () => {
            beforeEach(async () => {
                await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
                await page.waitFor("regular-table table tbody tr td");
            });

            test("selects the rows' headers and cells", async () => {
                const rowHeader1 = await page.$("regular-table tbody tr:nth-of-type(2) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                    th.dispatchEvent(event);
                }, rowHeader1);

                const rowHeader3 = await page.$("regular-table tbody tr:nth-of-type(4) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                    th.dispatchEvent(event);
                }, rowHeader3);

                await page.waitFor("regular-table td.mouse-selected-row");
                expect(await selectedRows()).toEqual(["Row 1", "Row 2", "Row 3"]);
            });
        });

        describe("selecting a group range", () => {
            beforeEach(async () => {
                await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
                await page.waitFor("regular-table table tbody tr td");
            });

            describe("both selections are group headers", () => {
                test("selects the groups' headers, rows' headers and cells", async () => {
                    const groupHeader0 = await page.$("regular-table tbody tr th:nth-of-type(1)");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, groupHeader0);

                    const ths = await page.$$("regular-table tbody th");
                    const groupHeader10 = ths[11];
                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                        th.dispatchEvent(event);
                    }, groupHeader10);

                    await page.waitFor("regular-table td.mouse-selected-row");
                    expect(await selectedRows()).toEqual([
                        "Group 0",
                        "Row 0",
                        "Row 1",
                        "Row 2",
                        "Row 3",
                        "Row 4",
                        "Row 5",
                        "Row 6",
                        "Row 7",
                        "Row 8",
                        "Row 9",
                        "Group 10",
                        "Row 10",
                        "Row 11",
                        "Row 12",
                        "Row 13",
                        "Row 14",
                        "Row 15",
                        "Row 16",
                        "Row 17",
                        "Row 18",
                        "Row 19",
                    ]);
                });
            });

            describe("second selection is a row header", () => {
                test("selects the rows' headers and cells", async () => {
                    const groupHeader0 = await page.$("regular-table tbody tr th:nth-of-type(1)");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, groupHeader0);

                    const rowHeader11 = await page.$("regular-table tbody tr:nth-of-type(12) th");
                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                        th.dispatchEvent(event);
                    }, rowHeader11);

                    await page.waitFor("regular-table td.mouse-selected-row");
                    expect(await selectedRows()).toEqual(["Row 0", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9", "Row 10", "Row 11"]);
                });
            });
        });

        describe("splitting a row range", () => {
            beforeEach(async () => {
                await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
                await page.waitFor("regular-table table tbody tr td");
            });

            test("selects the rows' headers and cells", async () => {
                const rowHeader1 = await page.$("regular-table tbody tr:nth-of-type(2) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                    th.dispatchEvent(event);
                }, rowHeader1);

                const rowHeader3 = await page.$("regular-table tbody tr:nth-of-type(4) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, shiftKey: true});
                    th.dispatchEvent(event);
                }, rowHeader3);

                const rowHeader2 = await page.$("regular-table tbody tr:nth-of-type(3) th");
                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                    th.dispatchEvent(event);
                }, rowHeader2);

                await page.waitFor("regular-table td.mouse-selected-row");
                expect(await selectedRows()).toEqual(["Row 1", "Row 3"]);
            });
        });

        describe("selecting two rows", () => {
            beforeAll(async () => {
                await page.goto("http://localhost:8081/dist/examples/row_mouse_selection.html");
                await page.waitFor("regular-table table tbody tr td");
            });

            describe("without CTRL pressed", () => {
                test("includes only the most recent selection", async () => {
                    const ths = await page.$$("regular-table tbody tr th");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, ths[3]);

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, ctrlKey: false});
                        th.dispatchEvent(event);
                    }, ths[5]);

                    expect(await selectedRows()).toEqual(["Row 4"]);
                });
            });

            describe("with CTRL pressed", () => {
                test("includes the rows", async () => {
                    const ths = await page.$$("regular-table tbody tr th");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, ths[3]);

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                        th.dispatchEvent(event);
                    }, ths[5]);

                    expect(await selectedRows()).toEqual(["Row 2", "Row 4"]);
                });
            });
        });
    });
});
