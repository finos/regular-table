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

import { log_perf, throttle_tag, flush_tag } from "./utils";
import { DEBUG, BROWSER_MAX_HEIGHT } from "./constants";
import type { RegularTableViewModel } from "./table";
import { RegularTableElement } from "./regular-table";
import {
    ColumnSizes,
    DataResponse,
    StyleCallback,
    ContainerSize,
    DrawOptions,
    PredrawCommit,
    PredrawOptions,
    ViewCache,
    Viewport,
    ViewportValidation,
    VirtualMode,
} from "./types";

// @ts-ignore - CSS imports handled by build system
import container_css from "../../dist/css/container.css";

// @ts-ignore - CSS imports handled by build system
import sub_cell_offsets from "../../dist/css/sub-cell-offsets.css";

// CSS custom property names for sub-cell offsets
const CLIP_X = "--regular-table--clip-x";
const CLIP_Y = "--regular-table--clip-y";
const TRANSFORM_X = "--regular-table--transform-x";
const TRANSFORM_Y = "--regular-table--transform-y";

const HTML_TEMPLATE = `<div class="rt-virtual-panel"></div><div class="rt-scroll-table-clip"><slot></slot></div>`;

const PREDRAW_COLUMN_PAD = 1;

/**
 * Handles the virtual scroll pane, as well as the double buffering
 * of the underlying <table>. This DOM structure looks a little like
 * this:
 *
 *     +------------------------+      <- regular-table
 *     | +----------------------|------<- div.rt-virtual-panel
 *     | | +------------------+ |      <- div.rt-scroll-table-clip
 *     | | | +----------------|-|--+   <- table             |
 *     | | | | 1  A  Alabama  | |  |                        |
 *     | | | | 2  B  Arizona  | |  |                        |
 *     | | | | 3  C  Arkansas | |  |                        |
 *     | | | | 4  D  Californi| |  |                        |
 *     | | | | 5  E  Colorado | |  |                        |
 *     | | +------------------+ |  |                        |
 *     +------------------------+  |                        |
 *       |   | 8  H  District of C |                        |
 *       |   +---------------------+                        |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       |                                                  |
 *       +--------------------------------------------------+
 *
 * `overflow: auto` is applied to `.rt-scroll-container`, and `.rt-virtual-pane`
 * is sized to match the estimated "virtual" size of the `table`;  estimated,
 * because it's true size can't be known until all columns dimensions are known,
 * which may be deferred in the case of auto-sized tables.
 *
 * Double buffering can be enabled on "column scroll", "row scroll" and/or
 * "column schema change".  When enabled and a redraw is requested for the case,
 * the existing table is cloned with `cloneNode()` and swapped with the real
 * `table`, which is then updated offscreen and swapped back in.  While this is
 * much slower to render, it prevents draw-in.
 *
 * @class RegularVirtualTableViewModel
 */
export class RegularVirtualTableViewModel extends HTMLElement {
    private _sub_cell_rule!: CSSStyleRule;
    protected _virtual_panel!: HTMLElement;
    protected _virtual_mode!: VirtualMode;
    protected _container_size!: ContainerSize;
    protected _start_row?: number;
    protected _end_row?: number;
    protected _start_col?: number;
    protected _end_col?: number;
    protected _invalid_schema?: boolean;
    protected _selected_id?: number;
    protected _table_clip!: HTMLElement;
    protected _column_sizes!: ColumnSizes;
    protected _view_cache!: ViewCache;
    protected _invalidated?: boolean;
    protected _is_styling?: boolean;
    protected table_model!: RegularTableViewModel;
    protected _style_callbacks!: Array<StyleCallback>;
    protected _scroll_pending?: boolean;
    protected _num_columns?: number;
    protected _column_classes?: boolean;
    private _probe_element?: [HTMLElement, HTMLElement];

    /**
     * Draws this virtual panel, given an object of render options that allow
     * the implementor to fine tune the individual render frames based on the
     * interaction and previous render state.
     *
     * @param {DrawOptions} [options]
     * @param {boolean} [options.invalid_viewport=true]
     * @param {boolean} [options.preserve_width=false]
     * @param {boolean} [options.throttle=true]
     */
    async draw(options: DrawOptions = {}): Promise<void> {
        if (typeof options.throttle !== "undefined" && !options.throttle) {
            return await internal_draw.call(this, options);
        } else {
            return await throttle_tag(this, () =>
                internal_draw.call(this, options),
            );
        }
    }

    /**
     * Await any pending rendering operations.
     */
    async flush(): Promise<void> {
        // A scroll-driven draw may still be waiting on its animation frame
        // (see `_on_scroll`); keep flushing until none is pending.
        do {
            await flush_tag(this);
        } while (this._scroll_pending);
    }

    /**
     * Prepare a draw without applying it to the DOM. `predraw()` performs
     * the asynchronous portion of `draw()` - `DataListener` invocation and
     * viewport calculation - against the provided viewport dimensions, and
     * returns a closure which applies the prepared render to the DOM
     * synchronously, so the visible mutation can be scheduled within a
     * larger async workflow (e.g. batched with other component updates in a
     * single animation frame).
     *
     * # Examples
     *
     * ```javascript
     * const commit = await table.predraw(table.clientWidth, table.clientHeight);
     * requestAnimationFrame(() => commit());
     * ```
     *
     * @param {number} width - The width of the scrollable viewport region to
     * fill. This is the box `draw()` measures as its internal scroll clip's
     * `clientWidth`: the element's `clientWidth` less any classic scrollbar
     * gutter (they are identical under overlay scrollbars).
     * @param {number} height - The height of the scrollable viewport region
     * to fill (as `width`, the element's `clientHeight` less any classic
     * scrollbar gutter).
     * @param {PredrawOptions} [options]
     * @returns A closure which synchronously applies this render to the DOM.
     */
    async predraw(
        width: number,
        height: number,
        options: PredrawOptions = {},
    ): Promise<PredrawCommit> {
        const {
            invalid_viewport = true,
            preserve_width = false,
            cache = false,
            scroll_left = this.scrollLeft,
            scroll_top = this.scrollTop,
            container_height = height,
            throttle,
        } = options;

        const noop = (): PredrawCommit =>
            Object.assign(() => true, { inline: true });

        const inline = async (): Promise<PredrawCommit> => {
            await this.draw({
                invalid_viewport,
                preserve_width,
                cache,
                throttle,
            });

            return noop();
        };

        if (!this._view_cache) {
            console.warn("data listener not configured");
            return noop();
        }

        const { num_columns, num_rows } = await this._update_dim_state(cache);
        if (!this._column_sizes.row_height) {
            return await inline();
        }

        const safe_num_rows = num_rows || 0;
        const safe_num_columns = num_columns || 0;
        const container_size = this._resolve_container_size(
            () => width,
            () => height,
            () => container_height,
        );

        this._container_size = container_size;
        const panel_height = Math.round(
            this._virtual_panel_height(safe_num_rows),
        );

        const clamped_scroll_top = Number.isFinite(
            container_size.containerHeight,
        )
            ? Math.min(
                  scroll_top,
                  Math.max(0, panel_height - container_size.containerHeight),
              )
            : scroll_top;

        let viewport!: Viewport;
        let view_response: DataResponse | undefined;
        let should_render = false;
        let invalid_schema_or_column = false;
        for (let attempt = 0; attempt < 2; attempt++) {
            const planned_row_headers_length =
                this._view_cache.row_headers_length;

            const replanned = this._calculate_viewport(
                safe_num_rows,
                safe_num_columns,
                clamped_scroll_top,
                scroll_left,
            );

            const end_col = this._plan_column_extent(
                replanned,
                safe_num_columns,
            );

            if (end_col === undefined) {
                return await inline();
            }

            replanned.end_col = Math.min(
                safe_num_columns,
                end_col + PREDRAW_COLUMN_PAD,
            );

            if (attempt === 0) {
                const { invalid_row, invalid_column } =
                    this._validate_viewport(replanned);

                invalid_schema_or_column = !!(
                    this._invalid_schema || invalid_column
                );

                should_render =
                    invalid_schema_or_column || invalid_row || invalid_viewport;
            } else if (
                Math.floor(replanned.start_col) ===
                    Math.floor(viewport.start_col) &&
                Math.ceil(replanned.end_col) <= Math.ceil(viewport.end_col)
            ) {
                // The already-fetched slab is a superset; keep its extent.
                replanned.end_col = viewport.end_col;
                viewport = replanned;
                break;
            }

            viewport = replanned;
            if (!should_render) {
                break;
            }

            view_response = await this._view_cache.view(
                Math.floor(viewport.start_col),
                Math.floor(viewport.start_row),
                Math.ceil(viewport.end_col),
                Math.ceil(viewport.end_row),
            );

            const actual_row_headers_length =
                view_response.num_row_headers ??
                view_response.row_headers?.[0]?.length ??
                0;

            if (actual_row_headers_length === planned_row_headers_length) {
                break;
            }

            this._view_cache.row_headers_length = actual_row_headers_length;
        }

        const view_cache = this._view_cache;
        // `commit()` (returned below) doesn't run synchronously with predraw() - _on_scroll
        // awaits a requestAnimationFrame between them - so `viewport` here can be stale relative
        // to scrollTop/scrollLeft by the time it's actually applied: the scroll position it was
        // computed for is exactly what `scroll_top`/`scroll_left` (captured from options above)
        // still hold, which may no longer match reality. The fetched *content* isn't worth
        // recomputing here (that needs another round trip through the row/col range and possibly
        // a re-fetch), but the sub-cell offset is pure, cheap, synchronous math - recomputing it
        // fresh whenever scroll has moved on means the visible transform always reflects the true
        // current position even if the content is a frame behind, instead of a stale offset
        // baked in at predraw()-call time silently overwriting whatever was already correctly
        // rendered by the time this deferred commit finally runs.
        const offset_viewport = (): Viewport =>
            this.scrollTop === scroll_top && this.scrollLeft === scroll_left
                ? viewport
                : this._calculate_viewport(
                      safe_num_rows,
                      safe_num_columns,
                      this.scrollTop,
                      this.scrollLeft,
                  );
        return Object.assign(
            () => {
                this._container_size = container_size;
                this._commit_viewport(viewport);
                this._update_virtual_panels(
                    invalid_viewport,
                    safe_num_rows,
                    safe_num_columns,
                    preserve_width,
                );

                if (!should_render || view_response === undefined) {
                    this._update_sub_cell_offset(offset_viewport());
                    return true;
                }

                let first_iteration = true;
                const style_callback = () => {
                    if (first_iteration) {
                        this._update_sub_cell_offset(offset_viewport());
                        first_iteration = false;
                    }

                    for (const callback of this._style_callbacks) {
                        // Style listeners may be async, but a synchronous commit
                        // cannot await them; any DOM effects they defer land
                        // after this commit and are not measured by it.
                        callback({
                            detail: this as unknown as RegularTableElement,
                        });
                    }
                };

                const complete = this.table_model.draw_sync(
                    container_size,
                    view_cache,
                    this._selected_id,
                    preserve_width,
                    viewport,
                    safe_num_columns,
                    view_response,
                    style_callback,
                );

                this._post_render(
                    viewport,
                    safe_num_rows,
                    safe_num_columns,
                    preserve_width,
                    invalid_schema_or_column,
                );

                if (view_cache === this._view_cache) {
                    this._invalid_schema = false;
                }

                if (!complete) {
                    this.draw({ invalid_viewport: true });
                }

                return complete;
            },
            { inline: false },
        );
    }

    /**
     * Fetch the data set dimensions and apply them to view state - the
     * shared head of both `draw()` and `predraw()`.
     */
    protected async _update_dim_state(
        cache: boolean | undefined,
    ): Promise<DataResponse> {
        if (!cache) {
            this.table_model._resetDimState();
        }

        const dims = await this.table_model._getDimState(this._view_cache);
        this._num_columns = dims.num_columns || 0;
        this._column_sizes.row_height =
            dims.row_height || this._column_sizes.row_height;

        if (dims.num_row_headers !== undefined) {
            this._view_cache.row_headers_length = dims.num_row_headers;
        }

        if (dims.num_column_headers !== undefined) {
            this._view_cache.column_headers_length = dims.num_column_headers;
        }

        return dims;
    }

    /**
     * Mask the viewport dimensions to `Infinity` on axes this table does not
     * virtualize. Dimensions are supplied as thunks so that a masked axis's
     * value is never evaluated - `draw()` passes `clientWidth` etc. reads,
     * which must not force layout for axes that don't need them.
     */
    protected _resolve_container_size(
        width: () => number,
        height: () => number,
        containerHeight: () => number,
    ): ContainerSize {
        const is_non_vertical =
            this._virtual_mode === "none" ||
            this._virtual_mode === "horizontal";

        const is_non_horizontal =
            this._virtual_mode === "none" || this._virtual_mode === "vertical";

        return {
            width: is_non_horizontal ? Infinity : width(),
            height: is_non_vertical ? Infinity : height(),
            containerHeight: is_non_vertical ? Infinity : containerHeight(),
        };
    }

    /**
     * The virtual panel writes preceding a render.
     */
    protected _update_virtual_panels(
        invalid: boolean,
        nrows: number,
        num_columns: number,
        preserve_width: boolean,
    ): void {
        this._update_virtual_panel_height(nrows);
        if (!preserve_width) {
            this._update_virtual_panel_width(invalid, num_columns);
        }
    }

    /**
     * The DOM writes following a render - the shared tail of both `draw()`
     * and `predraw()`'s commit.
     */
    protected _post_render(
        viewport: Viewport,
        nrows: number,
        num_columns: number,
        preserve_width: boolean,
        invalid: boolean,
    ): void {
        this._update_sub_cell_offset(viewport);

        const old_height = this._column_sizes.row_height;
        this.table_model.header.reset_header_cache();
        if (old_height !== this._column_sizes.row_height) {
            this._update_virtual_panel_height(nrows);
        }

        if (!preserve_width) {
            this._update_virtual_panel_width(invalid, num_columns);
        }
    }

    /**
     * Attempt to pre-calculate the exact column extent of the viewport from
     * cached column widths, without rendering. Returns the exclusive
     * `end_col`, or `undefined` if any column in the candidate extent has
     * never been measured, in which case the extent cannot be known without
     * rendering and `predraw()` must fall back to drawing inline.
     */
    private _plan_column_extent(
        viewport: Viewport,
        num_columns: number,
    ): number | undefined {
        if (
            this._virtual_mode === "none" ||
            this._virtual_mode === "vertical"
        ) {
            return viewport.end_col;
        }

        const { indices, override } = this._column_sizes;
        const effective_width = (size_key: number) =>
            override[size_key] ?? indices[size_key];

        const row_headers_length = this._view_cache.row_headers_length;
        let width = 0;
        for (let i = 0; i < row_headers_length; i++) {
            const w = effective_width(i);
            if (w === undefined) {
                return undefined;
            }

            width += w;
        }

        const start_col = Math.floor(viewport.start_col);
        const sub_cell_offset = indices[row_headers_length + start_col] ?? 0;
        let end_col = start_col;
        while (
            end_col < num_columns &&
            width - sub_cell_offset <= this._container_size.width
        ) {
            const w = effective_width(row_headers_length + end_col);
            if (w === undefined) {
                return undefined;
            }

            width += w;
            end_col++;
        }

        return end_col;
    }

    protected _autosize_fill_check(): void {
        if (
            this._start_col === undefined ||
            this._end_col === undefined ||
            !this._view_cache ||
            this._virtual_mode === "none" ||
            this._virtual_mode === "vertical" ||
            this._end_col >= (this._num_columns ?? 0)
        ) {
            return;
        }

        const { indices, override } = this._column_sizes;
        const row_headers_length = this._view_cache.row_headers_length;
        let width = 0;
        for (let i = 0; i < row_headers_length; i++) {
            width += indices[i] || 0;
        }

        for (let cidx = this._start_col; cidx < this._end_col; cidx++) {
            const size_key = row_headers_length + cidx;
            const w = override[size_key] ?? indices[size_key];
            if (w === undefined) {
                return;
            }

            width += w;
        }

        const sub_cell_offset = indices[row_headers_length + this._start_col];
        if (width - (sub_cell_offset ?? 0) <= this._container_size.width) {
            this.draw({ invalid_viewport: true });
        }
    }

    /**
     * Probe the shadow DOM to measure the default row height from CSS.
     */
    protected _probe_row_height() {
        if (!this._probe_element) {
            this._probe_element = [
                document.createElement("table"),
                document.createElement("td"),
            ];
            this._probe_element[0].style.visibility = "hidden";
            this._probe_element[0].style.position = "absolute";
            const tbody = document.createElement("tbody");
            const tr = document.createElement("tr");
            this._probe_element[1].textContent = "X";
            tr.appendChild(this._probe_element[1]);
            tbody.appendChild(tr);
            this._probe_element[0].appendChild(tbody);
        }

        this.appendChild(this._probe_element[0]);
        this._column_sizes.row_height = this._probe_element[1].offsetHeight;
        this._probe_element[0].remove();
    }

    /**
     * Create the DOM for this `shadowRoot`.
     */
    protected _create_shadow_dom() {
        this.attachShadow({ mode: "open" });
        if (!this.shadowRoot) {
            return;
        }

        const containerStyleSheet = new CSSStyleSheet();
        containerStyleSheet.replaceSync(container_css);
        const sub_cell_style = new CSSStyleSheet();
        sub_cell_style.replaceSync(sub_cell_offsets);
        this._sub_cell_rule = sub_cell_style.cssRules[0] as CSSStyleRule;
        this.shadowRoot.adoptedStyleSheets = [
            containerStyleSheet,
            sub_cell_style,
        ];

        this.shadowRoot.innerHTML = HTML_TEMPLATE;
        const [virtual_panel, table_clip] = this.shadowRoot!.children;
        this._table_clip = table_clip as HTMLElement;
        this._virtual_panel = virtual_panel as HTMLElement;
        this._setup_virtual_scroll();
    }

    protected _setup_virtual_scroll() {
        if (this._table_clip) {
            if (
                this._virtual_mode === "both" ||
                this._virtual_mode === "vertical"
            ) {
                this._table_clip.style.top = "0px";
            } else {
                this._table_clip.style.removeProperty("top");
            }

            if (
                this._virtual_mode === "both" ||
                this._virtual_mode === "horizontal"
            ) {
                this._table_clip.style.left = "0px";
            } else {
                this._table_clip.style.removeProperty("left");
            }

            if (this._virtual_mode !== "both") {
                this._table_clip.style.contain = "none";
            } else {
                this._table_clip.style.removeProperty("contain");
            }
        }
    }

    /**
     * Calculates the `viewport` argument for perspective's `to_columns` method.
     *
     * @param {*} nrows
     * @returns
     */
    protected _calculate_viewport(
        nrows: number,
        num_columns: number,
        scroll_top: number,
        scroll_left: number,
    ): Viewport {
        const { start_row, end_row } = this._calculate_row_range(
            nrows,
            scroll_top,
        );
        const { start_col, end_col } = this._calculate_column_range(
            num_columns,
            scroll_left,
        );

        return { start_col, end_col, start_row, end_row };
    }

    /**
     * Determines whether the viewport is identical in row and column axes to
     * the previous viewport rendered, for throttling identical render requests,
     * e.g. when the logical (row-wise) viewport does not change, but the pixel
     * viewport has moved a few px.
     *
     * @param {*} {start_col, end_col, start_row, end_row}
     * @returns
     */
    protected _validate_viewport({
        start_col,
        end_col,
        start_row,
        end_row,
    }: Viewport): ViewportValidation {
        start_row = Math.floor(start_row);
        end_row = Math.ceil(end_row);
        start_col = Math.floor(start_col);
        end_col = Math.ceil(end_col);
        const invalid_column = this._start_col !== start_col;
        const invalid_row =
            this._start_row !== start_row ||
            this._end_row !== end_row ||
            this._end_col !== end_col;
        return { invalid_column, invalid_row };
    }

    /**
     * Records the viewport most recently applied to the DOM, against which
     * `_validate_viewport` compares. Split from `_validate_viewport` so that
     * `predraw()` can validate speculatively without recording until its
     * commit closure actually runs.
     */
    protected _commit_viewport({
        start_col,
        end_col,
        start_row,
        end_row,
    }: Viewport): void {
        this._start_col = Math.floor(start_col);
        this._end_col = Math.ceil(end_col);
        this._start_row = Math.floor(start_row);
        this._end_row = Math.ceil(end_row);
    }

    /**
     * Updates the `virtual_panel` width based on view state.
     *
     * @param {*} invalid
     */
    protected _update_virtual_panel_width(
        invalid: boolean,
        num_columns: number,
    ): void {
        if (invalid) {
            if (
                this._virtual_mode === "vertical" ||
                this._virtual_mode === "none"
            ) {
                let totalWidth = 0;
                for (const w of this._column_sizes.indices) {
                    totalWidth += w || 0;
                }

                this._virtual_panel.style.width =
                    totalWidth.toPrecision(10) + "px";
            } else {
                const virtual_width =
                    this._calc_scrollable_column_width(num_columns);

                if (virtual_width !== 0) {
                    const panel_width =
                        this._container_size.width + virtual_width + 2;
                    this._virtual_panel.style.width =
                        panel_width.toPrecision(10) + "px";
                } else {
                    this._virtual_panel.style.width = "1px";
                }
            }
        }
    }

    /**
     * Updates the `virtual_panel` height based on the view state.
     *
     * @param {*} nrows
     */
    protected _update_virtual_panel_height(nrows: number): void {
        const virtual_panel_px_size = this._virtual_panel_height(nrows);
        this._virtual_panel.style.height = `${virtual_panel_px_size.toPrecision(10)}px`;
    }

    /**
     * The px height `_update_virtual_panel_height` sets (or will set) on the
     * virtual panel. Computing this directly rather than reading
     * `_virtual_panel.offsetHeight` back avoids a forced layout in the draw
     * path, and lets `predraw()` calculate row ranges without any DOM reads.
     */
    protected _virtual_panel_height(nrows: number): number {
        const { row_height = 0 } = this._column_sizes;
        const header_height =
            this._view_cache.column_headers_length * row_height;
        return Math.min(BROWSER_MAX_HEIGHT, nrows * row_height + header_height);
    }

    /**
     * Update sub-cell offset CSS.
     *
     * @param viewport
     */
    protected _update_sub_cell_offset(viewport: Viewport): void {
        const y_offset =
            (this._column_sizes.row_height || 0) * (viewport.start_row % 1) ||
            0;

        const x_offset_index =
            (this.table_model._row_headers_length || 0) +
            Math.floor(viewport.start_col);

        const x_offset =
            (this._column_sizes.indices[x_offset_index] ??
                this.table_model._estimated_column_width()) *
                (viewport.start_col % 1) || 0;

        this._sub_cell_rule.style.setProperty(CLIP_X, `${x_offset}px`);
        this._sub_cell_rule.style.setProperty(CLIP_Y, `${y_offset}px`);
        this._sub_cell_rule.style.setProperty(TRANSFORM_X, `${-x_offset}px`);
        this._sub_cell_rule.style.setProperty(TRANSFORM_Y, `${-y_offset}px`);
    }

    /**
     * Calculates `start_col` and `end_col` for the viewport - most of the
     * details of which are actually calculated in `_max_column`, the equivalent
     * of `total_scroll_height` from `_calculate_row_range`.
     *
     * @returns
     */
    protected _calculate_column_range(
        num_columns: number,
        scroll_left: number,
    ): {
        start_col: number;
        end_col: number;
    } {
        if (
            this._virtual_mode === "none" ||
            this._virtual_mode === "vertical"
        ) {
            return { start_col: 0, end_col: Infinity };
        } else {
            const start_col = this._calc_start_column(scroll_left);
            const vis_cols =
                this.table_model.num_columns() ||
                Math.min(
                    num_columns,
                    Math.ceil(this._container_size.width / 60),
                );
            let end_col = start_col + vis_cols + 1;
            return { start_col, end_col };
        }
    }

    /**
     * Calculate `start_row` and `end_row` for the viewport.  We do this by
     * first calculating `total_scroll_height`, the px height of the
     * scrollable page, from the `_virtual_panel.offsetHeight`.
     *
     *    0px +------------+-------------+  - virtual_panel.offsetHeight
     *        |            |  .          |  . 600px
     *        |  viewport  |  .          |  .
     *        |            |  .          |  .
     *  200px +------------+  - height   |  .  - total_scroll_height
     *        |                 200px    |  .  . 400px
     *        |                          |  .  .
     *        |                          |  .  .
     *        |                          |  .  .
     *        |                          |  .  .
     *  600px +--------------------------+  -  -
     *
     *  `percent_scroll` can be calculated from this value and `scrollTop`,
     *  which we can then apply to the new calculated height to preserve scroll
     *  position when the height has changed since previous render.
     *
     *    0px +--------------------------+  -
     *        |                          |  .
     *        |                          |  .
     *        |                          |  . scrollable area
     *  300px +------------+             |  .
     *        |            |             |  .
     *  - - - |  viewport  | - - - - - - |  - total_scroll_height
     *        |            |             |    400px
     *  500px +------------+             |
     *        |                          |
     *  600px +--------------------------+
     *
     * @param {*} nrows
     * @returns
     */
    private _calculate_row_range(
        nrows: number,
        scroll_top: number,
    ): {
        start_row: number;
        end_row: number;
    } {
        const { height, containerHeight } = this._container_size;
        const row_height = this._column_sizes.row_height || 0;
        const header_levels = this._view_cache.column_headers_length;
        const panel_height = Math.round(this._virtual_panel_height(nrows));
        const total_scroll_height = Math.max(1, panel_height - containerHeight);

        const percent_scroll =
            Math.max(Math.ceil(scroll_top), 0) / total_scroll_height;

        const clip_panel_row_height = height / row_height - header_levels;
        const relative_nrows = nrows || 0;
        const scrollable_rows = Math.max(
            0,
            relative_nrows - clip_panel_row_height,
        );
        const start_row = scrollable_rows * percent_scroll;
        const end_row = Math.max(
            0,
            Math.min(start_row + clip_panel_row_height, nrows),
        );
        return { start_row, end_row };
    }

    private _calc_start_column(scroll_left: number): number {
        const scroll_index_offset = this._view_cache.row_headers_length;
        let start_col = 0;
        let offset_width = 0;
        let diff = 0;
        while (offset_width < scroll_left) {
            const new_val =
                this._column_sizes.indices[start_col + scroll_index_offset];
            diff = scroll_left - offset_width;
            start_col += 1;
            offset_width += new_val !== undefined ? new_val : 60;
        }

        start_col +=
            diff /
            (this._column_sizes.indices[start_col + scroll_index_offset - 1] ||
                60);

        return Math.max(0, start_col - 1);
    }

    /**
     * Calculates the minimum possible starting column index for which the last
     * column is completely visible (e.g. not occluded by the container clip).
     * This is assumed to be the # of columns until the column widths are
     * calculated as they are scrolled into view by the user, which requires
     * special synchronization with _update_virtual_panel_width`
     * as the scrollable width will change as the user scrolls left to right.
     *
     * Once `_column_sizes.indices` has enough column widths populated from
     * user scrolling, it calulates the cumulative sum of column widths from
     * last visible column backwards, until the sum is larger than the viewport
     * px width, which is 1 below the max scroll column
     *
     *               width = 290   = 210     = 100    = 0
     *   0px               V       V         V        500px
     *   +-----------------+-------+---------+--------+
     *   | ..ol B) (Col C) | Col D | Col E   | Col F  |
     *   |                 | 80px  | 110px   | 100px  |
     *   |                 |       |         |        |
     *
     * @returns
     */
    private _max_scroll_column(num_columns: number): number {
        let width = 0;
        if (this._view_cache.row_headers_length > 0) {
            for (const w of this._column_sizes.indices.slice(
                0,
                this._view_cache.row_headers_length,
            )) {
                width += w || 0;
            }
        }

        let scroll_index_offset = this._view_cache.row_headers_length;
        let max_scroll_column = num_columns;
        while (width < this._container_size.width && max_scroll_column >= 0) {
            max_scroll_column--;
            width +=
                this._column_sizes.indices[
                    max_scroll_column + scroll_index_offset
                ] || 60;
        }

        return Math.min(num_columns - 1, max_scroll_column + 1);
    }

    private _calc_scrollable_column_width(num_columns: number): number {
        let scroll_index_offset = this._view_cache.row_headers_length;
        const max_scroll_column = this._max_scroll_column(num_columns);
        let cidx = scroll_index_offset,
            virtual_width = 0;

        while (cidx < max_scroll_column + scroll_index_offset) {
            virtual_width += this._column_sizes.indices[cidx] || 60;
            cidx++;
        }

        if (cidx < this._column_sizes.indices.length) {
            let viewport_width = 0;
            const rhLen = this._view_cache.row_headers_length;
            for (
                let i = 0;
                i < rhLen && i < this._column_sizes.indices.length;
                i++
            ) {
                viewport_width += this._column_sizes.indices[i] || 0;
            }
            virtual_width += Math.max(
                0,
                (this._column_sizes.indices[cidx] || 0) -
                    (this._container_size.width - (viewport_width || 0)) || 0,
            );
        }

        return virtual_width;
    }
}

async function internal_draw(
    this: RegularVirtualTableViewModel,
    options: DrawOptions,
): Promise<void> {
    const __debug_start_time__ = DEBUG && performance.now();
    const { invalid_viewport = true, preserve_width = false } = options;
    const { num_columns, num_rows } = await this._update_dim_state(
        options.cache,
    );

    if (!this._column_sizes.row_height) {
        this._probe_row_height();
    }

    const safe_num_rows = num_rows || 0;
    const safe_num_columns = num_columns || 0;
    this._container_size = this._resolve_container_size(
        () => this._table_clip.clientWidth,
        () => this._table_clip.clientHeight,
        () => this.clientHeight,
    );

    this._update_virtual_panels(
        invalid_viewport,
        safe_num_rows,
        safe_num_columns,
        preserve_width,
    );

    // Scroll positions are read after the virtual panel writes above, as the
    // browser may clamp them when the panel shrinks.
    const viewport = this._calculate_viewport(
        safe_num_rows,
        safe_num_columns,
        this.scrollTop,
        this.scrollLeft,
    );

    const { invalid_row, invalid_column } = this._validate_viewport(viewport);
    this._commit_viewport(viewport);
    const invalid_schema_or_column = this._invalid_schema || invalid_column;
    if (invalid_schema_or_column || invalid_row || invalid_viewport) {
        let first_iteration = true;
        await this.table_model.draw(
            this._container_size,
            this._view_cache,
            this._selected_id,
            preserve_width,
            viewport,
            safe_num_columns,
            async () => {
                // We want to perform this before the next event loop so there
                // is no scroll jitter, but only on the first iteration as
                // subsequent viewports are incorrect.
                if (first_iteration) {
                    this._update_sub_cell_offset(viewport);
                    first_iteration = false;
                }

                for (const callback of this._style_callbacks) {
                    await callback({ detail: this as RegularTableElement });
                }
            },
        );

        this._post_render(
            viewport,
            safe_num_rows,
            safe_num_columns,
            preserve_width,
            invalid_schema_or_column,
        );

        this._invalid_schema = false;
    } else {
        this._update_sub_cell_offset(viewport);
    }

    if (DEBUG) {
        log_perf(performance.now() - __debug_start_time__);
    }
}
