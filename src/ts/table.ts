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
import { COLUMN_TAG_MAP } from "./view_model";

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
     * Estimate the width of a never-measured column from the average of all
     * measured columns, falling back to the same 60px guess used by the
     * scroll-range math. Used in place of mid-loop `offsetWidth` reads (which
     * force a synchronous layout per unvisited column); the viewport-filled
     * check re-validates against real measurements after the single batched
     * read pass in `autosize_cells`.
     */
    _estimated_column_width(): number {
        let total = 0,
            count = 0;
        for (const w of this._column_sizes.indices) {
            if (w) {
                total += w;
                count++;
            }
        }

        return count ? total / count : 60;
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

        const _virtual_x = row_headers_length;

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
        let missing_cidx = Math.max(dcidx + Math.floor(x0), 0);
        const new_viewport = structuredClone(viewport);
        new_viewport.start_col = missing_cidx;
        this._calculateViewportExtension(
            new_viewport,
            view_state,
            container_width,
            num_columns,
            _virtual_x,
            x0,
        );

        const new_col = await view(
            Math.floor(new_viewport.start_col),
            Math.floor(new_viewport.start_row),
            Math.ceil(new_viewport.end_col),
            Math.ceil(new_viewport.end_row),
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

        viewport.end_col = new_viewport.start_col + new_col.data.length;
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
        this.body.clean({
            ridx: cont_body?.ridx || 0,
            cidx: _virtual_x,
            drawn_ridx: cont_body?.drawn_ridx ?? cont_body?.ridx ?? 0,
        });
        this.header.clean();
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
let _instance_counter = 0;

export class RegularTableViewModel extends RegularTableViewModelBase {
    public table: HTMLTableElement;
    private _columnWidthStyleSheet?: CSSStyleSheet;
    private _columnWidthRules: Map<number, CSSStyleRule> = new Map();
    private _columnWidthCache: Map<number, string> = new Map();
    private _scope_class: string;
    private _lastDataResponse?: DataResponse;
    private _lastViewport?: Viewport;
    private _autosize_observer?: ResizeObserver;
    private _observed_cells: WeakSet<Element> = new WeakSet();
    private _measured_overrides: Record<number, number> = {};
    private _draw_in_flight = false;

    /**
     * Invoked (post-layout, from the autosize `ResizeObserver`) after any
     * observed column width amendment, so the host element can re-validate
     * viewport fill without a draw-path DOM read.
     */
    public _on_autosize_change?: () => void;

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

        // Instance-scoped class placed on the `<table>` so that this instance's
        // generated column-width rules (`.rt-scope-N .rt-col-K`) only match this
        // instance's cells, even when several `<regular-table>`s share a root.
        this._scope_class = `rt-scope-${_instance_counter++}`;
        this.table.classList.add(this._scope_class);

        this._autosize_observer = new ResizeObserver(
            this._on_autosize_entries.bind(this),
        );

        this.header = new RegularHeaderViewModel(
            column_sizes,
            table_clip,
            thead,
            (th) => this._observe_autosize(th),
        );

        this.body = new RegularBodyViewModel(column_sizes, table_clip, tbody);
    }

    dispose(): void {
        this._autosize_observer?.disconnect();
    }

    private _observe_autosize(cell: HTMLTableCellElement): void {
        if (!this._autosize_observer || this._observed_cells.has(cell)) {
            return;
        }

        this._observed_cells.add(cell);
        this._autosize_observer.observe(cell);
    }

    private _on_autosize_entries(entries: ResizeObserverEntry[]): void {
        if (this._draw_in_flight) {
            for (const entry of entries) {
                this._autosize_observer!.unobserve(entry.target);
                this._autosize_observer!.observe(entry.target);
            }

            return;
        }

        const zoom = this.table.currentCSSZoom ?? 1;
        const amendments: Array<[number, number]> = [];
        for (const entry of entries) {
            const size_key = COLUMN_TAG_MAP.get(entry.target);
            if (size_key === undefined) {
                continue;
            }

            if (this._column_sizes.override[size_key] !== undefined) {
                continue;
            }

            const width = entry.target.getBoundingClientRect().width / zoom;
            if (!width) {
                continue;
            }

            if (this._column_sizes.indices[size_key] !== width) {
                amendments.push([size_key, width]);
            }
        }

        if (amendments.length > 0) {
            this._ensureColumnWidthSheet();
            for (const [size_key, width] of amendments) {
                this._column_sizes.indices[size_key] = width;
                this._column_sizes.auto[size_key] = width;
                this._updateColumnRule(size_key);
            }

            this._on_autosize_change?.();
        }
    }

    num_columns(): number {
        return this.header.num_columns();
    }

    clear(element: HTMLElement): void {
        element.innerHTML =
            '<table cellspacing="0"><thead></thead><tbody></tbody></table>';
    }

    private _needs_autosize(last_cells: CellTuple[]): boolean {
        for (const [, metadata] of last_cells) {
            const size_key = metadata?.size_key;
            if (size_key === undefined) {
                return true;
            }

            const override_width = this._column_sizes.override[size_key];
            if (override_width !== undefined) {
                if (this._measured_overrides[size_key] !== override_width) {
                    return true;
                }
            } else if (!this._column_sizes.indices[size_key]) {
                return true;
            }
        }

        return false;
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
        const zoom = this.table.currentCSSZoom ?? 1;
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
                        this._column_sizes.row_height ?? box.height / zoom,
                        box.height / zoom,
                    ),
                );

            if (metadata?.size_key !== undefined) {
                this._column_sizes.indices[metadata.size_key] =
                    box.width / zoom;
                const override_width =
                    this._column_sizes.override[metadata.size_key];
                if (box.width / zoom && override_width === undefined) {
                    this._column_sizes.auto[metadata.size_key] =
                        box.width / zoom;
                }

                if (override_width !== undefined) {
                    this._measured_overrides[metadata.size_key] =
                        override_width;
                }
            }
        }
    }

    /**
     * Updates the generated column-width rules for the currently-visible
     * columns. Each column `size_key` owns exactly one `CSSStyleRule` keyed by a
     * stable `.rt-col-{size_key}` class (applied to cells by `_tagColumn`), so
     * widths are position-independent — no `:nth-of-type` bookkeeping, no
     * colspan/rowspan index gymnastics — and are updated surgically (a single
     * `rule.style` mutation for the changed column) instead of by re-serializing
     * the whole sheet.
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
        if (!this._ensureColumnWidthSheet()) {
            return;
        }

        // Row-header columns are keyed `0..row_headers_length-1`; data columns
        // continue from there offset by the horizontal scroll position. These
        // are exactly the `metadata.size_key` values carried by the cells.
        let row_headers_size_key;
        for (
            row_headers_size_key = 0;
            row_headers_size_key < row_headers_length;
            row_headers_size_key++
        ) {
            this._updateColumnRule(row_headers_size_key);
        }

        const start_col = Math.floor(viewport.start_col);
        for (
            let size_key = row_headers_size_key;
            size_key <
            row_headers_size_key + (Math.floor(viewport.end_col) - start_col);
            size_key++
        ) {
            this._updateColumnRule(size_key + start_col);
        }
    }

    /**
     * Apply the effective width for a single column `size_key` to its rule.
     * Override wins and clamps (min+max); auto is a grow-to-content floor
     * (min only); neither present clears the rule.
     */
    private _updateColumnRule(size_key: number): void {
        const override_width = this._column_sizes.override[size_key];
        const auto_width = this._column_sizes.auto[size_key];
        if (override_width !== undefined) {
            this._setColumnRule(size_key, override_width, override_width);
        } else if (auto_width !== undefined) {
            this._setColumnRule(size_key, auto_width, undefined);
        } else {
            this._clearColumnRule(size_key);
        }
    }

    /**
     * Lazily create — and re-adopt after a root change — the single stylesheet
     * holding this instance's per-column width rules. The sheet is adopted on
     * the cells' root node (the `<table>` is slotted into the light DOM, so a
     * sheet on `<regular-table>`'s own shadow root could not reach the cells);
     * instance-scoping via `_scope_class` keeps sibling tables from colliding.
     * Returns `undefined` when the root does not support `adoptedStyleSheets`.
     */
    private _ensureColumnWidthSheet(): CSSStyleSheet | undefined {
        const root = this.table.getRootNode() as {
            adoptedStyleSheets?: CSSStyleSheet[];
        };
        if (!root || !root.adoptedStyleSheets) {
            return undefined;
        }

        if (!this._columnWidthStyleSheet) {
            this._columnWidthStyleSheet = new CSSStyleSheet();
        }

        if (!root.adoptedStyleSheets.includes(this._columnWidthStyleSheet)) {
            root.adoptedStyleSheets = [
                ...root.adoptedStyleSheets,
                this._columnWidthStyleSheet,
            ];
        }

        return this._columnWidthStyleSheet;
    }

    private _getOrCreateColumnRule(size_key: number): CSSStyleRule | undefined {
        let rule = this._columnWidthRules.get(size_key);
        if (rule) {
            return rule;
        }

        const sheet = this._columnWidthStyleSheet;
        if (!sheet) {
            return undefined;
        }

        const index = sheet.cssRules.length;
        sheet.insertRule(`.${this._scope_class} .rt-col-${size_key}{}`, index);
        rule = sheet.cssRules[index] as CSSStyleRule;
        this._columnWidthRules.set(size_key, rule);
        return rule;
    }

    private _setColumnRule(
        size_key: number,
        min: number,
        max: number | undefined,
    ): void {
        const cache_value = max === undefined ? `${min}` : `${min}|${max}`;
        if (this._columnWidthCache.get(size_key) === cache_value) {
            return;
        }

        const rule = this._getOrCreateColumnRule(size_key);
        if (!rule) {
            return;
        }

        rule.style.minWidth = `${min}px`;
        if (max === undefined) {
            rule.style.removeProperty("max-width");
        } else {
            rule.style.maxWidth = `${max}px`;
        }

        this._columnWidthCache.set(size_key, cache_value);
    }

    private _clearColumnRule(size_key: number): void {
        if (this._columnWidthCache.get(size_key) === "") {
            return;
        }

        const rule = this._columnWidthRules.get(size_key);
        if (rule) {
            rule.style.removeProperty("min-width");
            rule.style.removeProperty("max-width");
        }

        this._columnWidthCache.set(size_key, "");
    }

    async _getDimState(view_cache: ViewCache): Promise<DataResponse> {
        if (!this._lastDataResponse) {
            return await view_cache.view(0, 0, 0, 0);
        }

        return this._lastDataResponse!;
    }

    _resetDimState() {
        this._lastDataResponse = undefined;
        this._lastViewport = undefined;
    }

    async draw(
        container_size: { width: number; height: number },
        view_cache: ViewCache,
        selected_id: number | undefined,
        preserve_width: boolean,
        viewport: Viewport,
        num_columns: number,
        style_callback: () => Promise<undefined>,
    ): Promise<undefined> {
        // Fetch and prepare initial data
        const view_response = (this._lastDataResponse = await view_cache.view(
            Math.floor(viewport.start_col),
            Math.floor(viewport.start_row),
            Math.ceil(viewport.end_col),
            Math.ceil(viewport.end_row),
        ));

        const render_pass = this._render_pass(
            container_size,
            view_cache,
            selected_id,
            preserve_width,
            viewport,
            num_columns,
            view_response,
        );

        this._draw_in_flight = true;
        try {
            let step = render_pass.next();
            while (!step.done) {
                await style_callback();
                step = render_pass.next(
                    step.value === "style"
                        ? undefined
                        : await step.value.fetch(),
                );
            }
        } finally {
            this._draw_in_flight = false;
            render_pass.return(false);
        }
    }

    /**
     * Synchronous variant of `draw()`, used by the commit closure returned
     * from `predraw()`. The data slab must be fully pre-fetched: `fetch`
     * effects yielded by the render pass are not executed (so the pass
     * finishes on its data-exhausted path when the slab runs dry), and
     * `style_callback` is invoked without being awaited.
     *
     * @returns `false` if `view_response` was exhausted before the viewport
     * was filled (e.g. the data set changed shape between plan and commit, or
     * a style listener shrank columns below their measured widths), in which
     * case the caller should schedule a corrective `draw()`; `true` otherwise.
     */
    draw_sync(
        container_size: { width: number; height: number },
        view_cache: ViewCache,
        selected_id: number | undefined,
        preserve_width: boolean,
        viewport: Viewport,
        num_columns: number,
        view_response: DataResponse,
        style_callback: () => void,
    ): boolean {
        this._lastDataResponse = view_response;
        const render_pass = this._render_pass(
            container_size,
            view_cache,
            selected_id,
            preserve_width,
            viewport,
            num_columns,
            view_response,
        );

        let step = render_pass.next();
        while (!step.done) {
            if (step.value === "style") {
                style_callback();
            }

            step = render_pass.next();
        }

        return step.value;
    }

    /**
     * The single render pass shared by `draw()` (which awaits each yielded
     * effect) and `draw_sync()` (which runs it to completion synchronously
     * against a pre-fetched slab). Yields `"style"` where style listeners
     * must be invoked, and `{ fetch }` thunks where additional column data
     * is required; a driver which cannot fetch resumes with `undefined` and
     * the pass finishes on its data-exhausted path.
     *
     * @returns `true` if the viewport was filled or the data set exhausted,
     * `false` if the pass ran out of data before the viewport was filled.
     */
    private *_render_pass(
        container_size: { width: number; height: number },
        view_cache: ViewCache,
        selected_id: number | undefined,
        preserve_width: boolean,
        viewport: Viewport,
        num_columns: number,
        view_response: DataResponse,
    ): Generator<
        "style" | { fetch: () => Promise<FetchResult> },
        boolean,
        FetchResult | undefined
    > {
        const { width: container_width, height: container_height } =
            container_size;

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
            this._row_headers_length = view_response.num_row_headers ?? maxLen;

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

        const has_row_headers =
            !!view_response.row_headers &&
            (view_response.row_headers.length > 0 || row_headers_length > 0);

        if (has_row_headers) {
            const row_header_result = this._drawRowHeaders(
                view_response.row_headers!,
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
            let unmeasured_col_width = 0;
            const num_visible_columns = num_columns - viewport.start_col;

            const warm = this._column_sizes.indices.some(Boolean);
            while (dcidx < num_visible_columns) {
                // Fetch missing columns if needed
                if (!view_response.data[dcidx]) {
                    // Style the partially-renderd rows so there is no FOUT
                    this.header.flush_colspans();
                    this.updateColumnWidthStyles(
                        viewport,
                        view_cache.row_headers_length,
                    );

                    const fetch_result = yield {
                        fetch: () =>
                            this._fetchMissingColumns(
                                viewport,
                                view,
                                view_response,
                                dcidx,
                                view_state,
                                container_width,
                                num_columns,
                                _virtual_x,
                                x0,
                            ),
                    };

                    if (fetch_result?.column_header_merge_depth !== undefined) {
                        column_header_merge_depth =
                            fetch_result.column_header_merge_depth;
                    }

                    if (fetch_result?.merge_headers !== undefined) {
                        merge_headers = fetch_result.merge_headers;
                    }

                    if (!view_response.data[dcidx]) {
                        this._cleanupAfterDraw(cont_body, _virtual_x);
                        this.updateColumnWidthStyles(
                            viewport,
                            view_cache.row_headers_length,
                        );

                        yield "style";
                        if (this._needs_autosize(last_cells)) {
                            this.autosize_cells(
                                last_cells,
                                this._column_sizes.row_height,
                            );
                        }

                        return this._isViewportFilled(
                            view_state,
                            container_width,
                        );
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

                // Update dimensions. The first never-measured column drawn in
                // a pass is read once and its width reused for subsequent
                // unmeasured columns, rather than forcing a synchronous layout
                // per new column. The viewport-filled check below re-validates
                // against real measurements after a batched read pass, so a
                // width difference among new columns cannot under-fill.
                let col_width =
                    this._column_sizes.indices[_virtual_x + Math.floor(x0)] ||
                    (warm ? unmeasured_col_width : 0);

                if (!col_width) {
                    col_width = cont_head?.th?.offsetWidth || 0;
                    if (!col_width) {
                        for (const { td } of cont_body.tds) {
                            col_width += td?.offsetWidth || 0;
                        }
                    }

                    unmeasured_col_width = col_width;
                }

                view_state.viewport_width += col_width;
                view_state.row_height =
                    view_state.row_height || cont_body.row_height;

                _virtual_x++;
                dcidx++;

                // Check if viewport filled
                if (this._isViewportFilled(view_state, container_width)) {
                    this._cleanupAfterDraw(cont_body, _virtual_x);
                    this.updateColumnWidthStyles(
                        viewport,
                        view_cache.row_headers_length,
                    );

                    yield "style";

                    // `preserve_width` draws skip measurement, so the
                    // estimate-based filled check above is final; a follow-up
                    // draw (e.g. on resize mouseup) re-measures.
                    if (preserve_width) {
                        return true;
                    }

                    // Recalculate after style listeners
                    view_state.viewport_width = 0;
                    if (this._needs_autosize(last_cells)) {
                        this.autosize_cells(
                            last_cells,
                            this._column_sizes.row_height,
                        );
                    }

                    // Newly-visited columns are now measured; force a fresh
                    // read if a later pass draws further unmeasured columns.
                    unmeasured_col_width = 0;

                    const row_headers_length =
                        view_state.row_headers_length || 0;
                    for (let i = 0; i < last_cells.length; i++) {
                        const size_key =
                            i < row_headers_length ? i : Math.floor(x0) + i;
                        view_state.viewport_width +=
                            this._column_sizes.indices[size_key] || 0;
                    }

                    if (this._isViewportFilled(view_state, container_width)) {
                        return true;
                    }
                }
            }

            this._cleanupAfterDraw(cont_body, _virtual_x);
            this.updateColumnWidthStyles(
                viewport,
                view_cache.row_headers_length,
            );

            yield "style";
            if (this._needs_autosize(last_cells)) {
                this.autosize_cells(last_cells, this._column_sizes.row_height);
            }

            return true;
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
