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

test.describe("predraw()", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/tests/api.html");
        await page.waitForSelector("regular-table table tbody tr td");
    });

    test.describe("inline fallback", () => {
        test("falls back to drawing inline on a never-drawn table", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.createElement("regular-table");
                table.style.width = "400px";
                table.style.height = "300px";
                document.body.appendChild(table);
                table.setDataListener(window.dataListener);
                const commit = await table.predraw(400, 300);
                const num_cells_before_commit =
                    table.querySelectorAll("td").length;
                const committed = commit();
                return {
                    inline: commit.inline,
                    committed,
                    num_cells_before_commit,
                };
            });

            expect(result.inline).toBe(true);
            expect(result.committed).toBe(true);
            expect(result.num_cells_before_commit).toBeGreaterThan(0);
        });

        test("falls back to drawing inline after resetAutoSize()", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                table.resetAutoSize();
                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                );
                return { inline: commit.inline };
            });

            expect(result.inline).toBe(true);
        });
    });

    test.describe("synchronous commit", () => {
        test("returns a deferred commit closure on a warm table", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                );
                return { inline: commit.inline, committed: commit() };
            });

            expect(result.inline).toBe(false);
            expect(result.committed).toBe(true);
        });

        test("does not mutate the DOM until commit is invoked", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                const before = table.querySelector("td").textContent;

                // Bind new marker data over the same shape, `preserve_state`
                // to keep this a pure data update.
                table.setDataListener(
                    async (x0, y0, x1, y1) => {
                        const response = await window.dataListener(
                            x0,
                            y0,
                            x1,
                            y1,
                        );
                        response.data = response.data.map((col) =>
                            col.map((val) => `X${val}`),
                        );
                        return response;
                    },
                    { preserve_state: true },
                );

                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                );

                const during = table.querySelector("td").textContent;
                commit();
                const after = table.querySelector("td").textContent;
                return { inline: commit.inline, before, during, after };
            });

            expect(result.inline).toBe(false);
            expect(result.during).toBe(result.before);
            expect(result.after).toBe(`X${result.before}`);
        });

        test("renders the same DOM as an equivalent draw()", async ({
            page,
        }) => {
            const snapshot = (table) => ({
                cells: Array.from(table.querySelectorAll("td")).map(
                    (td) => td.textContent,
                ),
                headers: Array.from(table.querySelectorAll("th")).map(
                    (th) => th.textContent,
                ),
            });

            const via_draw = await page.evaluate(async (snapshot_src) => {
                const snapshot = eval(snapshot_src);
                const table = document.querySelector("regular-table");
                const overrides = {};
                for (let i = 0; i < 40; i++) {
                    overrides[i] = 80;
                }

                table.restoreColumnSizes(overrides);
                await table.draw();
                await table.draw();
                return snapshot(table);
            }, snapshot.toString());

            const via_predraw = await page.evaluate(async (snapshot_src) => {
                const snapshot = eval(snapshot_src);
                const table = document.querySelector("regular-table");
                const clip = table.shadowRoot.children[1];
                const commit = await table.predraw(
                    clip.clientWidth,
                    clip.clientHeight,
                    { container_height: table.clientHeight },
                );
                commit();
                return { inline: commit.inline, ...snapshot(table) };
            }, snapshot.toString());

            expect(via_predraw.inline).toBe(false);
            expect(via_predraw.cells).toEqual(via_draw.cells);
            expect(via_predraw.headers).toEqual(via_draw.headers);
        });

        test("invokes style listeners during commit", async ({ page }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                let calls = 0;
                table.addStyleListener(() => {
                    calls++;
                });

                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                );

                const calls_before_commit = calls;
                commit();
                return {
                    inline: commit.inline,
                    calls_before_commit,
                    calls_after_commit: calls,
                };
            });

            expect(result.inline).toBe(false);
            expect(result.calls_before_commit).toBe(0);
            expect(result.calls_after_commit).toBeGreaterThan(0);
        });

        test("respects the scroll position snapshot options", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                    { scroll_top: table.scrollHeight },
                );

                commit();
                const meta = table.getMeta(table.querySelector("td"));
                return { inline: commit.inline, y0: meta.y0 };
            });

            expect(result.inline).toBe(false);
            expect(result.y0).toBeGreaterThan(0);
        });
    });

    test.describe("data listener call pattern", () => {
        test("performs all DataListener calls before resolving", async ({
            page,
        }) => {
            const result = await page.evaluate(async () => {
                const table = document.querySelector("regular-table");
                await table.draw();
                let calls = 0;
                table.setDataListener(
                    async (...args) => {
                        calls++;
                        return await window.dataListener(...args);
                    },
                    { preserve_state: true },
                );

                const commit = await table.predraw(
                    table.clientWidth,
                    table.clientHeight,
                );

                const calls_before_commit = calls;
                commit();
                return {
                    inline: commit.inline,
                    calls_before_commit,
                    calls_after_commit: calls,
                };
            });

            expect(result.inline).toBe(false);
            expect(result.calls_before_commit).toBeGreaterThan(0);
            expect(result.calls_after_commit).toBe(result.calls_before_commit);
        });
    });
});
