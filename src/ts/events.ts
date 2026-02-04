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

import { RegularVirtualTableViewModel } from "./scroll_panel";
import { throttle_tag } from "./utils";
import { CellMetadata } from "./types";
import { METADATA_MAP } from "./view_model";

/**
 * When enabled, override iOS overscroll behavior by emulating scroll position
 * in JavaScript.  This prevents "bounce" on edges, but it also removes scroll
 * inertia.  This waspreviously enabled by default in `regular-table<=0.4.3`,
 * but this version also had bugged (exaggerated) position calculation.
 * As `0.5.0` introduces sub-cell scrolling by defualt, this is now disabled by
 * default as well.
 */
const IOS_DISABLE_OVERSCROLL = false;

/**
 *
 *
 * @class RegularViewEventModel
 * @extends {RegularVirtualTableViewModel}
 */
export class RegularViewEventModel extends RegularVirtualTableViewModel {
    private _memo_scroll_top?: number;
    private _memo_scroll_left?: number;
    private _memo_touch_startY?: number;
    private _memo_touch_startX?: number;
    private _last_clicked_time?: number;
    register_listeners() {
        // // TODO see `_on_click_or_dblclick` method jsdoc
        // this.addEventListener("dblclick", this._on_dblclick.bind(this));

        this.addEventListener(
            "mousedown",
            this._on_click_or_dblclick.bind(this),
        );
        this.addEventListener("scroll", this._on_scroll.bind(this), {
            passive: true,
        });

        this._register_glitch_scroll_listeners();
    }

    /**
     *
     */
    async _on_scroll(event: Event) {
        event.stopPropagation();
        await this.draw({ invalid_viewport: false, cache: true });
        this.dispatchEvent(new CustomEvent<undefined>("regular-table-scroll"));
    }

    /**
     * Modern and mobile browsers implement complex scroll behavior to
     * implement fancy touch and intertia effects;  these must be intercepted
     * and disabled to achieve clean virtual scrolling in the presence of a
     * `fixed` element.
     */
    private _register_glitch_scroll_listeners() {
        this.addEventListener("mousewheel", this._on_mousewheel.bind(this), {
            passive: true,
        });

        if (IOS_DISABLE_OVERSCROLL) {
            this.addEventListener("touchmove", this._on_touchmove.bind(this));
            this.addEventListener(
                "touchstart",
                this._on_touchstart.bind(this),
                {
                    passive: true,
                },
            );
        }
    }
    /**
     * Mousewheel must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on modern browsers.
     *
     * @param {*} event
     */
    private _on_mousewheel(event2: Event) {
        if (!window.hasOwnProperty("safari")) {
            // **** Apple
            return;
        }

        const event = event2 as WheelEvent;
        const { clientWidth, clientHeight, scrollTop, scrollLeft } = this;
        event.preventDefault();
        event.returnValue = false;
        const total_scroll_height = Math.max(
            1,
            this._virtual_panel.offsetHeight - clientHeight,
        );

        const total_scroll_width = Math.max(
            1,
            this._virtual_panel.offsetWidth - clientWidth,
        );

        this.scrollTop = Math.max(
            0,
            Math.min(total_scroll_height, scrollTop + event.deltaY),
        );

        this.scrollLeft = Math.max(
            0,
            Math.min(total_scroll_width, scrollLeft + event.deltaX),
        );

        this._on_scroll(event);
    }

    /**
     * Touchmove/touchstart must precalculate in addition to `_on_scroll` to
     * prevent visual artifacts due to scrolling "inertia" on mobile browsers.
     * This has the unfortunate side-effect of disabling scroll intertia.
     *
     * @param {*} event
     * @returns
     */
    private _on_touchmove(event: TouchEvent) {
        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
        const { clientWidth, clientHeight } = this;
        const total_scroll_height = Math.max(
            1,
            this._virtual_panel.offsetHeight - clientHeight,
        );
        const total_scroll_width = Math.max(
            1,
            this._virtual_panel.offsetWidth - clientWidth,
        );
        this.scrollTop = Math.min(
            total_scroll_height,
            (this._memo_scroll_top || 0) +
                ((this._memo_touch_startY || 0) - event.touches[0].pageY),
        );
        this.scrollLeft = Math.min(
            total_scroll_width,
            (this._memo_scroll_left || 0) +
                ((this._memo_touch_startX || 0) - event.touches[0].pageX),
        );
        this._on_scroll(event);
    }

    private _on_touchstart(event: TouchEvent) {
        this._memo_touch_startY = event.touches[0].pageY;
        this._memo_touch_startX = event.touches[0].pageX;
        this._memo_scroll_top = this.scrollTop;
        this._memo_scroll_left = this.scrollLeft;
    }

    /**
     * Handles double-click header width override reset.
     *
     * @param {*} event
     * @returns
     */
    private async _on_dblclick(event: MouseEvent) {
        let element = event.target as HTMLElement;
        const is_resize = element.classList.contains("rt-column-resize");

        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement as HTMLElement;
            if (!this.contains(element)) {
                return;
            }
        }

        const metadata = METADATA_MAP.get(element);
        if (is_resize && metadata) {
            event.stopImmediatePropagation();

            // Clear column size data
            if (event.shiftKey) {
                this._column_sizes.override = {};
                this._column_sizes.auto = [];
                this._column_sizes.indices = [];
            } else {
                delete this._column_sizes.override[metadata.size_key];
                this._column_sizes.auto[metadata.size_key] = undefined;
                this._column_sizes.indices[metadata.size_key] = undefined;
            }

            // Update column width styles via adoptedStyleSheets
            this.table_model.updateColumnWidthStyles(
                {
                    start_row: 0,
                    end_row: 0,
                    ...this._calculate_column_range(0),
                },
                this._view_cache.row_headers_length,
            );

            // Clear inline styles and clipping classes
            for (const row of event.shiftKey
                ? [
                      this.table_model.header.cells[
                          this.table_model.header.cells.length - 1
                      ],
                      ...this.table_model.body.cells,
                  ]
                : this.table_model.body.cells) {
                for (const td of event.shiftKey
                    ? row
                    : [row[metadata.virtual_x!]]) {
                    if (!td) {
                        continue;
                    }

                    td.classList.remove("rt-cell-clip");
                }
            }

            await this.draw({ cache: true });
        }
    }

    /**
     * Dispatches all click events to other handlers, depending on
     * `event.target`.
     *
     * @param {*} event
     * @returns
     */
    private async _on_click(event: MouseEvent) {
        if (event.button !== 0) {
            return;
        }

        let element = event.target as HTMLElement;
        const is_resize = element.classList.contains("rt-column-resize");
        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement!;
            if (!this.contains(element)) {
                return;
            }
        }

        const metadata = METADATA_MAP.get(element);
        if (is_resize && metadata) {
            this._on_resize_column(
                event,
                element as HTMLTableCellElement,
                metadata,
            );
            event.stopImmediatePropagation();
        }
    }

    /**
     * `dblclick` event does not work reliably for some reason so dispatch this
     * event in JavaScript instead.
     *
     * @param {`*`} event
     */
    async _on_click_or_dblclick(event: MouseEvent) {
        const now = performance.now();
        if (this._last_clicked_time && now - this._last_clicked_time < 500) {
            this._last_clicked_time = now;
            await this._on_dblclick(event);
        } else {
            this._last_clicked_time = now;
            await this._on_click(event);
        }
    }

    /**
     * Regular event for column resize.
     *
     * @param {*} event
     * @param {*} element
     * @param {*} metadata
     */
    _on_resize_column(
        event: MouseEvent,
        element: HTMLTableCellElement,
        metadata: CellMetadata,
    ) {
        const { virtual_x, size_key } = metadata;
        const start = event.pageX;
        const header_x = (virtual_x || 0) + element.colSpan - 1;
        const header_element =
            this.table_model.header.get_column_header(header_x);
        const width = this._column_sizes.indices[size_key || 0] || 0;
        const move = (event: MouseEvent) =>
            throttle_tag(
                this,
                async () =>
                    await this._on_resize_column_move(
                        event,
                        header_element,
                        start,
                        width,
                        size_key || 0,
                        header_x,
                    ),
            );
        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            const override_width = this._column_sizes.override[size_key || 0];
            const should_redraw =
                this._column_sizes.indices[size_key || 0] !== override_width;
            this._column_sizes.indices[size_key || 0] = override_width;
            if (should_redraw) {
                this.draw({ cache: true });
            }
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    }

    /**
     * Regular event for mouse movement when resizing a column.
     *
     * @param {*} event
     * @param {*} th
     * @param {*} start
     * @param {*} width
     * @param {*} metadata
     */
    async _on_resize_column_move(
        event: MouseEvent,
        th: HTMLTableCellElement,
        start: number,
        width: number,
        size_key: number,
        virtual_x: number,
    ) {
        await new Promise(requestAnimationFrame);
        const diff = event.pageX - start;
        const override_width = Math.max(1, width + diff);
        this._column_sizes.override[size_key] = override_width;

        // If the column is smaller, new columns may need to be fetched, so
        // redraw, else just update the DOM widths and clipping classes.
        if (diff < 0) {
            await this.draw({
                preserve_width: true,
                throttle: false,
                cache: true,
            });
        } else {
            // Update column width styles via adoptedStyleSheets
            this.table_model.updateColumnWidthStyles(
                {
                    start_row: 0,
                    end_row: 0,
                    ...this._calculate_column_range(0),
                },
                this._view_cache.row_headers_length,
            );

            // Update clipping classes for cells in this column
            const auto_width = this._column_sizes.auto[size_key] || 0;
            const should_clip = auto_width > override_width;

            // Update header clipping class
            th.classList.toggle("rt-cell-clip", should_clip);

            // Update body cell clipping classes
            for (const row of this.table_model.body.cells) {
                const td = row[virtual_x];
                if (td) {
                    td.classList.toggle("rt-cell-clip", should_clip);
                }
            }
        }
    }
}
