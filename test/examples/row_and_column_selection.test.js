/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

describe("row_and_column_selection.html", () => {
    const selectedColumns = async () => {
        const selectedCells = await page.$$("regular-table thead th.column-selected");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
        }
        return selectedValues;
    };

    const selectedRows = async () => {
        const selectedCells = await page.$$("regular-table tbody tr th.row-selected");
        const selectedValues = [];
        for (const td of selectedCells) {
            selectedValues.push(await page.evaluate((td) => td.innerHTML, td));
        }
        return selectedValues;
    };

    beforeAll(async () => {
        await page.setViewport({width: 2500, height: 2500});
        await page.goto("http://localhost:8081/dist/examples/row_and_column_selection.html");
        await page.waitFor("regular-table table tbody tr td");
    });

    describe("initial view", () => {
        test("includes no selection", async () => {
            expect(await selectedRows()).toEqual([]);
            expect(await selectedColumns()).toEqual([]);
        });
    });

    describe("column selection", () => {
        describe("selecting the origin header", () => {
            test("includes no selection", async () => {
                const ths = await page.$$("regular-table thead th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[0]);

                expect(await selectedColumns()).toEqual([]);
            });
        });

        describe("selecting the first column group", () => {
            test("includes the group and the rows", async () => {
                const ths = await page.$$("regular-table thead th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[1]);

                expect(await selectedColumns()).toEqual(["Group 0", "Column 0", "Column 1", "Column 2", "Column 3", "Column 4", "Column 5", "Column 6", "Column 7", "Column 8", "Column 9"]);
            });
        });

        describe("selecting one column", () => {
            beforeEach(async () => {
                const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[4]);
            });

            test("selects the cells", async () => {
                const selectedCells = await page.$$("regular-table tbody tr td.column-selected");
                const selectedValues = [];
                for (const td of selectedCells) {
                    selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
                }
                expect(selectedValues.length).toEqual(131);
            });

            test("includes the column", async () => {
                expect(await selectedColumns()).toEqual(["Column 2"]);
            });
        });

        describe("selecting two columns", () => {
            describe("without CTRL pressed", () => {
                test("includes only the most recent selection", async () => {
                    const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, ths[3]);

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, ctrlKey: false});
                        th.dispatchEvent(event);
                    }, ths[5]);

                    expect(await selectedColumns()).toEqual(["Column 3"]);
                });
            });

            describe("with CTRL pressed", () => {
                test("includes both columns", async () => {
                    const ths = await page.$$("regular-table thead tr:nth-of-type(2) th");

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true});
                        th.dispatchEvent(event);
                    }, ths[3]);

                    await page.evaluate(async (th) => {
                        const event = new MouseEvent("click", {bubbles: true, ctrlKey: true});
                        th.dispatchEvent(event);
                    }, ths[5]);

                    expect(await selectedColumns()).toEqual(["Column 1", "Column 3"]);
                });
            });
        });
    });

    describe("row selection", () => {
        describe("selecting one row group", () => {
            test("includes the group and the rows", async () => {
                const ths = await page.$$("regular-table tbody tr th:nth-of-type(1)");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[0]);

                expect(await selectedRows()).toEqual(["Group 0", "Row 0", "Row 1", "Row 2", "Row 3", "Row 4", "Row 5", "Row 6", "Row 7", "Row 8", "Row 9"]);
            });
        });

        describe("selecting one row", () => {
            beforeEach(async () => {
                const ths = await page.$$("regular-table tbody tr th:nth-of-type(2)");

                await page.evaluate(async (th) => {
                    const event = new MouseEvent("click", {bubbles: true});
                    th.dispatchEvent(event);
                }, ths[0]);
            });

            test("selects the cells", async () => {
                const selectedCells = await page.$$("regular-table tbody tr td.row-selected");
                const selectedValues = [];
                for (const td of selectedCells) {
                    selectedValues.push(await page.evaluate((td) => td.innerHTML.trim().split(" ").slice(0, 2).join(" "), td));
                }
                expect(selectedValues.length).toEqual(35);
            });

            test("selects the row", async () => {
                expect(await selectedRows()).toEqual(["Row 0"]);
            });
        });

        describe("selecting two rows", () => {
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
