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
        metadata.size_key = `${column_name}|undefined`;
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

    draw(container_height, column_state, view_state, th = false, dcidx = 0) {
        const {cidx, column_data, id_column} = column_state;
        let {row_height} = view_state;
        let ridx = 0;
        let td, metadata, prev;
        for (const val of column_data) {
            const id = id_column?.[ridx];
            const row = [];
            let obj;
            if (th) {
                let cidx_ = cidx;
                for (let i = 0; i < val.length; i++) {
                    const row_header = val[i];
                    if (prev && prev[i][0] === row_header) {
                        obj = this._draw_td("TH", ridx, row_header, id, cidx_, column_state, view_state);
                        prev[i][1].setAttribute("rowspan", prev[i][2] + 1);
                        obj.td.style.display = "none";
                        row.push([prev[i][0], prev[i][1], prev[i][2] + 1]);
                    } else {
                        obj = this._draw_td("TH", ridx, row_header, id, cidx_, column_state, view_state);
                        obj.td.style.display = "";
                        obj.td.removeAttribute("rowspan");
                        row.push([row_header, obj.td, 1]);
                    }
                    cidx_++;
                }
                prev = row;
                ridx++;
            } else {
                obj = this._draw_td("TD", ridx++, val, id, cidx, column_state, view_state);
            }
            td = obj.td;
            metadata = obj.metadata;
            metadata.x = dcidx;
            row_height = row_height || td.offsetHeight;
            if (ridx * row_height > container_height) {
                break;
            }
        }
        this._clean_rows(ridx);
        return {td, ridx, metadata, row_height};
    }

    clean({ridx, cidx}) {
        this._clean_rows(ridx);
        this._clean_columns(cidx);
    }
}
