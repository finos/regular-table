/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {METADATA_MAP} from "./constants";
import {RegularTableViewModel} from "./table";
import {RegularViewEventModel} from "./events";
import {get_draw_fps} from "./utils";

/**
 * The `<regular-table>` custom element.
 *
 * This module has no exports, but importing it has a side effect: the
 * `RegularTableElement` class is registered as a custom element, after which
 * it can be used as a standard DOM element.
 *
 * The documentation in this module defines the instance structure of a
 * `<regular-table>` DOM object instantiated typically, through HTML or any
 * relevent DOM method e.g. `document.createElement("perspective-viewer")` or
 * `document.getElementsByTagName("perspective-viewer")`.
 *
 * @extends HTMLElement
 */
class RegularTableElement extends RegularViewEventModel {
    connectedCallback() {
        this.create_shadow_dom();
        this.register_listeners();
        this.setAttribute("tabindex", "0");
        this._column_sizes = {auto: {}, override: {}, indices: []};
        this._style_callbacks = new Map();
        this.table_model = new RegularTableViewModel(this._table_clip, this._column_sizes, this._sticky_container);
        if (!this.table_model) return;
        if (this !== this._sticky_container.parentElement) {
            this.appendChild(this._sticky_container);
        }
    }

    get_tds() {
        return this.table_model.body.cells.flat(1);
    }

    get_ths() {
        return this.table_model.header.cells.flat(1);
    }

    clear() {
        this._sticky_container.innerHTML = "<table></table>";
    }

    reset_viewport() {
        this._start_row = undefined;
        this._end_row = undefined;
        this._start_col = undefined;
        this._end_col = undefined;
    }

    reset_scroll() {
        this._column_sizes.indices = [];
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.reset_viewport();
    }

    addStyleListener(styleListener) {
        const key = this._style_callbacks.size;
        this._style_callbacks.set(key, styleListener);
        return key;
    }

    /**
     * Returns the `MetaData` object associated with a `<td>` or `<th>`.  When
     * your `StyleListener` is invoked, use this method to look up additional
     * `MetaData` about any `HTMLTableCellElement` in the rendered `<table>`.
     *
     * @param {HTMLTableCellElement|MetaData} element - The child element
     * of this `<regular-table>` for which to look up metadata, or a
     * coordinates-like object to refer to metadata by logical position.
     * @returns {MetaData} The metadata associated with the element.
     * @example
     * const elems = document.querySelector("td:last-child td:last_child");
     * const metadata = table.getMeta(elems);
     * console.log(`Viewport corner is ${metadata.x}, ${metadata.y}`);
     * @example
     * const header = table.getMeta({row_header_x: 1, dy: 3}).row_header;
     */
    getMeta(element) {
        if (element instanceof HTMLElement) {
            return METADATA_MAP.get(element);
        } else if (element.row_header_x >= 0) {
            const is_valid = element.row_header_x < this._view_cache.config.row_pivots.length;
            return is_valid && this.table_model.body.cells[element.dy]?.[element.row_header_x];
        } else if (element.column_header_y >= 0) {
            const is_valid = element.column_header_y < this._view_cache.config.column_pivots.length;
            return is_valid && this.table_model.body.cells[element.column_header_y]?.[element.dy];
        } else {
            return this.table_model.body.cells[element.dy]?.[element.dx];
        }
    }

    /**
     * Get performance statistics about this `<regular-table>`.  Calling this
     * method resets the internal state, which makes it convenient to measure
     * performance at regular intervals (see example).
     *
     * @memberof RegularTableElement
     * @returns {Performance} Performance data aggregated since the last
     * call to `getDrawFPS()`.
     * @example
     * const table = document.getElementById("my_regular_table");
     * setInterval(() => {
     *     const {real_fps} = table.getDrawFPS();
     *     console.log(`Measured ${fps} fps`)
     * });
     */
    getDrawFPS() {
        return get_draw_fps();
    }

    /**
     * Call this method to set the `scrollLeft` and `scrollTop` for this
     * `<regular-table>` by calculating the position of this `scrollLeft`
     * and `scrollTop` relative to the underlying widths of its columns
     * and heights of its rows.
     * @memberof RegularTableElement
     * @param {number} x - The left most `x` index column to scroll into view.
     * @param {number} y - The top most `y` index row to scroll into view.
     * @param {number} ncols - Total number of columns in the data model.
     * @param {number} nrows - Total number of rows in the data model.
     * @example
     * table.scrollTo(1, 3, 10, 30);
     */
    scrollTo(x, y, ncols, nrows) {
        const row_height = this._virtual_panel.offsetHeight / nrows;
        this.scrollTop = row_height * y;
        this.scrollLeft = (x / (this._max_scroll_column(ncols) || ncols)) * (this.scrollWidth - this.clientWidth);
    }

    /**
     * Call this method to set `DataListener` for this `<regular-table>`,
     * which will be called whenever a new data slice is needed to render.
     * Calls to `draw()` will fail if no `DataListener` has been set
     *
     * @memberof RegularTableElement
     * @param {DataListener} dataListener
     * `dataListener` is called by to request a rectangular section of data
     * for a virtual viewport, (x0, y0, x1, y1), and returns a `DataReponse`
     * object.
     * @example
     * table.setDataListener((x0, y0, x1, y1) => {
     *     return {
     *         num_rows: num_rows = DATA[0].length,
     *         num_columns: DATA.length,
     *         data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
     *     };
     * })
     */
    setDataListener(dataListener) {
        let schema = {};
        let config = {
            row_pivots: [],
            column_pivots: [],
        };

        this._invalid_schema = true;
        this._view_cache = {view: dataListener, config, schema};
    }
}

window.customElements.define("regular-table", RegularTableElement);

/**
 * An object with performance statistics about calls to
 * `draw()` from some time interval (captured in milliseconds by the
 * `elapsed` proprty).
 *
 * @typedef Performance
 * @type {object}
 * @property {number} avg - Avergage milliseconds per call.
 * @property {number} real_fps - `num_frames` / `elapsed`
 * @property {number} virtual_fps - `elapsed` / `avg`
 * @property {number} num_frames - Number of frames rendered.
 * @property {number} elapsed - Number of milliseconds since last call
 * to `getDrawFPS()`.
 */

/**
 * An object describing virtual rendering metadata about an
 * `HTMLTableCellElement`, use this object to map rendered `<th>` or `<td>`
 * elements back to your `data`, `row_headers` or `column_headers` within
 * listener functions for `addStyleListener()` and `addEventListener()`.
 *
 * @typedef MetaData
 * @type {object}
 * @property {number} [x] - The `x` index in your virtual data model.
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [y] - The `y` index in your virtual data model.
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [x0] - The `x` index of the viewport origin in
 * your data model, e.g. what was passed to `x0` when your
 * `dataListener` was invoked.
 * @property {number} [y0] - The `y` index of the viewport origin in
 * your data model, e.g. what was passed to `x0` when your
 * `dataListener` was invoked.
 * @property {number} [dx] - The `x` index in `DataResponse.data`, this
 * property is only generated for `<td>`, and `<th>` from `column_headers`.
 * @property {number} [dy] - The `y` index in `DataResponse.data`, this
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [column_header_y] - The `y` index in
 * `DataResponse.column_headers[x]`, this property is only generated for `<th>`
 * from `column_headers`.
 * @property {number} [column_header_x] - The `x` index in
 * `DataResponse.row_headers[y]`, this property is only generated for `<th>`
 * from `row_headers`.
 * @property {number} size_key - The unique index of this column in a full
 * `<table>`, which is `x` + (Total Row Header Columns).
 * @property {Array<object>} [row_header] - The `Array` for this `y` in
 * `DataResponse.row_headers`, if it was provided.
 * @property {Array<object>} [column_header] - The `Array` for this `x` in
 * `DataResponse.column_headers`, if it was provided.
 */

/**
 * The `DataResponse` object describes a rectangular region of a virtual
 * data set, and some associated metadata.  `<regular-table>` will use this
 * object to render the `<table>`, though it may make multiple requests for
 * different regions to achieve a compelte render as it must estimate
 * certain dimensions.  You must construct a `DataResponse` object to
 * implement a `DataListener`.
 *
 * @typedef DataResponse
 * @type {object}
 * @property {Array<Array<object>>} [column_headers] - A two dimensional
 * `Array` of column group headers, in specificity order.  No `<thead>`
 * will be generated if this property is not provided.
 * @property {Array<Array<object>>} [row_headers] - A two dimensional
 * `Array` of row group headers, in specificity order.  No `<th>`
 * elements within `<tbody>` will be generated if this property is not
 * provided.
 * @property {Array<Array<object>>} data - A two dimensional `Array`
 * representing a rectangular section of the underlying data set from
 * (x0, y0) to (x1, y1), arranged in columnar fashion such that
 * `data[x][y]` returns the `y`th row of the `x`th column of the slice.
 * @property {number} num_rows - Total number of rows in the underlying
 * data set.
 * @property {number} num_columns - Total number of columns in the
 * underlying data set.
 * @example
 * {
 *     "num_rows": 26,
 *     "num_columns": 3,
 *     "data": [
 *         [0, 1],
 *         ["A", "B"]
 *     ],
 *     "row_headers": [
 *         ["Rowgroup 1", "Row 1"],
 *         ["Rowgroup 1", "Row 2"]
 *     ],
 *     "column_headers": [
 *         ["Colgroup 1", "Column 1"],
 *         ["Colgroup 1", "Column 2"]
 *     ]
 * }
 */

/**
 * The `DataListener` is similar to a normal event listener function.
 * Unlike a normal event listener, it takes regular arguments (not an
 * `Event`); and returns a `Promise` for a `DataResponse` object for this
 * region (as opposed to returning `void` as a standard event listener).
 *
 * @typedef DataListener
 * @type {function}
 * @param {number} x0 - The origin `x` index (column).
 * @param {number} y0 - The origin `y` index (row).
 * @param {number} x1 - The corner `x` index (column).
 * @param {number} y1 - The corner `y` index (row).
 * @returns {Promise<DataResponse>} The resulting `DataResponse`.  Make sure
 * to `resolve` or `reject` the `Promise`, or your `<regular-table>` will
 * never render!
 */
