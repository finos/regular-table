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

import { RegularViewEventModel } from "./events";
import { RegularTableViewModel } from "./table";
import {
    CellMetadata,
    DataListener,
    FPSRecord,
    SetDataListenerOptions,
} from "./types";
import { get_draw_fps } from "./utils";
import { METADATA_MAP } from "./view_model";

type VirtualMode = "both" | "horizontal" | "vertical" | "none";

const VIRTUAL_MODES: VirtualMode[] = ["both", "horizontal", "vertical", "none"];

/**
 * The `<regular-table>` custom element.
 *
 * This module has no exports, but importing it has a side effect: the
 * `RegularTableElement` class is registered as a custom element, after which
 * it can be used as a standard DOM element.
 *
 * The documentation in this module defines the instance structure of a
 * `<regular-table>` DOM object instantiated typically, through HTML or any
 * relevent DOM method e.g. `document.createElement("perspective-viewer")` or
 * `document.getElementsByTagName("perspective-viewer")`.
 */
export class RegularTableElement extends RegularViewEventModel {
    _initialized!: boolean;

    constructor() {
        super();
        this._column_sizes = { auto: [], override: {}, indices: [] } as any;
        this._style_callbacks = [];
        this._initialized = false;
    }

    connectedCallback() {
        if (!this._initialized) {
            this._create_shadow_dom();
            this.register_listeners();
            this.setAttribute("tabindex", "0");
            this._initialized = true;
            this.table_model = new RegularTableViewModel(
                this._table_clip,
                this._column_sizes,
                this,
            );
        }
    }

    /**
     * Reset column autosizing, such that column sizes will be recalculated
     * on the next draw() call.
     */
    resetAutoSize() {
        this._column_sizes.auto = [];
        this._column_sizes.override = {};
        this._column_sizes.indices = [];
    }

    /**
     * Gets a mapping of column indices and sizes overriden by the users.
     *
     * @returns A mapping of column index to override pixel size.
     */
    saveColumnSizes(): Record<number, number> {
        return structuredClone(this._column_sizes.override);
    }

    /**
     * Restore an array of column widths.
     *
     * @param sizes A mapping of column index to override pixel size.
     */
    restoreColumnSizes(sizes: Record<number, number>) {
        this._column_sizes.override = structuredClone(sizes);
    }

    /**
     * Clears the current renderer `<table>`.
     */
    clear(): void {
        this.table_model = new RegularTableViewModel(
            this._table_clip,
            this._column_sizes,
            this,
        );
    }

    /**
     * Adds a style listener callback. The style listeners are called
     * whenever the <table> is re-rendered, such as through API invocations
     * of draw() and user-initiated events such as scrolling. Within this
     * optionally async callback, you can select `<td>`, `<th>`, etc. elements
     * via regular DOM API methods like querySelectorAll().
     *
     * # Examples
     *
     * ```javascript
     * const unsubscribe = table.addStyleListener(() => {
     *     for (const td of table.querySelectorAll("td")) {
     *         td.setAttribute("contenteditable", true);
     *     }
     * });
     *
     * setTimeout(() => {
     *     unsubscribe();
     * }, 1000);
     * ```
     *
     * @param {function({detail: RegularTableElement}): void} styleListener - A
     * (possibly async) function that styles the inner <table>.
     * @returns {function(): void} A function to remove this style listener.
     */
    addStyleListener(
        styleListener: (event: {
            detail: RegularTableElement;
        }) => void | Promise<void>,
    ): () => void {
        this._style_callbacks.push(styleListener as any);
        let isSubscribed = true;
        const unsubscribe = () => {
            if (!isSubscribed) {
                return;
            }

            isSubscribed = false;
            this._style_callbacks = this._style_callbacks.slice();
            const index = this._style_callbacks.indexOf(styleListener as any);
            this._style_callbacks.splice(index, 1);
        };

        return unsubscribe;
    }

    /**
     * Removes a style listener added by `addStyleListener`.
     * `removeStyleListener` throws an error if the provided listener is not
     * registered.
     *
     * @param {*} styleListener A listener previously added with
     * `addStyleListener`
     */
    removeStyleListener(
        styleListener: (event: {
            detail: RegularTableElement;
        }) => void | Promise<void>,
    ): void {
        const start_len = this._style_callbacks.length;
        this._style_callbacks = this._style_callbacks.filter(
            (x) => x !== (styleListener as any),
        );
        console.assert(
            this._style_callbacks.length === start_len - 1,
            "No listener found",
        );
    }

    /**
     * Returns the `MetaData` object associated with a `<td>` or `<th>`.  When
     * your `StyleListener` is invoked, use this method to look up additional
     * `MetaData` about any `HTMLTableCellElement` in the rendered `<table>`.
     *
     * # Examples
     *
     * ```javascript
     * const elems = document.querySelector("td:last-child td:last_child");
     * const metadata = table.getMeta(elems);
     * console.log(`Viewport corner is ${metadata.x}, ${metadata.y}`);
     * const header = table.getMeta({row_header_x: 1, y: 3}).row_header;
     * ```
     *
     * @param {HTMLTableCellElement|Partial<MetaData>} element - The child
     * element of this `<regular-table>` for which to look up metadata, or a
     * coordinates-like object to refer to metadata by logical position.
     * @returns {MetaData} The metadata associated with the element.
     */
    getMeta(element?: HTMLElement | CellMetadata): CellMetadata | undefined {
        if (element === undefined) {
            return;
        } else if (element instanceof HTMLElement) {
            return METADATA_MAP.get(element);
        } else if (
            "row_header_x" in element &&
            element.row_header_x &&
            element.row_header_x >= 0
        ) {
            if (element.row_header_x! < this._view_cache.row_headers_length) {
                const td = this.table_model.body._fetch_cell(
                    element.y!,
                    element.row_header_x!,
                );
                return this.getMeta(td);
            }
        } else if (
            "column_header_y" in element &&
            element.column_header_y! >= 0
        ) {
            if (
                element.column_header_y! <
                this._view_cache.column_headers_length
            ) {
                const td = this.table_model.header._fetch_cell(
                    element.column_header_y!,
                    element.x!,
                );
                return this.getMeta(td);
            }
        } else if ("dx" in element) {
            return this.getMeta(
                this.table_model.body._fetch_cell(
                    element.dy,
                    element.dx + (this.table_model._row_headers_length || 0),
                ),
            );
        }
    }

    /**
     * Get performance statistics about this `<regular-table>`.  Calling this
     * method resets the internal state, which makes it convenient to measure
     * performance at regular intervals (see example).
     *
     * # Examples
     *
     * ```javascript
     * const table = document.getElementById("my_regular_table");
     * setInterval(() => {
     *     const {real_fps} = table.getDrawFPS();
     *     console.log(`Measured ${fps} fps`)
     * });
     * ```
     *
     * @returns {Performance} Performance data aggregated since the last
     * call to `getDrawFPS()`.
     */
    getDrawFPS(): FPSRecord {
        return get_draw_fps();
    }

    /**
     * Call this method to set the `scrollLeft` and `scrollTop` for this
     * `<regular-table>` by calculating the position of this `scrollLeft`
     * and `scrollTop` relative to the underlying widths of its columns
     * and heights of its rows.
     *
     * # Examples
     *
     * ```javascript
     * table.scrollToCell(1, 3);
     * ```
     *
     * @param {number} x - The left most `x` index column to scroll into view.
     * @param {number} y - The top most `y` index row to scroll into view.
     */
    async scrollToCell(x: number, y: number): Promise<void> {
        if (!this._view_cache) {
            console.warn("data listener not configured");
            return;
        }

        const viewport_row_height = this._column_sizes.row_height || 19;
        this.scrollTop = Math.ceil(viewport_row_height * y);
        let scroll_left = 0;
        while (x > 0) {
            x--;
            scroll_left +=
                this._column_sizes.indices[
                    x + this._view_cache.row_headers_length
                ] || 60;
        }

        this.scrollLeft = Math.ceil(scroll_left);
        await new Promise(requestAnimationFrame);
        await this.flush();
    }

    /**
     * Call this method to set `DataListener` for this `<regular-table>`,
     * which will be called whenever a new data slice is needed to render.
     * Calls to `draw()` will fail if no `DataListener` has been set
     *
     * # Examples
     *
     * ```javascript
     * table.setDataListener((x0, y0, x1, y1) => {
     *     return {
     *         num_rows: num_rows = DATA[0].length,
     *         num_columns: DATA.length,
     *         data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
     *     };
     * })
     * ```
     *
     * @param dataListener
     * `dataListener` is called by to request a rectangular section of data
     * for a virtual viewport, (x0, y0, x1, y1), and returns a `DataReponse`
     * object.
     * @param options
     */
    setDataListener(
        dataListener: DataListener,
        {
            virtual_mode = "both",
            preserve_state = false,
        }: SetDataListenerOptions = {},
    ): void {
        console.assert(
            VIRTUAL_MODES.indexOf(virtual_mode) > -1,
            `Unknown virtual_mode ${virtual_mode};  valid options are "both" (default), "horizontal", "vertical" or "none"`,
        );

        const virtual_mode_changed = this._virtual_mode !== virtual_mode;
        if (preserve_state) {
            console.assert(
                !virtual_mode_changed,
                "preserve_state called with modified virtual_mode",
            );

            this._view_cache.view = dataListener as any;
        } else {
            this._virtual_mode = virtual_mode;
            this._invalid_schema = true;
            this._view_cache = {
                view: dataListener as any,
                row_headers_length: 0,
                column_headers_length: 0,
            };

            if (virtual_mode_changed) {
                this._setup_virtual_scroll();
            }
        }
    }
}

if (document.createElement("regular-table").constructor === HTMLElement) {
    window.customElements.define("regular-table", RegularTableElement);
}

// Custom Elements extensions
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "regular-table": RegularTableElement;
        }
    }
}

declare global {
    interface Document {
        createElement(
            tagName: "regular-table",
            options?: ElementCreationOptions,
        ): RegularTableElement;
        querySelector<E extends Element = Element>(selectors: string): E | null;
        querySelector(selectors: "regular-table"): RegularTableElement | null;
    }

    interface CustomElementRegistry {
        get(tagName: "regular-table"): typeof RegularTableElement;
    }
}
