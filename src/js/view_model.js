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

/******************************************************************************
 *
 * View Model
 *
 */

export class ViewModel {
    constructor(column_sizes, container, table) {
        this._column_sizes = column_sizes;
        this._container = container;
        this.table = table;
        this.cells = [];
        this.rows = [];
    }

    num_rows() {
        return this.cells.length;
    }

    _set_metadata(td, metadata) {
        METADATA_MAP.set(td, metadata);
    }

    _get_or_create_metadata(td) {
        if (METADATA_MAP.has(td)) {
            return METADATA_MAP.get(td);
        } else {
            const metadata = {};
            METADATA_MAP.set(td, metadata);
            return metadata;
        }
    }

    _replace_cell(new_td, ridx, cidx) {
        const {tr, row_container} = this._get_row(ridx);
        let td = row_container[cidx];
        if (td) {
            tr.removeChild(td);
            row_container.splice(cidx, 1, undefined);
        }
        return td;
    }

    _get_cell(tag = "TD", ridx, cidx) {
        const {tr, row_container} = this._get_row(ridx);
        let td = row_container[cidx];
        if (!td) {
            if (cidx < row_container.length) {
                td = row_container[cidx] = document.createElement(tag);
                tr.insertBefore(
                    td,
                    row_container.slice(cidx + 1).find((x) => x)
                );
            } else {
                td = row_container[cidx] = document.createElement(tag);
                tr.appendChild(td);
            }
        }
        if (td.tagName !== tag) {
            const new_td = document.createElement(tag);
            tr.replaceChild(new_td, td);
            this.cells[ridx].splice(cidx, 1, new_td);
            td = new_td;
        }
        return td;
    }

    _get_row(ridx) {
        let tr = this.rows[ridx];
        if (!tr) {
            tr = this.rows[ridx] = document.createElement("tr");
            this.table.appendChild(tr);
        }

        let row_container = this.cells[ridx];
        if (!row_container) {
            row_container = this.cells[ridx] = [];
        }

        return {tr, row_container};
    }

    _clean_columns(cidx) {
        for (let i = 0; i < this.rows.length; i++) {
            const tr = this.rows[i];
            const row_container = this.cells[i];
            this.cells[i] = row_container.slice(0, cidx[i] || cidx);
            const idx = this.cells[i].filter((x) => x !== undefined).length;
            while (tr.children[idx]) {
                tr.removeChild(tr.children[idx]);
            }
        }
    }

    _clean_rows(ridx) {
        while (this.table.children[ridx]) {
            this.table.removeChild(this.table.children[ridx]);
        }
        this.rows = this.rows.slice(0, ridx);
        this.cells = this.cells.slice(0, ridx);
    }
}
