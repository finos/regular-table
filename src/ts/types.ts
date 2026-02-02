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

import type { RegularTableElement } from "./regular-table.ts";

/**
 * The `DataListener` is similar to a normal event listener function.
 * Unlike a normal event listener, it takes regular arguments (not an
 * `Event`); and returns a `Promise` for a `DataResponse` object for this
 * region (as opposed to returning `void` as a standard event listener).
 *
 * @param {number} x0 - The origin `x` index (column).
 * @param {number} y0 - The origin `y` index (row).
 * @param {number} x1 - The corner `x` index (column).
 * @param {number} y1 - The corner `y` index (row).
 * @returns {Promise<DataResponse>} The resulting `DataResponse`.  Make sure
 * to `resolve` or `reject` the `Promise`, or your `<regular-table>` will
 * never render!
 */
export type DataListener = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
) => Promise<DataResponse>;

/**
 * An object describing virtual rendering metadata about an
 * `HTMLTableCellElement`, use this object to map rendered `<th>` or `<td>`
 * elements back to your `data`, `row_headers` or `column_headers` within
 * listener functions for `addStyleListener()` and `addEventListener()`.
 *
 * MetaData                     (x = 0, column_header_y = 0)
 *                              *-------------------------------------+
 *                              |                                     |
 *                              |                                     |
 *                              +-------------------------------------+
 * (row_header_x = 0, y = 0)    (x = 0, y = 0)
 * *------------------------+   *-------------------------------------+
 * |                        |   |                                     |
 * |                        |   |      (x0, y0)                       |
 * |                        |   |      *---------------*              |
 * |                        |   |      |               |              |
 * |                        |   |      |     * (x, y)  |              |
 * |                        |   |      |               |              |
 * |                        |   |      *---------------* (x1, y1)     |
 * |                        |   |                                     |
 * +------------------------+   +-------------------------------------+
 *
 * @property {number} [x] - The `x` index in your virtual data model.
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [y] - The `y` index in your virtual data model.
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [x0] - The `x` index of the viewport origin in
 * your data model, e.g. what was passed to `x0` when your
 * `dataListener` was invoked.
 * @property {number} [y0] - The `y` index of the viewport origin in
 * your data model, e.g. what was passed to `y0` when your
 * `dataListener` was invoked.
 * @property {number} [x1] - The `x` index of the viewport corner in
 * your data model, e.g. what was passed to `x1` when your
 * `dataListener` was invoked.
 * @property {number} [y1] - The `y` index of the viewport corner in
 * your data model, e.g. what was passed to `y1` when your
 * `dataListener` was invoked.
 * @property {number} [dx] - The `x` index in `DataResponse.data`, this
 * property is only generated for `<td>`, and `<th>` from `column_headers`.
 * @property {number} [dy] - The `y` index in `DataResponse.data`, this
 * property is only generated for `<td>`, `<th>` from `row_headers`.
 * @property {number} [column_header_y] - The `y` index in
 * `DataResponse.column_headers[x]`, this property is only generated for `<th>`
 * from `column_headers`.
 * @property {number} [row_header_x] - The `x` index in
 * `DataResponse.row_headers[y]`, this property is only generated for `<th>`
 * from `row_headers`.
 * @property {number} size_key - The unique index of this column in a full
 * `<table>`, which is `x` + (Total Row Header Columns).
 * @property {(string|HTMLElement)[]} [row_header] - The `Array` for this `y` in
 * `DataResponse.row_headers`, if it was provided.
 * @property {(string|HTMLElement)[]} [column_header] - The `Array` for this `x`
 * in `DataResponse.column_headers`, if it was provided.
 * @property {(string|HTMLElement)} [value] - The value dispalyed in the cell or
 * header.
 */

export interface CellMetadata {
    column_header?: CellScalar[];
    row_header?: CellScalar[];
    value: unknown;
    size_key?: number;
    x?: number;
    column_header_y?: number;
    x0?: number;
    virtual_x?: number;
    row_header_x?: number;
    y?: number;
    y0?: number;
    y1?: number;
    x1?: number;
    user?: unknown;
    dx?: number;
    dy?: number;
}

/**
 * The `DataResponse` object describes a rectangular region of a virtual
 * data set, and some associated metadata.  `<regular-table>` will use this
 * object to render the `<table>`, though it may make multiple requests for
 * different regions to achieve a compelte render as it must estimate
 * certain dimensions.  You must construct a `DataResponse` object to
 * implement a `DataListener`.
 *
 * # Examples
 *
 * ```json
 * {
 *     "num_rows": 26,
 *     "num_columns": 3,
 *     "data": [
 *         [0, 1],
 *         ["A", "B"]
 *     ],
 *     "row_headers": [
 *         ["Rowgroup 1", "Row 1"],
 *         ["Rowgroup 1", "Row 2"]
 *     ],
 *     "column_headers": [
 *         ["Colgroup 1", "Column 1"],
 *         ["Colgroup 1", "Column 2"]
 *     ]
 * }
 * ```
 *
 * @property {(string|HTMLElement)[][]} [column_headers] - A two dimensional
 * `Array` of column group headers, in specificity order.  No `<thead>`
 * will be generated if this property is not provided.
 * @property {(string|HTMLElement)[][]} [row_headers] - A two dimensional
 * `Array` of row group headers, in specificity order.  No `<th>`
 * elements within `<tbody>` will be generated if this property is not
 * provided.
 * @property {number?} num_row_headers - Optional number of row headers.
 * @property {number?} num_row_headers - Optional number of column headers.
 * @property {(string|HTMLElement)[][]} data - A two dimensional `Array`
 * representing a rectangular section of the underlying data set from
 * (x0, y0) to (x1, y1), arranged in columnar fashion such that
 * `data[x][y]` returns the `y`th row of the `x`th column of the slice.
 * @property {number} num_rows - Total number of rows in the underlying
 * data set.
 * @property {number} num_columns - Total number of columns in the
 * underlying data set.
 */
export interface DataResponse {
    data: CellScalar[][];
    num_columns: number;
    num_rows: number;
    row_height?: number;
    row_headers?: CellScalar[][];
    column_headers?: CellScalar[][];
    metadata?: unknown[][];
    num_row_headers?: number;
    num_column_headers?: number;
    column_header_merge_depth?: number;
    merge_headers?: "both" | "row" | "column";
}

/**
 *
 * @param {boolean} options.preserve_state If `setDataListener` has already been
 * called, setting this flag will prevent the internal state from being
 * reset (other than the callback itself).
 * @param {("both"|"horizontal"|"vertical"|"none")} options.virtual_mode
 * The `virtual_mode` options flag may be one of "both", "horizontal",
 * "vertical", or "none" indicating which dimensions of the table should be
 * virtualized (vs. rendering completely).
 */
export interface SetDataListenerOptions {
    virtual_mode?: VirtualMode;
    preserve_state?: boolean;
}

/**
 * An object with performance statistics about calls to
 * `draw()` from some time interval (captured in milliseconds by the
 * `elapsed` proprty).
 *
 * @property {number} avg - Avergage milliseconds per call.
 * @property {number} real_fps - `num_frames` / `elapsed`
 * @property {number} virtual_fps - `elapsed` / `avg`
 * @property {number} num_frames - Number of frames rendered.
 * @property {number} elapsed - Number of milliseconds since last call
 * to `getDrawFPS()`.
 */
export interface FPSRecord {
    avg: number;
    real_fps: number;
    virtual_fps: number;
    num_frames: number;
    elapsed: number;
}

export type StyleCallback = (event: {
    detail: RegularTableElement;
}) => void | Promise<void>;

/**
 * Virtual mode type
 */
export type VirtualMode = "both" | "horizontal" | "vertical" | "none";

/**
 * View cache containing view function and configuration
 */
export interface ViewCache {
    view: ViewFunction;
    row_headers_length: number;
    column_headers_length: number;
}

export type CellScalar = number | string | boolean | null;

/**
 * Container size information
 */
export interface ContainerSize {
    width: number;
    height: number;
    containerHeight: number;
}

/**
 * Viewport range
 */
export interface Viewport {
    start_col: number;
    end_col: number;
    start_row: number;
    end_row: number;
}

/**
 * Validation result for viewport
 */
export interface ViewportValidation {
    invalid_column: boolean;
    invalid_row: boolean;
}

/**
 * Options for the draw method
 */
export interface DrawOptions {
    invalid_viewport?: boolean;
    preserve_width?: boolean;
    throttle?: boolean;
    cache?: boolean;
}

/**
 * View state containing viewport and rendering information
 */
export interface ViewState {
    viewport_width: number;
    selected_id: number | undefined;
    ridx_offset: number;
    sub_cell_offset: number;
    x0: number;
    x1: number;
    y1: number;
    row_height: number | undefined;
    row_headers_length: number | undefined;
}

/**
 * View function type that fetches data for a given viewport range
 */
export type ViewFunction = (
    start_col: number,
    start_row: number,
    end_col: number,
    end_row: number,
) => Promise<DataResponse>;

/**
 * Column state for rendering a single column.
 */
export interface ColumnState<T = CellScalar> {
    column_name: CellScalar[];
    cidx: number;
    column_data: T[];
    column_data_listener_metadata?: unknown[];
    row_headers?: CellScalar[][];
    first_col: boolean;
}

export type RowHeaderColumnState = ColumnState<CellScalar[]>;

/**
 * Result from drawing row headers
 */
export interface RowHeadersResult {
    cont_body: BodyDrawResult;
    first_col: boolean;
    _virtual_x: number;
    last_cells: CellTuple[];
}

/**
 * Tuple of cell element and its metadata for autosizing
 */
export type CellTuple = [HTMLTableCellElement, CellMetadata | undefined];

/**
 * Result from drawing header cells
 */
export interface HeaderDrawResult {
    th: HTMLTableCellElement;
    metadata: CellMetadata;
}

/**
 * Result from drawing body cells
 */
export interface BodyDrawResult {
    tds: Array<{ td: HTMLTableCellElement; metadata: CellMetadata }>;
    row_height?: number;
    ridx?: number;
}

/**
 * Result from drawing a data column (header and body)
 */
export interface DataColumnDrawResult {
    cont_head: HeaderDrawResult | undefined;
    cont_body: BodyDrawResult;
}

/**
 * Result from fetching missing columns
 */
export interface FetchResult {
    column_header_merge_depth: number | undefined;
    merge_headers: "both" | "row" | "column" | undefined;
}

/**
 * Column sizing information for the table
 */
export interface ColumnSizes {
    auto: (number | undefined)[];
    override: Record<number, number>;
    indices: (number | undefined)[];
    row_height?: number;
}
