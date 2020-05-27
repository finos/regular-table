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

    async setDataModel(view) {
        let schema = {};
        let config = {
            row_pivots: [],
            column_pivots: [],
        };

        this._invalid_schema = true;
        const options = this.infer_options(config);
        this._view_cache = {view, config, schema};
        await this.draw(options);
    }

    save() {
        const selected = this._get_selected();
        if (selected !== undefined) {
            return {selected};
        }
    }

    restore(config) {
        if (config.selected) {
            this._set_selected(config.selected);
        }
    }
}
