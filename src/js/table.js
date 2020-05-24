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
import {column_path_2_type, html} from "./utils";

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
            const [cell, metadata] = last_cells.shift();
            const offsetWidth = cell.offsetWidth;
            this._column_sizes.row_height = this._column_sizes.row_height || cell.offsetHeight;
            this._column_sizes.indices[metadata.cidx] = offsetWidth;
            const is_override = this._column_sizes.override.hasOwnProperty(metadata.size_key);
            if (offsetWidth && !is_override) {
                this._column_sizes.auto[metadata.size_key] = offsetWidth;
            }
        }
    }

    async draw(container_size, view_cache, selected_id, preserve_width, viewport, num_columns) {
        const {width: container_width, height: container_height} = container_size;
        const {view, config, schema} = view_cache;
        const {data, row_indices, column_indices, __id_column: id_column} = await view(viewport.start_col, viewport.start_row, viewport.end_col, viewport.end_row);
        const {start_row: ridx_offset = 0, start_col: cidx_offset = 0} = viewport;
        const depth = config.row_pivots.length;
        const view_state = {
            viewport_width: 0,
            selected_id,
            depth,
            ridx_offset,
            cidx_offset,
            row_height: this._column_sizes.row_height,
        };

        let cont_body,
            cidx = 0,
            last_cells = [],
            first_col = true;
        if (row_indices?.length > 0) {
            const column_name = config.row_pivots.join(",");
            const type = config.row_pivots.map((x) => schema[x]);
            const column_data = row_indices;
            const column_state = {
                column_name,
                cidx: 0,
                column_data,
                id_column,
                type,
                first_col,
            };
            const cont_head = this.header.draw(config, column_name, "", type, 0);
            cont_body = this.body.draw(container_height, column_state, {
                ...view_state,
                cidx_offset: 0,
            });
            first_col = false;
            view_state.viewport_width += this._column_sizes.indices[0] || cont_body.td?.offsetWidth || cont_head.th.offsetWidth;
            view_state.row_height = view_state.row_height || cont_body.row_height;
            cidx++;
            if (!preserve_width) {
                last_cells.push([cont_body.td || cont_head.th, cont_body.metadata || cont_head.metadata]);
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
                    column_indices[dcidx] = new_col.column_indices[0];
                }
                const column_name = column_indices[dcidx][column_indices[dcidx].length - 1];
                const type = column_path_2_type(schema, column_name);
                const column_data = data[dcidx];
                const column_state = {
                    column_name,
                    cidx,
                    column_data,
                    id_column,
                    type,
                    first_col,
                };
                const cont_head = this.header.draw(config, undefined, column_name, type, cidx + cidx_offset);
                cont_body = this.body.draw(container_height, column_state, view_state);
                first_col = false;
                view_state.viewport_width += this._column_sizes.indices[cidx + cidx_offset] || cont_body.td?.offsetWidth || cont_head.th.offsetWidth;
                view_state.row_height = view_state.row_height || cont_body.row_height;
                cidx++;
                dcidx++;
                if (!preserve_width) {
                    last_cells.push([cont_body.td || cont_head.th, cont_body.metadata || cont_head.metadata]);
                }

                if (view_state.viewport_width > container_width) {
                    break;
                }
            }

            return last_cells;
        } finally {
            this.body.clean({ridx: cont_body?.ridx || 0, cidx});
            this.header.clean();
        }
    }
}
