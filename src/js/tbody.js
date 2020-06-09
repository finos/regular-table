/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {ViewModel} from "./view_model";

const ROW_HEADER_RENDER_MODE = "rowspan";
console.assert(["none", "rowspan", "rowspan_hide", "rowspan_leading"].indexOf(ROW_HEADER_RENDER_MODE) > -1, "Invalid ROW_HEADER_RENDERER_MODE");

/**
 * <tbody> view model.
 *
 * @class RegularBodyViewModel
 */
export class RegularBodyViewModel extends ViewModel {
    _draw_td(tagName, ridx, val, cidx, {column_name}, {ridx_offset}, size_key) {
        const td = this._get_cell(tagName, ridx, cidx);
        const metadata = this._get_or_create_metadata(td);
        metadata.y = ridx + ridx_offset;
        metadata.size_key = size_key;
        if (tagName === "TD") {
            metadata.column_header = column_name;
        }
        const override_width = this._column_sizes.override[metadata.size_key];
        if (override_width) {
            const auto_width = this._column_sizes.auto[metadata.size_key];
            td.classList.toggle("pd-cell-clip", auto_width > override_width);
            td.style.minWidth = override_width + "px";
            td.style.maxWidth = override_width + "px";
        } else {
            td.classList.remove("pd-cell-clip");
            td.style.minWidth = "";
            td.style.maxWidth = "";
        }

        if (val instanceof HTMLElement) {
            td.textContent = "";
            td.appendChild(val);
        } else {
            td.textContent = val;
        }

        metadata.value = val;
        return {td, metadata};
    }

    _merge_th(trailing, prev_i, i, ridx, row_header, cidx_, column_state, view_state) {
        let obj;
        if (ROW_HEADER_RENDER_MODE === "none" || (ROW_HEADER_RENDER_MODE === "rowspan_leading" && i > trailing)) {
            obj = this._draw_td("TH", ridx, row_header, cidx_, column_state, view_state);
            obj.td.style.display = "";
            obj.td.removeAttribute("rowspan");
            obj.metadata.row_header = prev_i[1].metadata.row_header;
            obj.metadata.row_header_x = i;
            obj.metadata.size_key = i;
            return [row_header, obj, 1];
        } else if (ROW_HEADER_RENDER_MODE === "rowspan_hide") {
            obj = this._draw_td("TH", ridx, row_header, cidx_, column_state, view_state);
            prev_i[1].td.setAttribute("rowspan", prev_i[2] + 1);
            obj.td.style.display = "none";
            prev_i[2] += 1;
        } else if (ROW_HEADER_RENDER_MODE === "rowspan" || ROW_HEADER_RENDER_MODE === "rowspan_leading") {
            prev_i[1].td.setAttribute("rowspan", prev_i[2] + 1);
            this._replace_cell(undefined, ridx, cidx_);
            prev_i[2] += 1;
        } else {
            throw new Error(`Unknown render mode`);
        }
        return prev_i;
    }

    draw(container_height, column_state, view_state, th = false, x, x0, size_key, _virtual_x) {
        const {cidx, column_data, row_headers} = column_state;
        let {row_height} = view_state;
        let ridx = 0;
        let metadata, prev;
        for (const val of column_data) {
            const id = row_headers?.[ridx];
            const row = [];
            let obj;
            if (th) {
                let cidx_ = cidx;
                let trailing = val.length;
                while (val[trailing] === undefined && trailing > 0) {
                    trailing--;
                }
                for (let i = 0; i < val.length; i++) {
                    const row_header = val[i];
                    if (prev && prev[i][0] === row_header) {
                        row.push(this._merge_th(trailing, prev[i], i, ridx, row_header, cidx_, column_state, view_state));
                    } else {
                        obj = this._draw_td("TH", ridx, row_header, cidx_, column_state, view_state, i);
                        obj.td.style.display = "";
                        obj.td.removeAttribute("rowspan");
                        obj.metadata.row_header = val;
                        obj.metadata.row_header_x = i;
                        obj.metadata.x0 = x0;
                        obj.metadata.y0 = view_state.ridx_offset;
                        obj.metadata._virtual_x = i;
                        row.push([row_header, obj, 1]);
                    }
                    cidx_++;
                }
                prev = row;
                ridx++;
            } else {
                obj = this._draw_td("TD", ridx++, val, cidx, column_state, view_state, size_key);
                obj.metadata.x = x;
                obj.metadata.x0 = x0;
                obj.metadata.row_header = id || {test: 2};
                obj.metadata.y0 = view_state.ridx_offset;
                obj.metadata.dx = x - x0;
                obj.metadata.dy = obj.metadata.y - obj.metadata.y0;
                obj.metadata._virtual_x = _virtual_x;
                prev = [[val, obj, 1]];
            }

            metadata = obj.metadata;
            row_height = row_height || prev[prev.length - 1][1].td.offsetHeight;
            if (ridx * row_height > container_height) {
                break;
            }
        }
        this._clean_rows(ridx);
        return {tds: prev.map((x) => x[1]), ridx, metadata, row_height};
    }

    clean({ridx, cidx}) {
        this._clean_rows(ridx);
        this._clean_columns(cidx);
    }
}
