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

import { ViewModel } from "./view_model";
import {
    HeaderDrawResult,
    ColumnSizes,
    CellMetadata,
    CellScalar,
} from "./types";

/**
 * <thead> view model.  This model accumulates state in the form of
 * column_sizes, which leverages <tables> autosize behavior across
 * virtual pages.
 *
 * @class RegularHeaderViewModel
 */
export class RegularHeaderViewModel extends ViewModel {
    private _group_header_cache: [CellMetadata, HTMLTableCellElement, number][];
    private _offset_cache: number[];

    constructor(
        column_sizes: ColumnSizes,
        container: HTMLElement,
        table: HTMLElement,
    ) {
        super(column_sizes, container, table);
        this._group_header_cache = [];
        this._offset_cache = [];
    }

    _draw_group_th(
        offset_cache: number[],
        d: number,
        column: unknown,
    ): HTMLTableCellElement {
        const th = this._get_cell("TH", d, offset_cache[d] || 0);
        offset_cache[d] += 1;
        th.removeAttribute("colspan");
        th.textContent = "";
        if (column instanceof HTMLElement) {
            th.appendChild(column);
        } else {
            const span = this._span_factory.get();
            span.textContent = String(column ?? "");
            th.appendChild(span);
        }

        const resizeSpan = this._span_factory.get();
        resizeSpan.className = "rt-column-resize";
        th.appendChild(resizeSpan);
        return th;
    }

    _draw_group(
        column: CellScalar[],
        column_name: unknown,
        th: HTMLTableCellElement,
    ): CellMetadata {
        const metadata = this._get_or_create_metadata(th);
        metadata.column_header = column;
        metadata.value = column_name;
        return metadata;
    }

    _draw_th(
        column: CellScalar[],
        column_name: unknown,
        th: HTMLTableCellElement,
        size_key: number | number[],
    ): CellMetadata {
        const metadata = this._get_or_create_metadata(th);
        metadata.column_header = column;
        metadata.value = column_name;
        metadata.size_key = Array.isArray(size_key) ? size_key[0] : size_key;
        if (!Array.isArray(size_key) || size_key.length <= 1) {
            const override_width =
                this._column_sizes.override[metadata.size_key || 0];
            const auto_width =
                this._column_sizes.auto[metadata.size_key || 0] || 0;

            // Handle clipping class for overridden columns
            if (override_width) {
                th.classList.toggle(
                    "rt-cell-clip",
                    auto_width > override_width,
                );
            } else {
                th.classList.remove("rt-cell-clip");
            }
        }

        return metadata;
    }

    get_column_header(cidx: number): HTMLTableCellElement {
        return this._get_cell("TH", this.num_rows() - 1, cidx);
    }

    draw(
        alias: CellScalar[],
        parts: CellScalar[],
        colspan: number | undefined,
        x: number | undefined,
        size_key: number | number[],
        x0: number,
        _virtual_x: number,
        column_header_merge_depth: number | undefined,
        merge_headers: boolean,
    ): HeaderDrawResult | undefined {
        const header_levels = parts?.length; //config.column_pivots.length + 1;
        if (header_levels === 0) return;
        let th: HTMLTableCellElement | undefined;
        let metadata: CellMetadata | undefined;
        let column_name: unknown;
        let output: HeaderDrawResult | undefined = undefined;
        column_header_merge_depth =
            typeof column_header_merge_depth === "undefined"
                ? header_levels - 1
                : column_header_merge_depth;
        for (let d = 0; d < header_levels; d++) {
            column_name = parts[d] ? parts[d] : "";
            this._offset_cache[d] = this._offset_cache[d] || 0;

            if (d < column_header_merge_depth) {
                if (
                    merge_headers &&
                    this._group_header_cache?.[d]?.[0]?.value === column_name
                ) {
                    th = this._group_header_cache[d][1];
                    this._group_header_cache[d][2] += 1;
                    if (colspan === 1) {
                        this._group_header_cache[d][0].row_header_x =
                            Array.isArray(size_key) ? size_key[0] : size_key;
                    }
                    th.setAttribute(
                        "colspan",
                        String(this._group_header_cache[d][2]),
                    );
                } else {
                    th = this._draw_group_th(
                        this._offset_cache,
                        d,
                        column_name,
                    );
                    metadata = this._draw_group(parts, column_name, th);
                    this._group_header_cache[d] = [metadata, th, 1];
                }
            } else {
                th = this._draw_group_th(this._offset_cache, d, column_name);

                // Update the group header's metadata such that each group
                // header has the same metadata coordinates of its rightmost
                // column.
                metadata = this._draw_th(
                    alias.length > 0 ? alias : parts,
                    column_name,
                    th,
                    size_key,
                );

                if (typeof output === "undefined") {
                    output = { th, metadata };
                }

                for (const [group_meta] of this._group_header_cache) {
                    group_meta.size_key = metadata.size_key;
                }

                th.removeAttribute("colspan");
            }

            this._get_row(d).tr.classList.toggle(
                "rt-autosize",
                d === column_header_merge_depth,
            );

            th.classList.toggle("rt-group-corner", x === undefined);
            if (metadata) {
                metadata.x = typeof x === "undefined" ? x : Math.floor(x);
                metadata.column_header_y = d;
                metadata.x0 = Math.floor(x0);
                metadata.virtual_x = _virtual_x;
                if (colspan === 1) {
                    metadata.row_header_x = Array.isArray(size_key)
                        ? size_key[0]
                        : size_key;
                }
            }
        }

        this._clean_rows(this._offset_cache.length);
        output = output || { th: th!, metadata: metadata! };
        return output;
    }

    clean(): void {
        this._clean_columns(this._offset_cache);
    }

    reset_header_cache(): void {
        this._offset_cache = [];
        this._group_header_cache = [];
    }
}
