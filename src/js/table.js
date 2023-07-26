/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import { RegularHeaderViewModel } from "./thead";
import { RegularBodyViewModel } from "./tbody";
import { html } from "./utils";

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
        this.clear(element);
        const [table] = element.children;
        const [thead, tbody] = table.children;
        this.table = table;
        this._column_sizes = column_sizes;
        this.header = new RegularHeaderViewModel(column_sizes, table_clip, thead);
        this.body = new RegularBodyViewModel(column_sizes, table_clip, tbody);
        this.fragment = document.createDocumentFragment();
    }

    num_columns() {
        return this.header.num_columns();
    }

    clear(element) {
        // nosemgrep
        element.innerHTML = html`
            <table cellspacing="0">
                <thead></thead>
                <tbody></tbody>
            </table>
        `;
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
            const box = cell.getBoundingClientRect();
            this._column_sizes.row_height = Math.max(10, Math.min(this._column_sizes.row_height || box.height, box.height));
            this._column_sizes.indices[metadata.size_key] = box.width;
            const is_override = this._column_sizes.override[metadata.size_key] !== undefined;
            if (box.width && !is_override) {
                this._column_sizes.auto[metadata.size_key] = box.width;
            }

            if (cell.style.minWidth === "0px") {
                cell.style.minWidth = `${box.width}px`;
            }
        }
    }

    async *draw(container_size, view_cache, selected_id, preserve_width, viewport, num_columns) {
        const { width: container_width, height: container_height } = container_size;
        const { view, config } = view_cache;
        let { data, row_headers, column_headers, metadata: data_listener_metadata } = await view(
            Math.floor(viewport.start_col),
            Math.floor(viewport.start_row),
            Math.ceil(viewport.end_col),
            Math.ceil(viewport.end_row)
        );

        const { start_row: ridx_offset = 0, start_col: x0 = 0, end_col: x1 = 0, end_row: y1 = 0 } = viewport;

        // pad row_headers for embedded renderer
        // TODO maybe dont need this - perspective compat
        if (row_headers) {
            this._row_headers_length = row_headers.reduce((max, x) => Math.max(max, x.length), 0);
            row_headers = row_headers.map((x) => {
                x.length = this._row_headers_length;
                return x;
            });
        }

        view_cache.config.column_pivots = Array.from(Array(column_headers?.[0]?.length || 0).keys());
        view_cache.config.row_pivots = Array.from(Array(row_headers?.[0]?.length || 0).keys());
        const sub_cell_offset = this._column_sizes.indices[(this._row_headers_length || 0) + Math.floor(viewport.start_col)] || 0;

        const view_state = {
            viewport_width: 0,
            selected_id,
            ridx_offset,
            sub_cell_offset,
            x0: x0,
            x1: x1,
            y1: y1,
            row_height: this._column_sizes.row_height,
            row_headers_length: this._row_headers_length,
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
            const size_key = _virtual_x + Math.floor(x0);
            cont_body = this.body.draw(container_height, column_state, { ...view_state, x0: 0 }, true, undefined, undefined, size_key);
            const cont_heads = [];
            for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
                const header = this.header.draw(column_name, Array(view_cache.config.column_pivots.length).fill(""), 1, undefined, i, x0, i);
                if (!!header) {
                    cont_heads.push(header);
                }
            }
            first_col = false;
            view_state.viewport_width += cont_heads.reduce((total, { th }, i) => total + (this._column_sizes.indices[i] || th.offsetWidth), 0);
            view_state.row_height = view_state.row_height || cont_body.row_height;
            _virtual_x = row_headers[0].length;
            if (!preserve_width) {
                for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
                    const { td, metadata } = cont_body.tds[i] || {};
                    const { th, metadata: hmetadata } = cont_heads[i] || {};
                    if (!!td || !!th) {
                        last_cells.push([th || td, hmetadata || metadata]);
                    }
                }
            }
        }

        try {
            let dcidx = 0;
            const num_visible_columns = num_columns - viewport.start_col;
            while (dcidx < num_visible_columns) {
                // If there is no column for this data, our pre-fetch viewport
                // estimate was wrong and we'll need to do a mid-render fetch
                // to get more data.
                if (!data[dcidx]) {
                    let missing_cidx = Math.max(viewport.end_col, 0);
                    viewport.start_col = missing_cidx;

                    // Calculate a new data window width based on how large the
                    // columns drawn so far take up.  This can either be
                    // summed if we've drawn/measured these columns before,
                    // or estimated by avg if the missing columns have never
                    // been seen by the renderer.
                    let end_col_offset = 0,
                        size_extension = 0;
                    while (this._column_sizes.indices.length > _virtual_x + x0 + end_col_offset + 1 && size_extension + view_state.viewport_width < container_width) {
                        end_col_offset++;
                        size_extension += this._column_sizes.indices[_virtual_x + x0 + end_col_offset];
                    }

                    if (size_extension + view_state.viewport_width < container_width) {
                        const estimate = Math.min(num_columns, missing_cidx + 5); //Math.ceil(((dcidx + end_col_offset) * container_width) / (view_state.viewport_width + size_extension) + 1);
                        viewport.end_col = Math.max(1, Math.min(num_columns, estimate));
                    } else {
                        viewport.end_col = Math.max(1, Math.min(num_columns, missing_cidx + end_col_offset));
                    }

                    // Fetch the new data window extension and append it to the
                    // cached data page and continue.
                    const new_col_req = view(Math.floor(viewport.start_col), Math.floor(viewport.start_row), Math.ceil(viewport.end_col), Math.ceil(viewport.end_row));
                    yield undefined;
                    const new_col = await new_col_req;

                    if (new_col.data.length === 0) {
                        // The viewport is size 0, first the estimate, then the
                        // first-pass render, so really actually abort now.
                        yield last_cells;
                        return;
                    }

                    viewport.end_col = viewport.start_col + new_col.data.length;
                    for (let i = 0; i < new_col.data.length; i++) {
                        data[dcidx + i] = new_col.data[i];
                        if (new_col.metadata) {
                            data_listener_metadata[dcidx + i] = new_col.metadata[i];
                        }

                        if (column_headers) {
                            column_headers[dcidx + i] = new_col.column_headers?.[i];
                        }
                    }
                }

                const column_name = column_headers?.[dcidx] || "";
                const column_data = data[dcidx];
                const column_data_listener_metadata = data_listener_metadata?.[dcidx];
                const column_state = {
                    column_name,
                    cidx: _virtual_x,
                    column_data,
                    column_data_listener_metadata,
                    row_headers,
                    first_col,
                };

                const x = dcidx + x0;
                const size_key = _virtual_x + Math.floor(x0);
                const cont_head = this.header.draw(undefined, column_name, undefined, x, size_key, x0, _virtual_x);
                cont_body = this.body.draw(container_height, column_state, view_state, false, x, x0, size_key);
                first_col = false;
                if (!preserve_width) {
                    for (const { td, metadata } of cont_body.tds) {
                        last_cells.push([cont_head?.th || td, cont_head?.metadata || metadata]);
                    }
                }

                const last_measured_col_width = this._column_sizes.indices[_virtual_x + Math.floor(x0)];
                if (last_measured_col_width) {
                    view_state.viewport_width += last_measured_col_width;
                } else {
                    // This is probably wrong since the column has yet to be
                    // styled, but we'll use it as an estimate and recalc after.
                    view_state.viewport_width += cont_head?.th?.offsetWidth || cont_body.tds.reduce((x, y) => x + y.td?.offsetWidth, 0);
                }

                view_state.row_height = view_state.row_height || cont_body.row_height;
                _virtual_x++;
                dcidx++;

                if (view_state.viewport_width - view_state.sub_cell_offset > container_width) {
                    this.body.clean({
                        ridx: cont_body?.ridx || 0,
                        cidx: _virtual_x,
                    });
                    this.header.clean();
                    yield last_cells;

                    // If we make it here, this draw() call was invalidated by
                    // a call to `invalidate()` within a `StyleListener`, so
                    // recalculate the cumulative width and keep drawing if
                    // necessary.  Note `last_cells` is a list of 2-tuples but
                    // we only bind the first var because _eslint_.
                    view_state.viewport_width = 0;
                    for (let [td] of last_cells) {
                        view_state.viewport_width += td.offsetWidth;
                    }

                    // If there are still enough columns to fill the screen,
                    // completely end the iteration here, otherwise
                    // continue iterating to draw another column.
                    if (view_state.viewport_width - view_state.sub_cell_offset > container_width) {
                        return;
                    }
                }
            }
            this.body.clean({ ridx: cont_body?.ridx || 0, cidx: _virtual_x });
            this.header.clean();
            yield last_cells;
        } finally {
            this.body.clean({ ridx: cont_body?.ridx || 0, cidx: _virtual_x });
            this.header.clean();
            this.body._span_factory.reset();
            this.header._span_factory.reset();
        }
    }
}
