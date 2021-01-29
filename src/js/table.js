/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {set_panic_hook} from "../../pkg";
import {RegularTableViewModel as RustRegularTableViewModel} from "../../pkg";

set_panic_hook();

/**
 * <table> view model.  In order to handle unknown column width when `draw()`
 * is called, this model will iteratively fetch more data to fill in columns
 * until the page is complete, and makes some column viewport estimations
 * when this information is not availble.
 *
 * @class RegularTableViewModel
 */
export class RegularTableViewModel extends RustRegularTableViewModel {
    constructor(table_clip, column_sizes, element) {
        super(table_clip, column_sizes, element);
        for (const key of Reflect.ownKeys(RegularTableViewModel.prototype)) {
            this[key] = RegularTableViewModel.prototype[key];
        }
        // this.clear(element);
        // const [table] = element.children;
        // const [thead, tbody] = table.children;

        // this.table = table;
        // this._column_sizes = column_sizes;
        // this.header = new RegularHeaderViewModel(column_sizes, table_clip, thead);
        // this.body = new RegularBodyViewModel(column_sizes, table_clip, tbody);
        // this.fragment = document.createDocumentFragment();
    }

    // num_columns() {
    //     return this.header.num_columns();
    // }

    // clear(element) {
    //     element.innerHTML = html`
    //         <table cellspacing="0">
    //             <thead></thead>
    //             <tbody></tbody>
    //         </table>
    //     `;
    // }

    /**
     * Calculate amendments to auto size from this render pass.
     *
     * @param {*} last_cells
     * @param {*} {columns, column_pivots}
     * @memberof RegularTableViewModel
     */
    // autosize_cells(last_cells) {
    //     while (last_cells.length > 0) {
    //         const [cell, metadata] = last_cells.pop();
    //         let offsetWidth;
    //         const style = getComputedStyle(cell);
    //         if (style.boxSizing !== "border-box") {
    //             offsetWidth = cell.clientWidth;
    //             offsetWidth -= parseFloat(style.paddingLeft);
    //             offsetWidth -= parseFloat(style.paddingRight);
    //         } else {
    //             offsetWidth = cell.offsetWidth;
    //         }
    //         this._column_sizes.row_height = this._column_sizes.row_height || cell.offsetHeight;
    //         this._column_sizes.indices[metadata.size_key] = offsetWidth;
    //         const is_override = this._column_sizes.override.hasOwnProperty(metadata.size_key);
    //         if (offsetWidth && !is_override) {
    //             this._column_sizes.auto[metadata.size_key] = offsetWidth;
    //         }
    //         if (cell.style.minWidth === "0px") {
    //             cell.style.minWidth = `${offsetWidth}px`;
    //         }
    //     }
    //     //this.rust_table_view_model.autosize_cells(last_cells);
    // }

    async *draw(container_size, view_cache, selected_id, preserve_width, viewport, num_columns) {
        const {width: container_width, height: container_height} = container_size;
        const {view, config} = view_cache;
        let {data, row_headers, column_headers} = await view(viewport.start_col, viewport.start_row, viewport.end_col, viewport.end_row);
        const {start_row: ridx_offset = 0, start_col: x0 = 0, end_col: x1 = 0, end_row: y1 = 0} = viewport;

        // pad row_headers for embedded renderer
        // TODO maybe dont need this - perspective compat
        if (row_headers) {
            this._row_headers_length = row_headers.reduce((max, x) => Math.max(max, x.length), 0);
            row_headers = row_headers.map((x) => {
                x.length = this._row_headers_length;
                return x;
            });
        }

        /**
         * column_headers && column_leaders[0] ? column_headers[0].length - 1 : 0
         */
        view_cache.config.column_pivots = Array.from(Array(column_headers?.[0]?.length - 1 || 0).keys());
        view_cache.config.row_pivots = Array.from(Array(row_headers?.[0]?.length || 0).keys());

        const view_state = {
            viewport_width: 0,
            selected_id,
            ridx_offset,
            x0: x0,
            x1: x1,
            y1: y1,
            row_height: this._column_sizes.row_height,
            row_headers_length: this._row_headers_length,
        };

        // let cont_body,
        //     _virtual_x = 0,
        //     last_cells = [],
        //     first_col = true;

        const draw_state = {
            cont_body: null,
            first_col: true,
            _virtual_x: 0,
        };

        const last_cells = [];

        await this.draw_row_headers(draw_state, last_cells, row_headers, config, view_state, x0, container_height, view_cache, preserve_width);
        yield* this.draw_columns(last_cells, data, view, draw_state, view_state, viewport, column_headers, row_headers, num_columns, container_height, container_width, x0, preserve_width);
    }

    // async draw_row_headers(draw_state, last_cells, row_headers, config, view_state, x0, container_height, view_cache, preserve_width) {
    //     let {cont_body, first_col, _virtual_x} = draw_state;

    //     if (row_headers?.length > 0) {
    //         const column_name = config.row_pivots.join(",");

    //         const column_state = {
    //             column_name,
    //             cidx: 0,
    //             column_data: row_headers,
    //             row_headers,
    //             first_col,
    //         };
    //         const size_key = _virtual_x + x0;
    //         cont_body = this.body.draw(container_height, column_state, {...view_state, x0: 0}, true, undefined, undefined, size_key, _virtual_x);
    //         const cont_heads = [];
    //         for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
    //             cont_heads.push(this.header.draw(column_name, Array(view_cache.config.column_pivots.length + 1).fill(""), true, undefined, i, x0, i));
    //         }
    //         first_col = false;
    //         view_state.viewport_width += cont_heads.reduce((total, {th}, i) => total + (this._column_sizes.indices[i] || th.offsetWidth), 0);
    //         view_state.row_height = view_state.row_height || cont_body.row_height;
    //         _virtual_x = row_headers[0].length;
    //         if (!preserve_width) {
    //             for (let i = 0; i < view_cache.config.row_pivots.length; i++) {
    //                 const {td, metadata} = cont_body.tds[i] || {};
    //                 const {th, metadata: hmetadata} = cont_heads[i];
    //                 last_cells.push([th || td, hmetadata || metadata]);
    //             }
    //         }
    //     }

    //     draw_state.cont_body = cont_body;
    //     draw_state.first_col = first_col;
    //     draw_state._virtual_x = _virtual_x;
    // }

    async *draw_columns(last_cells, data, view, draw_state, view_state, viewport, column_headers, row_headers, num_columns, container_height, container_width, x0, preserve_width) {
        try {
            let dcidx = 0;
            let unknown_column_sizes = [];
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
                    cidx: draw_state._virtual_x,
                    column_data,
                    row_headers,
                    first_col: draw_state.first_col,
                };

                const x = dcidx + x0;
                const size_key = draw_state._virtual_x + x0;
                const cont_head = this.header.draw(undefined, column_name, false, x, size_key, x0, draw_state._virtual_x);
                draw_state.cont_body = this.body.draw(container_height, column_state, view_state, false, x, x0, size_key, draw_state._virtual_x);
                draw_state.first_col = false;
                if (!preserve_width) {
                    for (const {td, metadata} of draw_state.cont_body.tds) {
                        last_cells.push([cont_head.th || td, cont_head.metadata || metadata]);
                    }
                }

                const last_measured_col_width = this._column_sizes.indices[draw_state._virtual_x + x0];
                if (last_measured_col_width) {
                    view_state.viewport_width += last_measured_col_width;
                } else {
                    view_state.viewport_width += 65;
                    unknown_column_sizes.push([draw_state.cont_body.tds, cont_head.th]);
                }

                view_state.row_height = view_state.row_height || draw_state.cont_body.row_height;
                draw_state._virtual_x++;
                dcidx++;

                if (view_state.viewport_width > container_width) {
                    yield last_cells;
                    for (const [tds, th] of unknown_column_sizes) {
                        view_state.viewport_width -= 65;
                        view_state.viewport_width += tds.reduce((x, y) => x + y.td?.offsetWidth, 0) || th.offsetWidth;
                    }
                    if (view_state.viewport_width > container_width) {
                        return;
                    }
                }
            }

            yield last_cells;
        } finally {
            this.body.clean({ridx: draw_state.cont_body?.ridx || 0, cidx: draw_state._virtual_x});
            this.header.clean();
        }
    }
}
