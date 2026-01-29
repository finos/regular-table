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

import { RegularHeaderViewModel } from "./thead";
import { RegularBodyViewModel } from "./tbody";
import {
    BodyDrawResult,
    CellScalar,
    CellTuple,
    CellMetadata,
    ColumnState,
    DataColumnDrawResult,
    FetchResult,
    RowHeadersResult,
    ViewCache,
    ViewFunction,
    Viewport,
    DataResponse,
    ViewState,
} from "./types";
import { ColumnSizes } from "./types";

/**
 * Base class containing protected helper methods for table rendering.
 * This class provides the internal implementation details for drawing
 * and managing table view state.
 *
 * @class RegularTableViewModelBase
 */
abstract class RegularTableViewModelBase {
    public _column_sizes!: ColumnSizes;
    public _row_headers_length: number = 0;
    public header!: RegularHeaderViewModel;
    public body!: RegularBodyViewModel;

    /**
     * Initializes view state with viewport and sizing information.
     */
    protected _initializeViewState(
        viewport: Viewport,
        selected_id: number | undefined,
    ): ViewState {
        const {
            start_row: ridx_offset = 0,
            start_col: x0 = 0,
            end_col: x1 = 0,
            end_row: y1 = 0,
        } = viewport;

        const sub_cell_offset =
            this._column_sizes.indices[
                (this._row_headers_length || 0) + Math.floor(viewport.start_col)
            ] ?? 0;

        return {
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
    }

    /**
     * Draws row headers and returns updated state.
     */
    protected _drawRowHeaders(
        row_headers: CellScalar[][],
        row_headers_length: number,
        column_headers_length: number,
        container_height: number,
        view_state: ViewState,
        preserve_width: boolean,
        x0: number,
        column_header_merge_depth: number | undefined,
        merge_column_headers: boolean,
        merge_row_headers: boolean,
    ): RowHeadersResult {
        const column_name = [`${row_headers_length}`];
        const last_cells: CellTuple[] = [];

        const column_state: ColumnState<CellScalar[]> = {
            column_name,
            cidx: 0,
            column_data: row_headers,
            row_headers,
            first_col: true,
        };

        const size_key = Math.floor(x0);
        const cont_body = this.body.draw(
            container_height,
            column_state,
            { ...view_state, x0: 0 },
            true,
            undefined,
            undefined,
            size_key,
            merge_row_headers,
        );

        const cont_heads = [];
        for (let i = 0; i < row_headers_length; i++) {
            const header = this.header.draw(
                column_name,
                Array(column_headers_length).fill(""),
                1,
                undefined,
                i,
                x0,
                i,
                column_header_merge_depth,
                merge_column_headers,
            );
            if (!!header) {
                cont_heads.push(header);
            }
        }

        for (let i = 0; i < cont_heads.length; i++) {
            const { th } = cont_heads[i];
            view_state.viewport_width +=
                this._column_sizes.indices[i] || th.offsetWidth;
        }
        view_state.row_height = view_state.row_height || cont_body.row_height;

        const _virtual_x = row_headers[0].length;

        if (!preserve_width) {
            for (let i = 0; i < row_headers_length; i++) {
                const { td, metadata } = cont_body.tds[i] || {};
                const { th, metadata: hmetadata } = cont_heads[i] || {};
                if (!!td || !!th) {
                    last_cells.push([th || td, hmetadata || metadata]);
                }
            }
        }

        return { cont_body, first_col: false, _virtual_x, last_cells };
    }

    /**
     * Calculates how many additional columns are needed to fill the viewport.
     */
    protected _calculateViewportExtension(
        viewport: Viewport,
        view_state: ViewState,
        container_width: number,
        num_columns: number,
        _virtual_x: number,
        x0: number,
    ): void {
        let end_col_offset = 0,
            size_extension = 0;

        while (
            this._column_sizes.indices.length >
                _virtual_x + x0 + end_col_offset + 1 &&
            size_extension + view_state.viewport_width < container_width
        ) {
            end_col_offset++;
            size_extension +=
                this._column_sizes.indices[_virtual_x + x0 + end_col_offset] ||
                0;
        }

        if (size_extension + view_state.viewport_width < container_width) {
            const estimate = Math.min(num_columns, viewport.start_col + 5);
            viewport.end_col = Math.max(1, Math.min(num_columns, estimate));
        } else {
            viewport.end_col = Math.max(
                1,
                Math.min(num_columns, viewport.start_col + end_col_offset),
            );
        }
    }

    /**
     * Draws a single data column and returns rendering information.
     */
    protected _drawDataColumn(
        dcidx: number,
        view_response: DataResponse,
        _virtual_x: number,
        x0: number,
        container_height: number,
        view_state: ViewState,
        first_col: boolean,
        column_header_merge_depth: number | undefined,
        merge_column_headers: boolean,
        merge_row_headers: boolean,
    ): DataColumnDrawResult {
        const column_name = view_response.column_headers?.[dcidx] || [];
        const column_data = view_response.data[dcidx];
        const column_data_listener_metadata = view_response.metadata?.[dcidx];
        const column_state: ColumnState = {
            column_name,
            cidx: _virtual_x,
            column_data,
            column_data_listener_metadata,
            row_headers: view_response.row_headers,
            first_col,
        };

        const x = dcidx + x0;
        const size_key = _virtual_x + Math.floor(x0);
        const cont_head = this.header.draw(
            column_name,
            column_name,
            undefined,
            x,
            size_key,
            x0,
            _virtual_x,
            column_header_merge_depth,
            merge_column_headers,
        );

        const cont_body = this.body.draw(
            container_height,
            column_state,
            view_state,
            false,
            x,
            x0,
            size_key,
            merge_row_headers,
        );

        return { cont_head, cont_body };
    }

    /**
     * Fetches additional columns when data is missing during rendering.
     */
    protected async _fetchMissingColumns(
        viewport: Viewport,
        view: ViewFunction,
        view_response: DataResponse,
        dcidx: number,
        view_state: ViewState,
        container_width: number,
        num_columns: number,
        _virtual_x: number,
        x0: number,
    ): Promise<FetchResult> {
        let missing_cidx = Math.max(viewport.end_col, 0);
        viewport.start_col = missing_cidx;
        this._calculateViewportExtension(
            viewport,
            view_state,
            container_width,
            num_columns,
            _virtual_x,
            x0,
        );

        const new_col = await view(
            Math.floor(viewport.start_col),
            Math.floor(viewport.start_row),
            Math.ceil(viewport.end_col),
            Math.ceil(viewport.end_row),
        );

        let column_header_merge_depth: number | undefined;
        let merge_headers: "both" | "row" | "column" | undefined;

        if (typeof new_col.column_header_merge_depth !== "undefined") {
            column_header_merge_depth = new_col.column_header_merge_depth;
        }

        if (typeof new_col.merge_headers !== "undefined") {
            merge_headers = new_col.merge_headers;
        }

        if (new_col.data.length === 0) {
            return { column_header_merge_depth, merge_headers };
        }

        viewport.end_col = viewport.start_col + new_col.data.length;
        for (let i = 0; i < new_col.data.length; i++) {
            view_response.data[dcidx + i] = new_col.data[i];
            if (new_col.metadata && view_response.metadata) {
                view_response.metadata[dcidx + i] = new_col.metadata[i];
            }

            if (view_response.column_headers && new_col.column_headers?.[i]) {
                view_response.column_headers[dcidx + i] =
                    new_col.column_headers[i];
            }
        }

        return { column_header_merge_depth, merge_headers };
    }

    /**
     * Cleans up body and header after drawing.
     */
    protected _cleanupAfterDraw(
        cont_body: BodyDrawResult | undefined,
        _virtual_x: number,
    ): void {
        this.body.clean({ ridx: cont_body?.ridx || 0, cidx: _virtual_x });
        this.header.clean();
        this.body._span_factory.reset();
        this.header._span_factory.reset();
    }
}

/**
 * <table> view model. In order to handle unknown column width when `draw()`
 * is called, this model will iteratively fetch more data to fill in columns
 * until the page is complete, and makes some column viewport estimations
 * when this information is not availble.
 *
 * @class RegularTableViewModel
 */
export class RegularTableViewModel extends RegularTableViewModelBase {
    public table: HTMLTableElement;
    private _columnWidthStyleSheet?: CSSStyleSheet;
    private _lastColumnWidthCss?: string;

    constructor(
        table_clip: HTMLElement,
        column_sizes: ColumnSizes,
        element: HTMLElement,
    ) {
        super();
        this._column_sizes = column_sizes;
        this.clear(element);
        const [table] = element.children as HTMLCollectionOf<HTMLTableElement>;
        const [thead, tbody] =
            table.children as HTMLCollectionOf<HTMLTableSectionElement>;

        this.table = table;
        this.header = new RegularHeaderViewModel(
            column_sizes,
            table_clip,
            thead,
        );

        this.body = new RegularBodyViewModel(column_sizes, table_clip, tbody);
    }

    num_columns(): number {
        return this.header.num_columns();
    }

    clear(element: HTMLElement): void {
        element.innerHTML =
            '<table cellspacing="0"><thead></thead><tbody></tbody></table>';
    }

    /**
     * Calculate amendments to auto size from this render pass.
     * Uses adoptedStyleSheets with :nth-child selectors for optimal performance.
     *
     * This method separates DOM reads (getBoundingClientRect) from DOM writes
     * (CSS stylesheet updates) to minimize forced reflows. All measurements are
     * collected first, then column size data is updated, and finally all column
     * widths (both auto and override) are applied via a single stylesheet update.
     */
    autosize_cells(
        last_cells: CellTuple[],
        override_row_height?: number,
    ): void {
        const measurements: Array<{
            cell: HTMLElement;
            metadata: CellMetadata | undefined;
            box: DOMRect;
        }> = [];

        for (const [cell, metadata] of last_cells) {
            const box = cell.getBoundingClientRect();
            measurements.push({ cell, metadata, box });
        }

        for (const { metadata, box } of measurements) {
            this._column_sizes.row_height =
                override_row_height ??
                Math.max(
                    10,
                    Math.min(
                        this._column_sizes.row_height ?? box.height,
                        box.height,
                    ),
                );

            if (metadata?.size_key !== undefined) {
                this._column_sizes.indices[metadata.size_key] = box.width;
                if (
                    box.width &&
                    this._column_sizes.override[metadata.size_key] === undefined
                ) {
                    this._column_sizes.auto[metadata.size_key] = box.width;
                }
            }
        }
    }

    clearWidthStyles() {
        this._columnWidthStyleSheet?.replaceSync("");
    }

    /**
     * Updates column width styles for all columns using adoptedStyleSheets.
     * Generates CSS rules with :nth-child selectors for both auto-sized and
     * overridden column widths, applying them all in a single stylesheet update.
     *
     * This method should be called whenever column sizes change, including:
     * - After autosize_cells() measurements
     * - When user resizes columns
     * - When resetAutoSize() is called
     */
    updateColumnWidthStyles(
        viewport: Viewport,
        row_headers_length: number,
    ): void {
        const cssRules: string[] = [];

        let row_headers_size_key;
        for (
            row_headers_size_key = 0;
            row_headers_size_key < row_headers_length;
            row_headers_size_key++
        ) {
            const override_width =
                this._column_sizes.override[row_headers_size_key];
            const auto_width = this._column_sizes.auto[row_headers_size_key];
            if (override_width !== undefined) {
                // Override width takes precedence
                // CSS :nth-child is 1-indexed
                const columnIndex = row_headers_size_key + 1; // - Math.floor(viewport.start_col);

                cssRules.push(
                    `thead tr.rt-autosize th:nth-child(${columnIndex}),`,
                    `tbody td.rt-cell-clip:nth-child(${columnIndex})`,
                    `{min-width:${override_width}px;max-width:${override_width}px;}`,
                );
            } else if (auto_width !== undefined) {
                // Auto width applies when no override
                const columnIndex = row_headers_size_key + 1; // - Math.floor(viewport.start_col);
                cssRules.push(
                    `thead tr.rt-autosize th:nth-child(${columnIndex}),`,
                    `tbody td.rt-cell-clip:nth-child(${columnIndex})`,
                    `{min-width:${auto_width}px;max-width:none;}`,
                );
            }
        }

        for (
            let size_key = row_headers_size_key;
            size_key <
            row_headers_size_key +
                (Math.floor(viewport.end_col) - Math.floor(viewport.start_col));
            size_key++
        ) {
            const override_width =
                this._column_sizes.override[
                    size_key + Math.floor(viewport.start_col)
                ];
            const auto_width =
                this._column_sizes.auto[
                    size_key + Math.floor(viewport.start_col)
                ];

            if (override_width !== undefined) {
                // Override width takes precedence
                // CSS :nth-child is 1-indexed
                const columnIndex = size_key + 1; //  Math.floor(viewport.start_col);
                cssRules.push(
                    `thead tr.rt-autosize th:nth-child(${columnIndex}),`,
                    `tbody td.rt-cell-clip:nth-child(${columnIndex})`,
                    `{min-width:${override_width}px;max-width:${override_width}px;}`,
                );
            } else if (auto_width !== undefined) {
                // Auto width applies when no override
                const columnIndex = size_key + 1; // Math.floor(viewport.start_col);
                cssRules.push(
                    `thead tr.rt-autosize th:nth-child(${columnIndex}),`,
                    `tbody td.rt-cell-clip:nth-child(${columnIndex})`,
                    `{min-width:${auto_width}px;max-width:none;}`,
                );
            }
        }

        // Apply all rules via single stylesheet update
        if (cssRules.length > 0) {
            this._applyColumnWidthStyles(cssRules.join("\n"));
        } else if (this._columnWidthStyleSheet) {
            this._columnWidthStyleSheet.replaceSync("");
        }
    }

    /**
     * Applies column width styles using adoptedStyleSheets.
     * Creates or updates a dedicated stylesheet for column widths.
     * Caches the CSS string to avoid redundant replaceSync calls.
     */
    private _applyColumnWidthStyles(css: string): void {
        if (css === this._lastColumnWidthCss) {
            return;
        }

        const shadowRoot = this.table.getRootNode() as ShadowRoot;
        if (!shadowRoot || !shadowRoot.adoptedStyleSheets) {
            return;
        }

        // Find or create the column width stylesheet
        if (!this._columnWidthStyleSheet) {
            this._columnWidthStyleSheet = new CSSStyleSheet();
            shadowRoot.adoptedStyleSheets = [
                ...shadowRoot.adoptedStyleSheets,
                this._columnWidthStyleSheet,
            ];
        }

        this._columnWidthStyleSheet.replaceSync(css);
        this._lastColumnWidthCss = css;
    }

    async *draw(
        container_size: { width: number; height: number },
        view_cache: ViewCache,
        selected_id: number | undefined,
        preserve_width: boolean,
        viewport: Viewport,
        num_columns: number,
    ): AsyncGenerator<CellTuple[] | undefined, void, unknown> {
        const { width: container_width, height: container_height } =
            container_size;

        // Fetch and prepare initial data
        const view_response = await view_cache.view(
            Math.floor(viewport.start_col),
            Math.floor(viewport.start_row),
            Math.ceil(viewport.end_col),
            Math.ceil(viewport.end_row),
        );

        let { column_header_merge_depth, merge_headers = "both" } =
            view_response;

        const merge_row_headers =
            merge_headers === "both" || merge_headers === "row";
        const merge_column_headers =
            merge_headers === "both" || merge_headers === "column";
        const x0 = viewport.start_col ?? 0;

        if (view_response.row_headers) {
            let maxLen = 0;
            for (const rh of view_response.row_headers) {
                if (rh.length > maxLen) maxLen = rh.length;
            }
            this._row_headers_length = maxLen;

            for (let i = 0; i < view_response.row_headers.length; i++) {
                view_response.row_headers[i].length =
                    this._row_headers_length || 0;
            }
        }

        // Update view cache lengths
        view_cache.row_headers_length =
            view_response.num_row_headers ??
            view_response.row_headers?.[0]?.length ??
            0;

        view_cache.column_headers_length =
            view_response.num_column_headers ??
            view_response.column_headers?.[0]?.length ??
            0;

        const { view, row_headers_length, column_headers_length } = view_cache;
        const view_state = this._initializeViewState(viewport, selected_id);

        // Draw row headers
        let cont_body: BodyDrawResult | undefined;
        let _virtual_x = 0;
        let last_cells: CellTuple[] = [];
        let first_col = true;

        if (view_response.row_headers?.length) {
            const row_header_result = this._drawRowHeaders(
                view_response.row_headers,
                row_headers_length,
                column_headers_length,
                container_height,
                view_state,
                preserve_width,
                x0,
                column_header_merge_depth,
                merge_column_headers,
                merge_row_headers,
            );
            cont_body = row_header_result.cont_body;
            first_col = row_header_result.first_col;
            _virtual_x = row_header_result._virtual_x;
            last_cells = row_header_result.last_cells;
        }

        // Draw data columns
        try {
            let dcidx = 0;
            const num_visible_columns = num_columns - viewport.start_col;

            while (dcidx < num_visible_columns) {
                // Fetch missing columns if needed
                if (!view_response.data[dcidx]) {
                    // Style the partially-renderd rows so there is no FOUT
                    yield undefined;
                    const fetch_result = await this._fetchMissingColumns(
                        viewport,
                        view,
                        view_response,
                        dcidx,
                        view_state,
                        container_width,
                        num_columns,
                        _virtual_x,
                        x0,
                    );

                    if (fetch_result.column_header_merge_depth !== undefined) {
                        column_header_merge_depth =
                            fetch_result.column_header_merge_depth;
                    }

                    if (fetch_result.merge_headers !== undefined) {
                        merge_headers = fetch_result.merge_headers;
                    }

                    if (!view_response.data[dcidx]) {
                        this._cleanupAfterDraw(cont_body, _virtual_x);
                        yield last_cells;
                        return;
                    }
                }

                // Draw column
                const { cont_head, cont_body: drawn_body } =
                    this._drawDataColumn(
                        dcidx,
                        view_response,
                        _virtual_x,
                        x0,
                        container_height,
                        view_state,
                        first_col,
                        column_header_merge_depth,
                        merge_column_headers,
                        merge_row_headers,
                    );

                cont_body = drawn_body;
                first_col = false;

                // Collect cells for autosizing
                if (!preserve_width) {
                    for (const { td, metadata } of cont_body.tds) {
                        last_cells.push([
                            cont_head?.th || td,
                            cont_head?.metadata || metadata,
                        ]);
                    }
                }

                // Update dimensions
                let col_width =
                    this._column_sizes.indices[_virtual_x + Math.floor(x0)] ||
                    cont_head?.th?.offsetWidth;

                if (!col_width) {
                    col_width = 0;
                    for (const { td } of cont_body.tds) {
                        col_width += td?.offsetWidth || 0;
                    }
                }

                view_state.viewport_width += col_width;
                view_state.row_height =
                    view_state.row_height || cont_body.row_height;

                _virtual_x++;
                dcidx++;

                // Check if viewport filled
                if (this._isViewportFilled(view_state, container_width)) {
                    this._cleanupAfterDraw(cont_body, _virtual_x);
                    yield last_cells;

                    // Recalculate after style listeners
                    view_state.viewport_width = 0;
                    for (const [td] of last_cells) {
                        view_state.viewport_width += td.offsetWidth;
                    }

                    if (this._isViewportFilled(view_state, container_width)) {
                        return;
                    }
                }
            }

            this._cleanupAfterDraw(cont_body, _virtual_x);
            yield last_cells;
        } finally {
            this._cleanupAfterDraw(cont_body, _virtual_x);
        }
    }

    private _isViewportFilled(
        view_state: ViewState,
        container_width: number,
    ): boolean {
        return (
            view_state.viewport_width - view_state.sub_cell_offset >
            container_width
        );
    }
}
