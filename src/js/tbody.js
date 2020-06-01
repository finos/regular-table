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

const ROW_HEADER_RENDER_MODE = "rowspan_leading";
console.assert(["none", "rowspan", "rowspan_hide", "rowspan_leading"].indexOf(ROW_HEADER_RENDER_MODE) > -1, "Invalid ROW_HEADER_RENDERER_MODE");

/**
 * <tbody> view model.
 *
 * @class RegularBodyViewModel
 */
export class RegularBodyViewModel extends ViewModel {
    _draw_td(tagName, ridx, val, id, cidx, {column_name}, {ridx_offset, cidx_offset}) {
        const td = this._get_cell(tagName, ridx, cidx);
        const metadata = this._get_or_create_metadata(td);
        metadata.id = id;
        metadata.cidx = cidx + cidx_offset;
        metadata.column = column_name;
        metadata.y = ridx + ridx_offset;
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
        metadata.row_path = id;
        return {td, metadata};
    }

    _merge_th(trailing, prev_i, i, ridx, row_header, id, cidx_, column_state, view_state) {
        let obj;
        if (ROW_HEADER_RENDER_MODE === "none" || (ROW_HEADER_RENDER_MODE === "rowspan_leading" && i > trailing)) {
            obj = this._draw_td("TH", ridx, row_header, id, cidx_, column_state, view_state);
            obj.td.style.display = "";
            obj.td.removeAttribute("rowspan");
            return [row_header, obj, 1];
        } else if (ROW_HEADER_RENDER_MODE === "rowspan") {
            obj = this._draw_td("TH", ridx, row_header, id, cidx_, column_state, view_state);
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

    draw(container_height, column_state, view_state, th = false, dcidx) {
        const {cidx, column_data, id_column} = column_state;
        let {row_height} = view_state;
        let ridx = 0;
        let metadata, prev;
        for (const val of column_data) {
            const id = id_column?.[ridx];
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
                        row.push(this._merge_th(trailing, prev[i], i, ridx, row_header, id, cidx_, column_state, view_state));
                    } else {
                        obj = this._draw_td("TH", ridx, row_header, id, cidx_, column_state, view_state);
                        obj.td.style.display = "";
                        obj.td.removeAttribute("rowspan");
                        row.push([row_header, obj, 1]);
                    }
                    if (obj) {
                        obj.metadata.row_header_x = i;
                        obj.metadata.size_key = `R${i}`;
                    }
                    cidx_++;
                }
                prev = row;
                ridx++;
            } else {
                obj = this._draw_td("TD", ridx++, val, id, cidx, column_state, view_state);
                obj.metadata.x = dcidx;
                obj.metadata.size_key = dcidx + "";
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
