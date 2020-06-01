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
 * Regular's "public" API.  See the `superstore-custom-grid.html` simple
 * example.
 *
 * @class RegularViewEventModel
 * @extends {RegularVirtualTableViewModel}
 */
export class RegularViewModel extends RegularViewEventModel {
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

    /**
     * Returns the metadata object associated with a `<td>` or `<th>`.  When
     * an `regular-table-after-update` event fires, use this method
     * to look up the Perspective data associated with a `<table>`s DOM cells.
     *
     * @param {*} td
     * @returns a metadata object.
     * @memberof RegularViewModel
     */
    get_meta(td) {
        return METADATA_MAP.get(td);
    }

    /**
     * Gets all `<td>` elements modified in this render.  This is equivalent to
     * `element.querySlectorAll("td");
     *
     * @returns
     * @memberof RegularViewModel
     */
    get_tds() {
        return this.table_model.body.cells.flat(1);
    }

    /**
     * Gets all `<th>` elements modified in this render.  This is equivalent to
     * `element.querySlectorAll("th");
     *
     * @returns
     * @memberof RegularViewModel
     */
    get_ths() {
        return this.table_model.header.cells.flat(1);
    }

    /**
     * Clear this renderer.
     *
     * @memberof RegularViewModel
     */
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

    /**
     * Get performance statistics about this `<regular-table>`.  Calling this
     * method resets the internal state, which makes it convenient to measure
     * performance at regular intervals (see example).
     * @returns {*} An object with performance statistics about calls to
     * `draw()`, with the following keys:
     * * `avg` - Avergage milliseconds per call
     * * `real_fps` - `num_frames` / `elapsed`
     * * `virtual_fps` - `elapsed` / `avg`
     * * `num_frames` - Number of frames rendered
     * * `elapsed` - Number of milliseconds since last call to `getDrawFPS()`
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

    addStyleListener(styleListener) {
        const key = this._style_callbacks.size;
        this._style_callbacks.set(key, styleListener);
        return key;
    }

    /**
     *
     * @param {Function<Promise<DataResponse>>} dataListener
     * `dataListener` is called by to request a rectangular section of data
     * for a virtual viewport, (x0, y0, x1, y1), and returns a `DataReponse`
     * object with this structure:
     * ```
     *                   column_headers:              num_columns:
     *                   [["X00", ["X00",  ["X00",    X > 3
     *                     "X0"],  "X1"],   "X2"]]
     *
     * row_headers:      data:
     * [["Y00", "Y0"]    [["A",   [true,   [0,
     *  ["Y00", "Y1"]      "B",    false,   1,
     *  ["Y00", "Y2"]]     "C"],   true]],  2]]
     *
     * num_rows:
     * Y > 3
     * ```
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
