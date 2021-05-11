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
import {RegularViewEventModel} from "./events";
import {RegularTableViewModel} from "./table";
import {get_draw_fps} from "./utils";

const VIRTUAL_MODES = ["both", "horizontal", "vertical", "none"];

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
 * @public
 * @extends HTMLElement
 */
class RegularTableElement extends RegularViewEventModel {
    /**
     * For internal use by the Custom Elements API: "Invoked each time the
     * custom element is appended into a document-connected element".
     * Ref: https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     *
     * @internal
     * @private
     * @memberof RegularTableElement
     */
    connectedCallback() {
        if (!this._initialized) {
            this.create_shadow_dom();
            this.register_listeners();
            this.setAttribute("tabindex", "0");

            /** @private */
            this._column_sizes = {auto: {}, override: {}, indices: []};
            /** @private */
            this._initialized = true;
            /** @private */
            this._style_callbacks = [];
            /** @public @type {TableModel} */
            this.table_model = new RegularTableViewModel(this._table_clip, this._column_sizes, this);
        }
    }

    /**
     * Reset the viewport of this regular table.
     *
     * @internal
     * @private
     * @memberof RegularTableElement
     */
    _reset_viewport() {
        /** @private @type {number} */
        this._start_row = undefined;
        /** @private @type {number} */
        this._end_row = undefined;
        /** @private @type {number} */
        this._start_col = undefined;
        /** @private @type {number} */
        this._end_col = undefined;
    }

    /**
     * Reset the scroll position of this regular table back to the origin.
     *
     * @internal
     * @private
     * @memberof RegularTableElement
     */
    _reset_scroll() {
        this._column_sizes.indices = [];
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this._reset_viewport();
    }

    /**
     * Reset column autosizing, such that column sizes will be recalculated
     * on the next draw() call.
     *
     * @internal
     * @protected
     * @memberof RegularTableElement
     */
    _resetAutoSize() {
        this._column_sizes.auto = {};
        this._column_sizes.override = {};
        this._column_sizes.indices = [];

        for (let i = 0; i < this.table_model.header.num_columns(); i++) {
            const th = this.table_model.header.get_column_header(i);
            th.style.minWidth = "";
            th.style.maxWidth = "";
        }
    }

    /**
     * Clears the current renderer `<table>`.
     *
     * @public
     * @memberof RegularTableElement
     */
    clear() {
        this.table_model = new RegularTableViewModel(this._table_clip, this._column_sizes, this);
    }

    /**
     * Adds a style listener callback. The style listeners are called
     * whenever the <table> is re-rendered, such as through API invocations
     * of draw() and user-initiated events such as scrolling. Within this
     * optionally async callback, you can select <td>, <th>, etc. elements
     * via regular DOM API methods like querySelectorAll().
     *
     * Example:
     * const unsubscribe = table.addStyleListener(() => {
     *     for (const td of table.querySelectorAll("td")) {
     *         td.setAttribute("contenteditable", true);
     *     }
     * });
     *
     * setTimeout(() => {
     *     unsubscribe();
     * }, 1000);
     * @public
     * @memberof RegularTableElement
     * @param {function({detail: RegularTableElement}): void} styleListener - A
     * (possibly async) function that styles the inner <table>.
     * @returns {function(): void} A function to remove this style listener.
     */
    addStyleListener(styleListener) {
        this._style_callbacks = this._style_callbacks.concat(styleListener);

        let isSubscribed = true;

        const unsubscribe = () => {
            if (!isSubscribed) {
                return;
            }
            isSubscribed = false;

            const callbacks = (this._style_callbacks = this._style_callbacks.slice());
            const index = callbacks.indexOf(styleListener);
            callbacks.splice(index, 1);
        };
        return unsubscribe;
    }

    /**
     * When called within the execution scope of a function registered to this
     * `<regular-table>` as a `StyleListener`, invalidate this draw's
     * dimensions and attempt to draw more columns.  Useful if your
     * `StyleListener` changes a cells dimensions, otherwise `<regular-table>`
     * may not draw enough columns to fill the screen.
     *
     * @public
     * @memberof RegularTableElement
     */
    invalidate() {
        if (!this._is_styling) {
            throw new Error("Cannot call `invalidate()` outside of a `StyleListener`");
        }
        /** @private */
        this._invalidated = true;
    }

    /**
     * Returns the `MetaData` object associated with a `<td>` or `<th>`.  When
     * your `StyleListener` is invoked, use this method to look up additional
     * `MetaData` about any `HTMLTableCellElement` in the rendered `<table>`.
     *
     * Example:
     * const elems = document.querySelector("td:last-child td:last_child");
     * const metadata = table.getMeta(elems);
     * console.log(`Viewport corner is ${metadata.x}, ${metadata.y}`);
     *
     * const header = table.getMeta({row_header_x: 1, y: 3}).row_header;
     * @public
     * @memberof RegularTableElement
     * @param {HTMLTableCellElement|Partial<MetaData>} element - The child element
     * of this `<regular-table>` for which to look up metadata, or a
     * coordinates-like object to refer to metadata by logical position.
     * @returns {MetaData} The metadata associated with the element.
     */
    getMeta(element) {
        if (typeof element === "undefined") {
            return;
        } else if (element instanceof HTMLElement) {
            return METADATA_MAP.get(element);
        } else if (element.row_header_x >= 0) {
            if (element.row_header_x < this._view_cache.config.row_pivots.length) {
                const td = this.table_model.body._fetch_cell(element.y, element.row_header_x);
                return this.getMeta(td);
            }
        } else if (element.column_header_y >= 0) {
            if (element.column_header_y < this._view_cache.config.column_pivots.length) {
                const td = this.table_model.body._fetch_cell(element.column_header_y, element.y);
                return this.getMeta(td);
            }
        } else {
            return this.getMeta(this.table_model.body._fetch_cell(element.dy, element.dx + this.table_model._row_headers_length));
        }
    }

    /**
     * Get performance statistics about this `<regular-table>`.  Calling this
     * method resets the internal state, which makes it convenient to measure
     * performance at regular intervals (see example).
     *
     * Example:
     * const table = document.getElementById("my_regular_table");
     * setInterval(() => {
     *     const {real_fps} = table.getDrawFPS();
     *     console.log(`Measured ${fps} fps`)
     * });
     * @public
     * @memberof RegularTableElement
     * @returns {Performance} Performance data aggregated since the last
     * call to `getDrawFPS()`.
     */
    getDrawFPS() {
        return get_draw_fps();
    }

    /**
     * Call this method to set the `scrollLeft` and `scrollTop` for this
     * `<regular-table>` by calculating the position of this `scrollLeft`
     * and `scrollTop` relative to the underlying widths of its columns
     * and heights of its rows.
     *
     * Example:
     * table.scrollToCell(1, 3, 10, 30);
     * @public
     * @memberof RegularTableElement
     * @param {number} x - The left most `x` index column to scroll into view.
     * @param {number} y - The top most `y` index row to scroll into view.
     * @param {number} ncols - Total number of columns in the data model.
     * @param {number} nrows - Total number of rows in the data model.
     */
    async scrollToCell(x, y, ncols, nrows) {
        const row_height = this._virtual_panel.offsetHeight / nrows;
        this.scrollTop = row_height * y;
        this.scrollLeft = (x / (this._max_scroll_column(ncols) || ncols)) * (this.scrollWidth - this.clientWidth);
        await this.draw.flush();
    }

    /**
     * Call this method to set `DataListener` for this `<regular-table>`,
     * which will be called whenever a new data slice is needed to render.
     * Calls to `draw()` will fail if no `DataListener` has been set
     *
     * Example:
     * table.setDataListener((x0, y0, x1, y1) => {
     *     return {
     *         num_rows: num_rows = DATA[0].length,
     *         num_columns: DATA.length,
     *         data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
     *     };
     * })
     * @public
     * @memberof RegularTableElement
     * @param {DataListener} dataListener
     * `dataListener` is called by to request a rectangular section of data
     * for a virtual viewport, (x0, y0, x1, y1), and returns a `DataReponse`
     * object.
     * @param {Object} options
     * @param {("both"|"horizontal"|"vertical"|"none")} options.virtual_mode
     * The `virtual_mode` options flag may be one of "both", "horizontal",
     * "vertical", or "none" indicating which dimensions of the table should be
     * virtualized (vs. rendering completely).
     */
    setDataListener(dataListener, {virtual_mode = "both"} = {}) {
        let schema = {};
        let config = {
            row_pivots: [],
            column_pivots: [],
        };

        console.assert(VIRTUAL_MODES.indexOf(virtual_mode) > -1, `Unknown virtual_mode ${virtual_mode};  valid options are "both" (default), "horizontal", "vertical" or "none"`);
        /** @private */
        this._virtual_mode = virtual_mode;
        /** @private */
        this._invalid_schema = true;
        /** @private */
        this._view_cache = {view: dataListener, config, schema};
        this._setup_virtual_scroll();
    }

    /**
     * This func only exists to provide hints to doc compulation tools.
     * Should never be run, and even if it is the body of the func will
     * never execute.
     *
     * @internal
     * @private
     * @memberof RegularTableElement
     */
    __noop_jsdoc_hints() {
        if (false) {
            /**
             * Draws this virtual panel, given an object of render options that allow
             * the implementor to fine tune the individual render frames based on the
             * interaction and previous render state.
             *
             * @public
             * @type {(opt?: DrawOptions) => void}
             * @memberof RegularTableElement
             * */
            this.draw = null;
        }
    }
}

if (document.createElement("regular-table").constructor === HTMLElement) {
    window.customElements.define("regular-table", RegularTableElement);
}

/**
 * An object with performance statistics about calls to
 * `draw()` from some time interval (captured in milliseconds by the
 * `elapsed` proprty).
 *
 * @public
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
 * Example:
 *
 * MetaData                     (x = 0, column_header_y = 0))
 *                              *-------------------------------------+
 *                              |                                     |
 *                              |                                     |
 *                              +-------------------------------------+
 * (row_header_x = 0, y = 0)    (x = 0, y = 0)
 * *------------------------+   *-------------------------------------+
 * |                        |   |                                     |
 * |                        |   |      (x0, y0)                       |
 * |                        |   |      *---------------*              |
 * |                        |   |      |               |              |
 * |                        |   |      |     * (x, y)  |              |
 * |                        |   |      |               |              |
 * |                        |   |      *---------------* (x1, y1)     |
 * |                        |   |                                     |
 * +------------------------+   +-------------------------------------+
 *
 * @public
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
 * your data model, e.g. what was passed to `y0` when your
 * `dataListener` was invoked.
 * @property {number} [x1] - The `x` index of the viewport corner in
 * your data model, e.g. what was passed to `x1` when your
 * `dataListener` was invoked.
 * @property {number} [y1] - The `y` index of the viewport corner in
 * your data model, e.g. what was passed to `y1` when your
 * `dataListener` was invoked.
 * @property {number} [dx] - The `x` index in `DataResponse.data`, this
 * property is only generated for `<td>`, and `<th>` from `column_headers`.
 * @property {number} [dy] - The `y` index in `DataResponse.data`, this
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [column_header_y] - The `y` index in
 * `DataResponse.column_headers[x]`, this property is only generated for `<th>`
 * from `column_headers`.
 * @property {number} [row_header_x] - The `x` index in
 * `DataResponse.row_headers[y]`, this property is only generated for `<th>`
 * from `row_headers`.
 * @property {number} size_key - The unique index of this column in a full
 * `<table>`, which is `x` + (Total Row Header Columns).
 * @property {(string|HTMLElement)[]} [row_header] - The `Array` for this `y` in
 * `DataResponse.row_headers`, if it was provided.
 * @property {(string|HTMLElement)[]} [column_header] - The `Array` for this `x` in
 * `DataResponse.column_headers`, if it was provided.
 * @property {(string|HTMLElement)} [value] - The value dispalyed in the cell or header.
 */

/**
 * The `DataResponse` object describes a rectangular region of a virtual
 * data set, and some associated metadata.  `<regular-table>` will use this
 * object to render the `<table>`, though it may make multiple requests for
 * different regions to achieve a compelte render as it must estimate
 * certain dimensions.  You must construct a `DataResponse` object to
 * implement a `DataListener`.
 *
 * Example:
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
 * @public
 * @typedef DataResponse
 * @type {object}
 * @property {(string|HTMLElement)[][]} [column_headers] - A two dimensional
 * `Array` of column group headers, in specificity order.  No `<thead>`
 * will be generated if this property is not provided.
 * @property {(string|HTMLElement)[][]} [row_headers] - A two dimensional
 * `Array` of row group headers, in specificity order.  No `<th>`
 * elements within `<tbody>` will be generated if this property is not
 * provided.
 * @property {(string|HTMLElement)[][]} data - A two dimensional `Array`
 * representing a rectangular section of the underlying data set from
 * (x0, y0) to (x1, y1), arranged in columnar fashion such that
 * `data[x][y]` returns the `y`th row of the `x`th column of the slice.
 * @property {number} num_rows - Total number of rows in the underlying
 * data set.
 * @property {number} num_columns - Total number of columns in the
 * underlying data set.
 */

/**
 * The `DataListener` is similar to a normal event listener function.
 * Unlike a normal event listener, it takes regular arguments (not an
 * `Event`); and returns a `Promise` for a `DataResponse` object for this
 * region (as opposed to returning `void` as a standard event listener).
 *
 * @public
 * @callback DataListener
 * @param {number} x0 - The origin `x` index (column).
 * @param {number} y0 - The origin `y` index (row).
 * @param {number} x1 - The corner `x` index (column).
 * @param {number} y1 - The corner `y` index (row).
 * @returns {Promise<DataResponse>} The resulting `DataResponse`.  Make sure
 * to `resolve` or `reject` the `Promise`, or your `<regular-table>` will
 * never render!
 */

/**
 * Options for the draw method. `reset_scroll_position` will not prevent
 * the viewport from moving as `draw()` may change the dimensions of the
 * virtual_panel (and thus, absolute scroll offset).  This calls
 * `reset_scroll`, which will trigger `_on_scroll` and ultimately `draw()`
 * again;  however, this call to `draw()` will be for the same viewport
 * and will not actually cause a render.
 *
 * @public
 * @typedef DrawOptions
 * @type {object}
 * @property {boolean} [invalid_viewport]
 * @property {boolean} [preserve_width]
 * @property {boolean} [reset_scroll_position]
 * @property {boolean} [swap]
 */

/**
 * Public summary of table_model type.
 *
 * @public
 * @typedef TableModel
 * @type {object}
 * @property {ViewModel} header
 * @property {ViewModel} body
 * @property {() => number} num_columns
 */

/**
 * Public summary of table_model.header and table_model.body base type.
 *
 * @public
 * @typedef ViewModel
 * @type {object}
 * @property {any} table
 * @property {any[]} cells
 * @property {any[]} rows
 * @property {() => number} num_columns
 * @property {() => number} num_rows
 */
