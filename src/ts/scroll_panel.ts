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
    CellTuple,
    ColumnSizes,
    StyleCallback,
    ContainerSize,
    DrawOptions,
    ViewCache,
    Viewport,
    ViewportValidation,
    VirtualMode,
} from "./types";

// @ts-ignore - CSS imports handled by build system
import container_css from "../../dist/css/container.css";

// @ts-ignore - CSS imports handled by build system
import sub_cell_offsets from "../../dist/css/sub-cell-offsets.css";

const CSS_TEMPLATE = (x_offset: number, y_offset: number) => `:host {
--regular-table--clip-x:${x_offset}px;
--regular-table--clip-y:${y_offset}px;
--regular-table--transform-x:${0 - x_offset}px;
--regular-table--transform-y:${0 - y_offset}px;
}`;

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
    private _sub_cell_style!: CSSStyleSheet;
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

    /**
     * Create the DOM for this `shadowRoot`.
     */
    create_shadow_dom() {
        this.attachShadow({ mode: "open" });
        if (!this.shadowRoot) {
            return;
        }

        const containerStyleSheet = new CSSStyleSheet();
        containerStyleSheet.replaceSync(container_css);
        this._sub_cell_style = new CSSStyleSheet();
        this._sub_cell_style.replaceSync(sub_cell_offsets);

        this.shadowRoot.adoptedStyleSheets = [
            containerStyleSheet,
            this._sub_cell_style,
        ];

        const slot = `<slot></slot>`;
        this.shadowRoot.innerHTML = `
            <div class="rt-virtual-panel"></div>
            <div class="rt-scroll-table-clip">${slot}</div>
        `;

        const [virtual_panel, table_clip] = this.shadowRoot!.children;
        this._table_clip = table_clip as HTMLElement;
        this._virtual_panel = virtual_panel as HTMLElement;
        this._setup_virtual_scroll();
    }

    _setup_virtual_scroll() {
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
    _calculate_viewport(nrows: number, num_columns: number): Viewport {
        const { start_row, end_row } = this._calculate_row_range(nrows);
        const { start_col, end_col } =
            this._calculate_column_range(num_columns);

        return { start_col, end_col, start_row, end_row };
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
    _calculate_row_range(nrows: number): {
        start_row: number;
        end_row: number;
    } {
        const { height, containerHeight } = this._container_size;
        const row_height = this._column_sizes.row_height || 19;
        const header_levels = this._view_cache.column_headers_length;
        const total_scroll_height = Math.max(
            1,
            this._virtual_panel.offsetHeight - containerHeight,
        );

        const percent_scroll =
            Math.max(Math.ceil(this.scrollTop), 0) / total_scroll_height;

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

    _calc_start_column(): number {
        const scroll_index_offset = this._view_cache.row_headers_length;
        let start_col = 0;
        let offset_width = 0;
        let diff = 0;
        while (offset_width < this.scrollLeft) {
            const new_val =
                this._column_sizes.indices[start_col + scroll_index_offset];
            diff = this.scrollLeft - offset_width;
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
     * Calculates `start_col` and `end_col` for the viewport - most of the
     * details of which are actually calculated in `_max_column`, the equivalent
     * of `total_scroll_height` from `_calculate_row_range`.
     *
     * @returns
     */
    _calculate_column_range(num_columns: number): {
        start_col: number;
        end_col: number;
    } {
        if (
            this._virtual_mode === "none" ||
            this._virtual_mode === "vertical"
        ) {
            return { start_col: 0, end_col: Infinity };
        } else {
            const start_col = this._calc_start_column();
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
    _max_scroll_column(num_columns: number): number {
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

    /**
     * Determines whether the viewport is identical in row and column axes to
     * the previous viewport rendered, for throttling identical render requests,
     * e.g. when the logical (row-wise) viewport does not change, but the pixel
     * viewport has moved a few px.
     *
     * @param {*} {start_col, end_col, start_row, end_row}
     * @returns
     */
    _validate_viewport({
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
        this._start_col = start_col;
        this._end_col = end_col;
        this._start_row = start_row;
        this._end_row = end_row;
        return { invalid_column, invalid_row };
    }

    _calc_scrollable_column_width(num_columns: number): number {
        let scroll_index_offset = this._view_cache.row_headers_length;
        const max_scroll_column = this._max_scroll_column(num_columns);
        let cidx = scroll_index_offset,
            virtual_width = 0;

        while (cidx < max_scroll_column + scroll_index_offset) {
            virtual_width += this._column_sizes.indices[cidx] || 60;
            cidx++;
        }

        if (cidx < this._column_sizes.indices.length) {
            let viewport_width = this._column_sizes.indices
                .slice(0, this._view_cache.row_headers_length)
                .reduce((x, y) => (x || 0) + (y || 0), 0);
            virtual_width += Math.max(
                0,
                (this._column_sizes.indices[cidx] || 0) -
                    (this._container_size.width - (viewport_width || 0)) || 0,
            );
        }

        return virtual_width;
    }

    /**
     * Updates the `virtual_panel` width based on view state.
     *
     * @param {*} invalid
     */
    _update_virtual_panel_width(invalid: boolean, num_columns: number): void {
        if (invalid) {
            if (
                this._virtual_mode === "vertical" ||
                this._virtual_mode === "none"
            ) {
                this._virtual_panel.style.width =
                    this._column_sizes.indices.reduce(
                        (x, y) => (x || 0) + (y || 0),
                        0,
                    ) + "px";
            } else {
                const virtual_width =
                    this._calc_scrollable_column_width(num_columns);
                if (virtual_width !== 0) {
                    const panel_width =
                        this._container_size.width + virtual_width + 2;
                    this._virtual_panel.style.width = panel_width + "px";
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
    _update_virtual_panel_height(nrows: number): void {
        const { row_height = 19 } = this._column_sizes;
        const header_height =
            this._view_cache.column_headers_length * row_height;
        let virtual_panel_px_size;
        virtual_panel_px_size = Math.min(
            BROWSER_MAX_HEIGHT,
            nrows * row_height + header_height,
        );
        this._virtual_panel.style.height = `${virtual_panel_px_size}px`;
    }

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

    async flush(): Promise<void> {
        await flush_tag(this);
    }

    update_sub_cell_offset(viewport: Viewport): void {
        const y_offset =
            (this._column_sizes.row_height || 20) * (viewport.start_row % 1) ||
            0;

        const x_offset =
            (this._column_sizes.indices[
                (this.table_model._row_headers_length || 0) +
                    Math.floor(viewport.start_col)
            ] || 0) *
                (viewport.start_col % 1) || 0;

        const cssText = CSS_TEMPLATE(x_offset, y_offset);
        this._sub_cell_style.replaceSync(cssText);
    }
}

async function internal_draw(
    this: RegularVirtualTableViewModel,
    options: DrawOptions,
): Promise<void> {
    const __debug_start_time__ = DEBUG && performance.now();
    const { invalid_viewport = true, preserve_width = false } = options;
    const {
        num_columns,
        num_rows,
        num_row_headers,
        num_column_headers,
        row_height,
    } = await this._view_cache.view(0, 0, 0, 0);
    this._column_sizes.row_height = row_height || this._column_sizes.row_height;
    if (num_row_headers !== undefined) {
        this._view_cache.row_headers_length = num_row_headers;
    }

    if (num_column_headers !== undefined) {
        this._view_cache.column_headers_length = num_column_headers;
    }

    // Cache virtual mode checks and default values
    const is_non_vertical =
        this._virtual_mode === "none" || this._virtual_mode === "horizontal";
    const is_non_horizontal =
        this._virtual_mode === "none" || this._virtual_mode === "vertical";
    const safe_num_rows = num_rows || 0;
    const safe_num_columns = num_columns || 0;
    this._container_size = {
        width: is_non_horizontal ? Infinity : this._table_clip.clientWidth,
        height: is_non_vertical ? Infinity : this._table_clip.clientHeight,
        containerHeight: is_non_vertical ? Infinity : this.clientHeight,
    };

    this._update_virtual_panel_height(safe_num_rows);
    if (!preserve_width) {
        this._update_virtual_panel_width(invalid_viewport, safe_num_columns);
    }

    const viewport = this._calculate_viewport(safe_num_rows, safe_num_columns);
    // this.table_model.clearWidthStyles();
    this.table_model.updateColumnWidthStyles(
        viewport,
        this._view_cache.row_headers_length,
    );

    const { invalid_row, invalid_column } = this._validate_viewport(viewport);
    const invalid_schema_or_column = this._invalid_schema || invalid_column;
    if (invalid_schema_or_column || invalid_row || invalid_viewport) {
        let autosize_cells: CellTuple[] = [];
        let first_iteration = true;
        for await (let last_cells of this.table_model.draw(
            this._container_size,
            this._view_cache,
            this._selected_id,
            preserve_width,
            viewport,
            safe_num_columns,
        )) {
            if (last_cells !== undefined) {
                autosize_cells.push(...last_cells);
            }

            // We want to perform this before the next event loop so there
            // is no scroll jitter, but only on the first iteration as
            // subsequent viewports are incorrect.
            if (first_iteration) {
                this.update_sub_cell_offset(viewport);
                first_iteration = false;
            }

            this._is_styling = true;
            const callbacks = this._style_callbacks;
            for (const callback of callbacks) {
                await callback({ detail: this as RegularTableElement });
            }

            this._is_styling = false;
            if (!this._invalidated && last_cells !== undefined) {
                break;
            }

            this._invalidated = false;
        }

        const old_height = this._column_sizes.row_height;
        this.table_model.autosize_cells(autosize_cells, row_height);
        this.table_model.header.reset_header_cache();
        if (old_height !== this._column_sizes.row_height) {
            this._update_virtual_panel_height(safe_num_rows);
        }

        if (!preserve_width) {
            this._update_virtual_panel_width(
                invalid_schema_or_column,
                safe_num_columns,
            );
        }

        this._invalid_schema = false;
    } else {
        this.update_sub_cell_offset(viewport);
    }

    if (DEBUG) {
        log_perf(performance.now() - __debug_start_time__);
    }
}
