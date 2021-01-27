/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

// import {RegularBodyViewModel as RustRegularBodyViewModel} from "../../pkg";

// /**
//  * <tbody> view model.
//  *
//  * @class RegularBodyViewModel
//  */
// export class RegularBodyViewModel extends RustRegularBodyViewModel {
//     constructor(...args) {
//         super(...args);
//         for (const key of Reflect.ownKeys(RegularBodyViewModel.prototype)) {
//             this[key] = RegularBodyViewModel.prototype[key];
//         }
//     }

// _draw_td(tagName, ridx, val, cidx, column_name, ridx_offset, size_key) {
//     const td = this._get_cell(tagName, ridx, cidx);
//     const metadata = this._get_or_create_metadata(td);
//     metadata.y = ridx + ridx_offset;
//     metadata.size_key = size_key;
//     if (tagName === "TD") {
//         metadata.column_header = column_name;
//     }
//     const override_width = this._column_sizes.override[metadata.size_key];
//     if (override_width) {
//         const auto_width = this._column_sizes.auto[metadata.size_key];
//         td.classList.toggle("pd-cell-clip", auto_width > override_width);
//         td.style.minWidth = override_width + "px";
//         td.style.maxWidth = override_width + "px";
//     } else {
//         td.classList.remove("pd-cell-clip");
//         td.style.minWidth = "";
//         td.style.maxWidth = "";
//     }

//     if (val instanceof HTMLElement) {
//         td.textContent = "";
//         td.appendChild(val);
//     } else {
//         td.textContent = val;
//     }

//     metadata.value = val;
//     return {td, metadata};
// }

// draw(container_height, column_state, view_state, th = false, x, x0, size_key, _virtual_x) {
//     const {cidx, column_data, row_headers} = column_state;
//     let {row_height} = view_state;
//     let metadata;
//     const ridx_offset = [],
//         tds = [];
//     let ridx = 0;
//     const cidx_offset = [];
//     for (let i = 0; i < (th ? view_state.row_headers_length : 1); i++) {
//         ridx = 0;

//         for (const val of column_data) {
//             const id = row_headers?.[ridx];
//             let obj;
//             if (th) {
//                 const row_header = val[i];
//                 const prev_row = this._fetch_cell(ridx - (ridx_offset[i] || 1), cidx + i);
//                 const prev_row_metadata = this._get_or_create_metadata(prev_row);

//                 const prev_col = this._fetch_cell(ridx, cidx + i - (cidx_offset[ridx] || 1));
//                 const prev_col_metadata = this._get_or_create_metadata(prev_col);

//                 if (prev_col && (prev_col_metadata.value === row_header || row_header === undefined) && !prev_col.hasAttribute("rowspan")) {
//                     cidx_offset[ridx] = cidx_offset[ridx] ? cidx_offset[ridx] + 1 : 2;
//                     prev_col.setAttribute("colspan", cidx_offset[ridx]);
//                     this._replace_cell(ridx, cidx + i);
//                 } else if (prev_row && prev_row_metadata.value === row_header && !prev_row.hasAttribute("colspan")) {
//                     ridx_offset[i] = ridx_offset[i] ? ridx_offset[i] + 1 : 2;
//                     prev_row.setAttribute("rowspan", ridx_offset[i]);
//                     this._replace_cell(ridx, cidx + i);
//                 } else {
//                     obj = this._draw_td("TH", ridx, row_header, cidx + i, column_state.column_name, view_state.ridx_offset, i);
//                     obj.td.style.display = "";
//                     obj.td.removeAttribute("rowspan");
//                     obj.td.removeAttribute("colspan");
//                     obj.metadata.row_header = val;
//                     obj.metadata.row_header_x = i;
//                     obj.metadata.x0 = x0;
//                     obj.metadata.y0 = view_state.ridx_offset;
//                     obj.metadata.y1 = view_state.y1;
//                     obj.metadata._virtual_x = i;
//                     ridx_offset[i] = 1;
//                     cidx_offset[ridx] = 1;
//                     tds[i] = obj;
//                 }
//                 ridx++;
//             } else {
//                 obj = this._draw_td("TD", ridx++, val, cidx, column_state.column_name, view_state.ridx_offset, size_key);
//                 obj.metadata.x = x;
//                 obj.metadata.x0 = x0;
//                 obj.metadata.x1 = view_state.x1;
//                 obj.metadata.row_header = id || {test: 2};
//                 obj.metadata.y0 = view_state.ridx_offset;
//                 obj.metadata.y1 = view_state.y1;
//                 obj.metadata.dx = x - x0;
//                 obj.metadata.dy = obj.metadata.y - obj.metadata.y0;
//                 obj.metadata._virtual_x = _virtual_x;
//                 tds[0] = obj;
//             }

//             metadata = obj ? obj.metadata : metadata;
//             row_height = row_height || obj?.td.offsetHeight;
//             if (ridx * row_height > container_height) {
//                 break;
//             }
//         }
//     }
//     this._clean_rows(ridx);
//     return {tds, ridx, metadata, row_height};
// }

// clean({ridx, cidx}) {
//     this._clean_rows(ridx);
//     this._clean_columns(cidx);
// }
// }
