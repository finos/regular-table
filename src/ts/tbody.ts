// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▀░█▀▄░█▀▀░█▀▀░█░█░█░░░█▀█░█▀▄░░░░░▀█▀░█▀█░█▀▄░█░░░█▀▀░▀▄░░░░░░░░░░
// ░░░░░░░░░▀▄░░█▀▄░█▀▀░█░█░█░█░█░░░█▀█░█▀▄░▀▀▀░░█░░█▀█░█▀▄░█░░░█▀▀░░▄▀░░░░░░░░░
// ░░░░░░░░░░░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀░▀░░░░░░▀░░▀░▀░▀▀░░▀▀▀░▀▀▀░▀░░░░░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  *  Copyright (c) 2020, the Regular Table Authors. This file is part   *  ┃
// ┃  *  of the Regular Table library, distributed under the terms of the   *  ┃
// ┃  *  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). *  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import {
    BodyDrawResult,
    CellMetadata,
    CellMetadataBuilder,
    CellScalar,
    ColumnState,
    ViewState,
} from "./types";
import { ViewModel } from "./view_model";

/**
 * <tbody> view model.
 *
 * @class RegularBodyViewModel
 */
export class RegularBodyViewModel extends ViewModel {
    _draw_td(
        tagName: string,
        ridx: number,
        val: unknown,
        cidx: number,
        { column_name }: ColumnState,
        { ridx_offset }: ViewState,
        size_key: number,
    ): { td: HTMLTableCellElement; metadata: CellMetadataBuilder } {
        const td = this._get_cell(tagName, ridx, cidx);
        const metadata = this._get_or_create_metadata(td);
        metadata.y = ridx + Math.floor(ridx_offset);
        const key = (metadata.size_key = size_key || 0);
        if (tagName === "TD") {
            metadata.column_header = column_name;
        }

        // Handle clipping class for overridden columns
        const override_width = this._column_sizes.override[key];
        if (override_width) {
            const auto_width = this._column_sizes.auto[key] || 0;
            const clip = auto_width > override_width;
            if (td.classList.contains("rt-cell-clip") !== clip) {
                td.classList.toggle("rt-cell-clip", clip);
            }
        } else {
            td.classList.remove("rt-cell-clip");
        }

        if (metadata.value !== val) {
            if (val instanceof HTMLElement) {
                td.textContent = "";
                td.appendChild(val);
            } else {
                td.textContent = String(val ?? "");
            }
        }

        metadata.value = val;
        return { td, metadata };
    }

    draw<T extends CellScalar | CellScalar[]>(
        container_height: number,
        column_state: ColumnState<T>,
        view_state: ViewState,
        th: boolean = false,
        x?: number,
        x0?: number,
        size_key?: number,
        merge_headers?: boolean,
    ): BodyDrawResult {
        const {
            cidx,
            column_data,
            row_headers,
            column_data_listener_metadata,
        } = column_state;
        let { row_height } = view_state;
        let metadata: CellMetadataBuilder | undefined;
        const ridx_offset: number[] = [];
        const tds: Array<{ td: HTMLTableCellElement; metadata: CellMetadata }> =
            [];
        let ridx = 0;
        const cidx_offset: number[] = [];
        const loops = th ? (view_state.row_headers_length ?? 1) : 1;
        const y0_floor = Math.floor(view_state.ridx_offset);
        const y1_ceil = Math.ceil(view_state.y1);
        const x1_ceil = Math.ceil(view_state.x1);
        const x_floor = x === undefined ? x : Math.floor(x);
        const x0_floor = x0 === undefined ? undefined : Math.floor(x0);
        const dx = Math.floor((x ?? 0) - (x0 ?? 0));

        for (let i = 0; i < loops; i++) {
            ridx = 0;
            const cidx_i = cidx + i;

            for (const val of column_data) {
                let obj:
                    | {
                          td: HTMLTableCellElement;
                          metadata: CellMetadataBuilder;
                      }
                    | undefined;
                if (th) {
                    const valArray = val as CellScalar[];
                    const row_header = valArray[i];
                    const ridx_off_i = ridx_offset[i] || 1;
                    const prev_row = this._fetch_cell(
                        ridx - ridx_off_i,
                        cidx_i,
                    );

                    const prev_row_metadata =
                        this._get_or_create_metadata(prev_row);

                    const cidx_off_ridx = cidx_offset[ridx] || 1;
                    const prev_col = this._fetch_cell(
                        ridx,
                        cidx_i - cidx_off_ridx,
                    );
                    const prev_col_metadata =
                        this._get_or_create_metadata(prev_col);

                    if (
                        merge_headers &&
                        prev_col &&
                        (prev_col_metadata.value === row_header ||
                            row_header === undefined) &&
                        !prev_col.hasAttribute("rowspan")
                    ) {
                        const offset = (cidx_offset[ridx] = cidx_off_ridx + 1);
                        prev_col.setAttribute("colspan", String(offset));
                        this._replace_cell(ridx, cidx_i);
                    } else if (
                        merge_headers &&
                        prev_row &&
                        prev_row_metadata.value === row_header &&
                        !prev_row.hasAttribute("colspan")
                    ) {
                        const offset = (ridx_offset[i] = ridx_off_i + 1);
                        prev_row.setAttribute("rowspan", String(offset));
                        this._replace_cell(ridx, cidx_i);
                    } else {
                        obj = this._draw_td(
                            "TH",
                            ridx,
                            row_header,
                            cidx_i,
                            column_state as ColumnState<CellScalar>,
                            view_state,
                            i,
                        );

                        const td = obj.td;
                        const meta = obj.metadata;
                        td.style.display = "";
                        td.removeAttribute("rowspan");
                        td.removeAttribute("colspan");
                        meta.type = "row_header";
                        meta.row_header = valArray;
                        meta.row_header_x = i;
                        meta.y0 = y0_floor;
                        meta.y1 = y1_ceil;
                        meta.virtual_x = i;
                        if (x0_floor !== undefined) {
                            meta.x0 = x0_floor;
                        }
                        ridx_offset[i] = 1;
                        cidx_offset[ridx] = 1;
                        tds[i] = obj as {
                            td: HTMLTableCellElement;
                            metadata: CellMetadata;
                        };
                    }
                } else {
                    obj = this._draw_td(
                        "TD",
                        ridx,
                        val,
                        cidx,
                        column_state as ColumnState<CellScalar>,
                        view_state,
                        size_key ?? 0,
                    );
                    const meta = obj.metadata;
                    if (column_data_listener_metadata) {
                        meta.user = column_data_listener_metadata[ridx];
                    }

                    meta.type = "body";
                    meta.x = x_floor || 0;
                    meta.x1 = x1_ceil;
                    meta.row_header = row_headers?.[ridx] || [];
                    meta.y0 = y0_floor;
                    meta.y1 = y1_ceil;
                    meta.dx = dx;
                    meta.dy = (meta.y ?? 0) - y0_floor;
                    meta.virtual_x = cidx;
                    if (x0_floor !== undefined) {
                        meta.x0 = x0_floor;
                    }

                    tds[0] = obj as {
                        td: HTMLTableCellElement;
                        metadata: CellMetadata;
                    };
                }

                ridx++;
                metadata = obj ? obj.metadata : metadata;
                row_height = row_height || obj?.td.offsetHeight;
                if (ridx * (row_height ?? 0) > container_height) {
                    break;
                }
            }
        }
        this._clean_rows(ridx);
        return { tds, ridx, row_height };
    }

    clean({ ridx, cidx }: { ridx: number; cidx: number }): void {
        this._clean_rows(ridx);
        this._clean_columns(cidx);
    }
}
