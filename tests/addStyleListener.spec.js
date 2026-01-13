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

test.describe("addStyleListener() and invalidate()", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("addStyleListener()", () => {
        test("calls the style listener after draw", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                el.addStyleListener(() => {
                    callCount++;
                });
                await el.draw();
                return callCount;
            });

            expect(result).toBeGreaterThan(0);
        });

        test("provides the table element in the event detail", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let detailElement = null;
                el.addStyleListener((event) => {
                    detailElement = event.detail;
                });
                await el.draw();
                return detailElement === el;
            });

            expect(result).toBe(true);
        });

        test("allows styling cells from within the listener", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                el.addStyleListener(() => {
                    const firstCell = el.querySelector("td");
                    if (firstCell) {
                        firstCell.style.backgroundColor = "rgb(255, 0, 0)";
                    }
                });
                await el.draw();
            });

            const firstCell = page.locator("regular-table tbody tr td").first();
            const backgroundColor = await firstCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("background-color"),
            );

            expect(backgroundColor).toBe("rgb(255, 0, 0)");
        });

        test("calls multiple style listeners in order", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                const callOrder = [];
                el.addStyleListener(() => {
                    callOrder.push(1);
                });
                el.addStyleListener(() => {
                    callOrder.push(2);
                });
                el.addStyleListener(() => {
                    callOrder.push(3);
                });
                await el.draw();
                return callOrder;
            });

            expect(result).toEqual([1, 2, 3]);
        });

        test("supports async style listeners", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let completed = false;
                el.addStyleListener(async () => {
                    await new Promise((resolve) => setTimeout(resolve, 10));
                    completed = true;
                });
                await el.draw();
                return completed;
            });

            expect(result).toBe(true);
        });

        test("calls style listener on subsequent draws", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                el.addStyleListener(() => {
                    callCount++;
                });
                await el.draw();
                const firstCount = callCount;
                await el.draw();
                const secondCount = callCount;
                return { firstCount, secondCount };
            });

            expect(result.firstCount).toBeGreaterThan(0);
            expect(result.secondCount).toBeGreaterThan(result.firstCount);
        });

        test("style listener is called after scroll", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                el.addStyleListener(() => {
                    callCount++;
                });
                await el.draw();
                const countBeforeScroll = callCount;

                el.scrollTop = 500;
                await el.draw();
                const countAfterScroll = callCount;

                return {
                    countBeforeScroll,
                    countAfterScroll,
                    increased: countAfterScroll > countBeforeScroll,
                };
            });

            expect(result.increased).toBe(true);
        });

        test("returns an unsubscribe function", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                const unsubscribe = el.addStyleListener(() => {});
                return typeof unsubscribe === "function";
            });

            expect(result).toBe(true);
        });

        test("unsubscribe function removes the listener", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                const unsubscribe = el.addStyleListener(() => {
                    callCount++;
                });
                await el.draw();
                const countBeforeUnsubscribe = callCount;

                unsubscribe();
                await el.draw();
                const countAfterUnsubscribe = callCount;

                return {
                    countBeforeUnsubscribe,
                    countAfterUnsubscribe,
                    same: countBeforeUnsubscribe === countAfterUnsubscribe,
                };
            });

            expect(result.countBeforeUnsubscribe).toBeGreaterThan(0);
            expect(result.same).toBe(true);
        });

        test("unsubscribe is idempotent", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                const unsubscribe = el.addStyleListener(() => {
                    callCount++;
                });
                await el.draw();

                unsubscribe();
                unsubscribe();
                unsubscribe();

                await el.draw();
                const countAfterMultipleUnsubscribe = callCount;

                return countAfterMultipleUnsubscribe;
            });

            expect(result).toBe(1);
        });

        test("only removes the specific listener when unsubscribed", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let call1 = 0;
                let call2 = 0;
                let call3 = 0;

                const unsubscribe1 = el.addStyleListener(() => {
                    call1++;
                });
                el.addStyleListener(() => {
                    call2++;
                });
                el.addStyleListener(() => {
                    call3++;
                });

                await el.draw();
                const beforeUnsubscribe = { call1, call2, call3 };

                unsubscribe1();

                await el.draw();
                const afterUnsubscribe = { call1, call2, call3 };

                return { beforeUnsubscribe, afterUnsubscribe };
            });

            expect(result.beforeUnsubscribe.call1).toBeGreaterThan(0);
            expect(result.beforeUnsubscribe.call2).toBeGreaterThan(0);
            expect(result.beforeUnsubscribe.call3).toBeGreaterThan(0);

            expect(result.afterUnsubscribe.call1).toBe(
                result.beforeUnsubscribe.call1,
            );
            expect(result.afterUnsubscribe.call2).toBeGreaterThan(
                result.beforeUnsubscribe.call2,
            );
            expect(result.afterUnsubscribe.call3).toBeGreaterThan(
                result.beforeUnsubscribe.call3,
            );
        });

        test("can access metadata from within style listener", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let metadata = null;
                el.addStyleListener(() => {
                    const td = el.querySelector("td");
                    if (td) {
                        metadata = el.getMeta(td);
                    }
                });
                await el.draw();
                return metadata;
            });

            expect(result).toBeTruthy();
            expect(result.x).toBeDefined();
            expect(result.y).toBeDefined();
        });
    });

    test.describe("invalidate()", () => {
        test("can be called within a style listener", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let invalidateCalled = false;
                el.addStyleListener(() => {
                    if (!invalidateCalled) {
                        try {
                            el.invalidate();
                            invalidateCalled = true;
                        } catch (e) {
                            invalidateCalled = false;
                        }
                    }
                });
                await el.draw();
                return invalidateCalled;
            });

            expect(result).toBe(true);
        });

        test("throws error when called outside style listener", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                try {
                    el.invalidate();
                    return false;
                } catch (e) {
                    return e.message.includes(
                        "Cannot call `invalidate()` outside of a `StyleListener`",
                    );
                }
            });

            expect(result).toBe(true);
        });
    });

    test.describe("integration scenarios", () => {
        test("style listener with invalidate applies striped rows", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                el.addStyleListener(() => {
                    const rows = el.querySelectorAll("tbody tr");
                    rows.forEach((row, index) => {
                        const cells = row.querySelectorAll("td");
                        cells.forEach((cell) => {
                            cell.style.backgroundColor =
                                index % 2 === 0
                                    ? "rgb(240, 240, 240)"
                                    : "rgb(255, 255, 255)";
                        });
                    });
                });
                await el.draw();
            });

            const firstRowCell = page
                .locator("regular-table tbody tr:nth-of-type(1) td")
                .first();
            const secondRowCell = page
                .locator("regular-table tbody tr:nth-of-type(2) td")
                .first();

            const bg1 = await firstRowCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("background-color"),
            );
            const bg2 = await secondRowCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("background-color"),
            );

            expect(bg1).toBe("rgb(240, 240, 240)");
            expect(bg2).toBe("rgb(255, 255, 255)");
        });

        test("style listener persists styles after scroll", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                el.addStyleListener(() => {
                    const tds = el.querySelectorAll("td");
                    tds.forEach((td) => {
                        td.style.fontWeight = "bold";
                    });
                });
                await el.draw();

                el.scrollTop = 500;
                await el.draw();
            });

            const firstCell = page.locator("regular-table tbody tr td").first();
            const fontWeight = await firstCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("font-weight"),
            );

            expect(parseInt(fontWeight)).toBeGreaterThanOrEqual(700);
        });

        test("multiple listeners can coexist and modify different aspects", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                el.addStyleListener(() => {
                    const tds = el.querySelectorAll("td");
                    tds.forEach((td) => {
                        td.style.color = "rgb(0, 0, 255)";
                    });
                });

                el.addStyleListener(() => {
                    const tds = el.querySelectorAll("td");
                    tds.forEach((td) => {
                        td.style.fontStyle = "italic";
                    });
                });

                await el.draw();
            });

            const firstCell = page.locator("regular-table tbody tr td").first();
            const color = await firstCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("color"),
            );
            const fontStyle = await firstCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("font-style"),
            );

            expect(color).toBe("rgb(0, 0, 255)");
            expect(fontStyle).toBe("italic");
        });

        test("style listener can use getMeta to apply conditional styling", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            await table.evaluate(async (el) => {
                el.addStyleListener(() => {
                    const tds = el.querySelectorAll("td");
                    tds.forEach((td) => {
                        const meta = el.getMeta(td);
                        if (meta && meta.x === 0) {
                            td.style.backgroundColor = "rgb(255, 255, 0)";
                        }
                    });
                });
                await el.draw();
            });

            const firstColumnCell = page.locator(
                "regular-table tbody tr:first-child td:first-of-type",
            );
            const secondColumnCell = page.locator(
                "regular-table tbody tr:first-child td:nth-of-type(2)",
            );

            const bg1 = await firstColumnCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("background-color"),
            );
            const bg2 = await secondColumnCell.evaluate((td) =>
                getComputedStyle(td).getPropertyValue("background-color"),
            );

            expect(bg1).toBe("rgb(255, 255, 0)");
            expect(bg2).not.toBe("rgb(255, 255, 0)");
        });

        test("removeStyleListener removes the listener", async ({ page }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let callCount = 0;
                const listener = () => {
                    callCount++;
                    const tds = el.querySelectorAll("td");
                    tds.forEach((td) => {
                        td.style.backgroundColor = "rgb(0, 255, 0)";
                    });
                };

                el.addStyleListener(listener);
                await el.draw();
                const countAfterAdd = callCount;

                el.removeStyleListener(listener);
                await el.draw();
                const countAfterRemove = callCount;

                return {
                    countAfterAdd,
                    countAfterRemove,
                    removed: countAfterAdd === countAfterRemove,
                };
            });

            expect(result.countAfterAdd).toBeGreaterThan(0);
            expect(result.removed).toBe(true);
        });

        test.skip("removeStyleListener handles missing listener gracefully", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                const listener1 = () => {};
                const listener2 = () => {};

                const initialLength = el._style_callbacks.length;
                el.addStyleListener(listener1);
                const afterAddLength = el._style_callbacks.length;

                el.removeStyleListener(listener2);
                const afterRemoveNonExistentLength = el._style_callbacks.length;

                return {
                    addedListener: afterAddLength === initialLength + 1,
                    unchangedAfterBadRemove:
                        afterRemoveNonExistentLength === afterAddLength,
                };
            });

            expect(result.addedListener).toBe(true);
            expect(result.unchangedAfterBadRemove).toBe(true);
        });

        test.skip("invalidate signals need for viewport recalculation", async ({
            page,
        }) => {
            const table = page.locator("regular-table");
            const result = await table.evaluate(async (el) => {
                let invalidatedFlag = false;

                el.addStyleListener(() => {
                    const tds = el.querySelectorAll("tbody tr:first-child td");
                    tds.forEach((td) => {
                        td.style.width = "20px";
                    });
                    el.invalidate();
                    invalidatedFlag = el._invalidated;
                });

                await el.draw();

                return {
                    invalidatedFlag,
                };
            });

            expect(result.invalidatedFlag).toBe(true);
        });
    });
});
