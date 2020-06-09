/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {RegularHeaderViewModel} from "./thead";
import {RegularBodyViewModel} from "./tbody";
import {html} from "./utils";

/**
 * <table> view model.  In order to handle unknown column width when `draw()`
 * is called, this model will iteratively fetch more data to fill in columns
 * until the page is complete, and makes some column viewport estimations
 * when this information is not availble.
 *
 * @class RegularTableViewModel
 */
export class RegularTableViewModel {
    constructor(table_clip, column_sizes, element) {
        element.innerHTML = html`
            <table cellspacing="0">
                <thead></thead>
                <tbody></tbody>
            </table>
        `;
        const [table] = element.children;
        const [thead, tbody] = table.children;
        this.table = table;
        this._column_sizes = column_sizes;
        this.header = new RegularHeaderViewModel(column_sizes, table_clip, thead);
        this.body = new RegularBodyViewModel(column_sizes, table_clip, tbody);
        this.fragment = document.createDocumentFragment();
    }

    num_columns() {
        return this.header._get_row(Math.max(0, this.header.rows?.length - 1 || 0)).row_container.length;
    }

    /**
     * Calculate amendments to auto size from this render pass.
     *
     * @param {*} last_cells
     * @param {*} {columns, column_pivots}
     * @memberof RegularTableViewModel
     */
    autosize_cells(last_cells) {
        while (last_cells.length > 0) {
            const [cell, metadata] = last_cells.pop();
            const offsetWidth = cell.offsetWidth;
            this._column_sizes.row_height = this._column_sizes.row_height || cell.offsetHeight;
            this._column_sizes.indices[metadata.size_key] = offsetWidth;
            const is_override = this._column_sizes.override.hasOwnProperty(metadata.size_key);
            if (offsetWidth && !is_override) {
                this._column_sizes.auto[metadata.size_key] = offsetWidth;
            }
        }
    }

    async draw(container_size, view_cache, selected_id, preserve_width, viewport, num_columns) {
        const {width: container_width, height: container_height} = container_size;
        const {view, config} = view_cache;
        let {data, row_headers, column_headers} = await view(viewport.start_col, viewport.start_row, viewport.end_col, viewport.end_row);
        const {start_row: ridx_offset = 0, start_col: x0 = 0} = viewport;

        // pad row_headers for embedded renderer
        // TODO maybe dont need this - perspective compat
        let row_index_length = 0;
        if (row_headers) {
            row_index_length = row_headers.reduce((max, x) => Math.max(max, x.length), 0);
            row_headers = row_headers.map((x) => {
                x.length = row_index_length;
                return x;
            });
        }

        view_cache.config.column_pivots = Array.from(Array(column_headers?.[0]?.length - 1 || 0).keys());
        view_cache.config.row_pivots = Array.from(Array(row_headers?.[0]?.length || 0).keys());

        const view_state = {
            viewport_width: 0,
            selected_id,
            ridx_offset,
            x0: x0,
            row_height: this._column_sizes.row_height,
        };

        let cont_body,
            _virtual_x = 0,
            last_cells = [],
            first_col = true;
        if (row_headers?.length > 0) {
            const column_name = config.row_pivots.join(",");

            const column_state = {
                column_name,
                cidx: 0,
                column_data: row_headers,
                row_headers,
                first_col,
            };
            const size_key = _virtual_x + x0;
            cont_body = this.body.draw(container_height, column_state, {...view_state, x0: 0}, true, undefined, undefined, size_key, _virtual_x);
            const cont_heads = [];
            for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
                cont_heads.push(this.header.draw(column_name, Array(view_cache.config.column_pivots.length + 1).fill(""), 1, undefined, i, x0, i));
            }
            first_col = false;
            view_state.viewport_width +=
                cont_body.tds.reduce((total, {td}, i) => total + (this._column_sizes.indices[i] || td.offsetWidth), 0) || cont_heads.reduce((total, {th}) => total + th.offsetWidth, 0);
            view_state.row_height = view_state.row_height || cont_body.row_height;
            _virtual_x = row_headers[0].length;
            if (!preserve_width) {
                for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
                    const {td, metadata} = cont_body.tds[i];
                    const {th, metadata: hmetadata} = cont_heads[i];
                    last_cells.push([td || th, metadata || hmetadata]);
                }
            }
        }

        try {
            let dcidx = 0;
            const num_visible_columns = num_columns - viewport.start_col;
            while (dcidx < num_visible_columns) {
                if (!data[dcidx]) {
                    let missing_cidx = Math.max(viewport.end_col, 0);
                    viewport.start_col = missing_cidx;
                    viewport.end_col = missing_cidx + 1;
                    const new_col = await view(viewport.start_col, viewport.start_row, viewport.end_col, viewport.end_row);
                    data[dcidx] = new_col.data[0];
                    if (column_headers) {
                        column_headers[dcidx] = new_col.column_headers?.[0];
                    }
                }
                const column_name = column_headers?.[dcidx] || "";
                const column_data = data[dcidx];
                const column_state = {
                    column_name,
                    cidx: _virtual_x,
                    column_data,
                    row_headers,
                    first_col,
                };

                const x = dcidx + x0;
                const size_key = _virtual_x + x0;
                const cont_head = this.header.draw(undefined, column_name, undefined, x, size_key, x0, _virtual_x);
                cont_body = this.body.draw(container_height, column_state, view_state, false, x, x0, size_key, _virtual_x);
                first_col = false;
                view_state.viewport_width += this._column_sizes.indices[_virtual_x + x0] || cont_body.tds.reduce((x, y) => x + y.td?.offsetWidth, 0) || cont_head.th.offsetWidth;
                view_state.row_height = view_state.row_height || cont_body.row_height;
                _virtual_x++;
                dcidx++;
                if (!preserve_width) {
                    for (const {td, metadata} of cont_body.tds) {
                        last_cells.push([td || cont_head.th, metadata || cont_head.metadata]);
                    }
                }

                if (view_state.viewport_width > container_width) {
                    break;
                }
            }

            return last_cells;
        } finally {
            this.body.clean({ridx: cont_body?.ridx || 0, cidx: _virtual_x});
            this.header.clean();
        }
    }
}
