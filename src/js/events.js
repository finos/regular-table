/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {METADATA_MAP} from "./constants";
import {RegularVirtualTableViewModel} from "./scroll_panel";
import {throttlePromise} from "./utils";

/**
 * WHen enabled, override iOS overscroll behavior by emulating scroll position
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
    register_listeners() {
        this.addEventListener("mousedown", this._on_click.bind(this));
        this.addEventListener("dblclick", this._on_dblclick.bind(this));
        this.addEventListener("scroll", this._on_scroll.bind(this), {
            passive: true,
        });

        this._register_glitch_scroll_listeners();
    }

    /**
     *
     * @internal
     * @private
     * @memberof RegularViewEventModel
     * @returns
     */
    _on_scroll(event) {
        event.stopPropagation();
        this.draw({invalid_viewport: false});
    }

    /**
     * Modern and mobile browsers implement complex scroll behavior to
     * implement fancy touch and intertia effects;  these must be intercepted
     * and disabled to achieve clean virtual scrolling in the presence of a
     * `fixed` element.
     *
     * @internal
     * @private
     * @memberof RegularViewEventModel
     */
    _register_glitch_scroll_listeners() {
        this.addEventListener("mousewheel", this._on_mousewheel.bind(this));
        if (IOS_DISABLE_OVERSCROLL) {
            this.addEventListener("touchmove", this._on_touchmove.bind(this));
            this.addEventListener("touchstart", this._on_touchstart.bind(this), {
                passive: true,
            });
        }
    }
    /**
     * Mousewheel must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on modern browsers.
     *
     * @internal
     * @private
     * @memberof RegularViewEventModel
     * @param {*} event
     */
    _on_mousewheel(event) {
        if (!window.safari) {
            // **** Apple
            return;
        }

        const {clientWidth, clientHeight, scrollTop, scrollLeft} = this;
        event.preventDefault();
        event.returnValue = false;
        const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - clientHeight);
        const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - clientWidth);
        this.scrollTop = Math.max(0, Math.min(total_scroll_height, scrollTop + event.deltaY));
        this.scrollLeft = Math.max(0, Math.min(total_scroll_width, scrollLeft + event.deltaX));
        this._on_scroll(event);
    }

    /**
     * Touchmove/touchstart must precalculate in addition to `_on_scroll` to
     * prevent visual artifacts due to scrolling "inertia" on mobile browsers.
     * This has the unfortunate side-effect of disabling scroll intertia.
     *
     * @internal
     * @private
     * @memberof RegularViewEventModel
     * @param {*} event
     * @returns
     */
    _on_touchmove(event) {
        event.stopPropagation();
        event.preventDefault();
        event.returnValue = false;
        const {clientWidth, clientHeight} = this;
        const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - clientHeight);
        const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - clientWidth);
        this.scrollTop = Math.min(total_scroll_height, this._memo_scroll_top + (this._memo_touch_startY - event.touches[0].pageY));
        this.scrollLeft = Math.min(total_scroll_width, this._memo_scroll_left + (this._memo_touch_startX - event.touches[0].pageX));
        this._on_scroll(event);
    }

    _on_touchstart(event) {
        this._memo_touch_startY = event.touches[0].pageY;
        this._memo_touch_startX = event.touches[0].pageX;
        this._memo_scroll_top = this.scrollTop;
        this._memo_scroll_left = this.scrollLeft;
    }

    /**
     * Handles double-click header width override reset.
     *
     * @internal
     * @private
     * @memberof RegularVirtualTableViewModel
     * @param {*} event
     * @returns
     */
    async _on_dblclick(event) {
        let element = event.target;
        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement;
            if (!this.contains(element)) {
                return;
            }
        }

        const is_resize = event.target.classList.contains("rt-column-resize");
        const metadata = METADATA_MAP.get(element);
        if (is_resize) {
            event.stopImmediatePropagation();
            // await new Promise(queueMicrotask);
            element.style.minWidth = "";
            element.style.maxWidth = "";
            if (event.shiftKey) {
                this._column_sizes.override = [];
                this._column_sizes.auto = [];
                this._column_sizes.indices = [];
            } else {
                this._column_sizes.override[metadata.size_key] = undefined;
                this._column_sizes.auto[metadata.size_key] = undefined;
                this._column_sizes.indices[metadata.size_key] = undefined;
            }

            for (const row of event.shiftKey ? [this.table_model.header.cells[this.table_model.header.cells.length - 1], ...this.table_model.body.cells] : this.table_model.body.cells) {
                for (const td of event.shiftKey ? row : [row[metadata._virtual_x]]) {
                    if (!td) {
                        continue;
                    }

                    td.style.minWidth = "";
                    td.style.maxWidth = "";
                    td.classList.remove("rt-cell-clip");
                }
            }

            await this.draw();
        }
    }

    /**
     * Dispatches all click events to other handlers, depending on
     * `event.target`.
     *
     * @internal
     * @private
     * @memberof RegularVirtualTableViewModel
     * @param {*} event
     * @returns
     */
    async _on_click(event) {
        if (event.button !== 0) {
            return;
        }

        let element = event.target;
        while (element.tagName !== "TD" && element.tagName !== "TH") {
            element = element.parentElement;
            if (!this.contains(element)) {
                return;
            }
        }

        const is_resize = event.target.classList.contains("rt-column-resize");
        const metadata = METADATA_MAP.get(element);
        if (is_resize) {
            this._on_resize_column(event, element, metadata);
            event.stopImmediatePropagation();
        }
    }

    /**
     * Regular event for column resize.
     *
     * @internal
     * @private
     * @memberof RegularVirtualTableViewModel
     * @param {*} event
     * @param {*} element
     * @param {*} metadata
     */
    _on_resize_column(event, element, metadata) {
        const {_virtual_x, size_key} = metadata;
        const start = event.pageX;
        const header_x = _virtual_x + element.colSpan - 1;
        const header_element = this.table_model.header.get_column_header(header_x);
        const width = this._column_sizes.indices[size_key];
        const move = (event) => this._on_resize_column_move(event, header_element, start, width, size_key, header_x);
        const up = () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            const override_width = this._column_sizes.override[size_key];
            const should_redraw = this._column_sizes.indices[size_key] !== override_width;
            this._column_sizes.indices[size_key] = override_width;
            if (should_redraw) {
                this.draw();
            }
        };

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", up);
    }

    /**
     * Regular event for mouse movement when resizing a column.
     *
     * @internal
     * @private
     * @memberof RegularVirtualTableViewModel
     * @param {*} event
     * @param {*} th
     * @param {*} start
     * @param {*} width
     * @param {*} metadata
     */
    @throttlePromise
    async _on_resize_column_move(event, th, start, width, size_key, virtual_x) {
        await new Promise(setTimeout);
        const diff = event.pageX - start;
        const override_width = Math.max(1, width + diff);
        this._column_sizes.override[size_key] = override_width;

        // If the column is smaller, new columns may need to be fetched, so
        // redraw, else just update the DOM widths as if redrawn.
        if (diff < 0) {
            await this.draw({preserve_width: true});
        } else {
            th.style.minWidth = override_width + "px";
            th.style.maxWidth = override_width + "px";
            const auto_width = this._column_sizes.auto[size_key];
            for (const row of this.table_model.body.cells) {
                const td = row[virtual_x];
                if (td) {
                    td.style.maxWidth = td.style.minWidth = override_width + "px";
                    td.classList.toggle("rt-cell-clip", auto_width > override_width);
                }
            }
        }
    }
}
