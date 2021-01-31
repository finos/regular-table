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
import {RegularViewEventModel as RustRegularViewEventModel} from "../../pkg";
import {throttlePromise} from "./utils";

/**
 *
 *
 * @class RegularViewEventModel
 * @extends {RegularVirtualTableViewModel}
 */
export class RegularViewEventModel extends RegularVirtualTableViewModel {
    _set_event_model() {
        this.rust_event_model = new RustRegularViewEventModel();
    }

    register_listeners() {
        this.addEventListener("mousedown", this._on_click.bind(this));
        this.addEventListener("dblclick", this._on_dblclick.bind(this));
        this.addEventListener("scroll", this._on_scroll.bind(this), {
            passive: false,
        });
        this._register_glitch_scroll_listeners();
    }

    /**
     * @returns
     * @memberof RegularViewModel
     */
    async _on_scroll(event) {
        // event.stopPropagation();
        // event.returnValue = false;
        this.rust_event_model._on_scroll(event);
        await this.draw({invalid_viewport: false});
        this.dispatchEvent(new CustomEvent("regular-table-scroll"));
    }

    /**
     * Modern and mobile browsers implement complex scroll behavior to
     * implement fancy touch and intertia effects;  these must be intercepted
     * and disabled to achieve clean virtual scrolling in the presence of a
     * `fixed` element.
     *
     * @memberof RegularViewEventModel
     */
    _register_glitch_scroll_listeners() {
        this.addEventListener("mousewheel", this._on_mousewheel.bind(this), {
            passive: false,
        });
        this.addEventListener("touchstart", this._on_touchstart.bind(this), {
            passive: false,
        });
        this.addEventListener("touchmove", this._on_touchmove.bind(this), {
            passive: false,
        });
    }

    /**
     * Mousewheel must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on modern browsers.
     *
     * @param {*} event
     * @memberof RegularViewModel
     */
    _on_mousewheel(event) {
        if (this._virtual_scrolling_disabled) {
            return;
        }

        if (this.rust_event_model._on_mousewheel(event, this, this._virtual_panel)) {
            this._on_scroll(event);
        }

        // const {clientWidth, clientHeight, scrollTop, scrollLeft, scrollHeight} = this;
        // if ((event.deltaY > 0 && scrollTop + clientHeight < scrollHeight) || (event.deltaY < 0 && scrollTop > 0) || event.deltaY === 0) {
        //     event.preventDefault();
        //     event.returnValue = false;
        //     const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - clientHeight);
        //     const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - clientWidth);
        //     this.scrollTop = Math.min(total_scroll_height, scrollTop + event.deltaY);
        //     this.scrollLeft = Math.min(total_scroll_width, scrollLeft + event.deltaX);
        //     this._on_scroll(event);
        // }
    }

    /**
     * Touchmove must precalculate in addition to `_on_scroll` to prevent
     * visual artifacts due to scrolling "inertia" on mobile browsers.  This has
     * the unfortunate side-effect of disabling scroll intertia, but the
     * alternative is a dodgy, glitchy mess.
     *
     * @param {*} event
     * @returns
     * @memberof RegularViewEventModel
     */
    _on_touchmove(event) {
        if (this._virtual_scrolling_disabled) {
            return;
        }
        this.rust_event_model._on_touchmove(event, this, this._virtual_panel);
        this._on_scroll(event);

        // event.preventDefault();
        // event.returnValue = false;
        // const {clientWidth, clientHeight, scrollTop, scrollLeft} = this;
        // const total_scroll_height = Math.max(1, this._virtual_panel.offsetHeight - clientHeight);
        // const total_scroll_width = Math.max(1, this._virtual_panel.offsetWidth - clientWidth);
        // this.scrollTop = Math.min(total_scroll_height, scrollTop + (this._memo_touch_startY - event.touches[0].screenY));
        // this.scrollLeft = Math.min(total_scroll_width, scrollLeft + (this._memo_touch_startX - event.touches[0].screenX));
        // this._on_scroll(event);
    }

    /**
     * Memoize `touchstart` positions to calculate deltas, since these are not
     * generated on `touchmove` events.
     *
     * @param {*} event
     * @memberof RegularViewEventModel
     */
    _on_touchstart(event) {
        this.rust_event_model._on_touchstart(event);

        // this._memo_touch_startY = event.touches[0].screenY;
        // this._memo_touch_startX = event.touches[0].screenX;
    }

    /**
     * Handles double-click header width override reset.
     *
     * @param {*} event
     * @returns
     * @memberof RegularVirtualTableViewModel
     */
    async _on_dblclick(event) {
        let element = this.rust_event_model._on_dblclick(event, this);

        // let element = event.target;
        // while (element.tagName !== "TD" && element.tagName !== "TH") {
        //     element = element.parentElement;
        //     if (!this.contains(element)) {
        //         return;
        //     }
        // }

        if (element) {
            const is_resize = event.target.classList.contains("rt-column-resize");
            const metadata = METADATA_MAP.get(element);
            if (is_resize) {
                await new Promise(setTimeout);
                delete this._column_sizes.override[metadata.size_key];
                delete this._column_sizes.auto[metadata.size_key];
                delete this._column_sizes.indices[metadata.size_key];
                element.style.minWidth = "";
                element.style.maxWidth = "";

                for (const row of this.querySelectorAll("tbody tr")) {
                    const td = row.children[metadata._virtual_x];
                    if (!td) {
                        continue;
                    }
                    td.style.minWidth = "";
                    td.style.maxWidth = "";
                    td.classList.remove("rt-cell-clip");
                }
                await this.draw();
            }
        }
    }

    /**
     * Dispatches all click events to other handlers, depending on
     * `event.target`.
     *
     * @param {*} event
     * @returns
     * @memberof RegularVirtualTableViewModel
     */
    async _on_click(event) {
        const element = this.rust_event_model._on_click(event, this);

        if (element) {
            const is_resize = event.target.classList.contains("rt-column-resize");
            const metadata = METADATA_MAP.get(element);
            if (is_resize) {
                this._on_resize_column(event, element, metadata);
            }
        }

        // if (event.button !== 0) {
        //     return;
        // }

        // let element = event.target;
        // while (element.tagName !== "TD" && element.tagName !== "TH") {
        //     element = element.parentElement;
        //     if (!this.contains(element)) {
        //         return;
        //     }
        // }

        // const is_resize = event.target.classList.contains("rt-column-resize");
        // const metadata = METADATA_MAP.get(element);
        // if (is_resize) {
        //     this._on_resize_column(event, element, metadata);
        // }
    }

    /**
     * Regular event for column resize.
     *
     * @param {*} event
     * @param {*} element
     * @param {*} metadata
     * @memberof RegularVirtualTableViewModel
     */
    _on_resize_column(event, element, metadata) {
        const start = event.pageX;
        element = this.table_model.header.get_column_header(metadata._virtual_x);
        const width = this._column_sizes.indices[metadata.size_key];
        const move = (event) => this._on_resize_column_move(event, element, start, width, metadata);
        const up = async () => {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", up);
            const override_width = this._column_sizes.override[metadata.size_key];
            this._column_sizes.indices[metadata.size_key] = override_width;
            await this.draw();
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
     * @memberof RegularVirtualTableViewModel
     */
    @throttlePromise
    async _on_resize_column_move(event, th, start, width, metadata) {
        await new Promise(setTimeout);
        const diff = event.pageX - start;
        const override_width = Math.max(1, width + diff);
        this._column_sizes.override[metadata.size_key] = override_width;

        // If the column is smaller, new columns may need to be fetched, so
        // redraw, else just update the DOM widths as if redrawn.
        if (diff < 0) {
            await this.draw({preserve_width: true});
        } else {
            th.style.minWidth = override_width + "px";
            th.style.maxWidth = override_width + "px";
            const auto_width = this._column_sizes.auto[metadata.size_key];
            // TODO fix
            for (const row of this.querySelectorAll("tbody tr")) {
                const td = row.children[metadata._virtual_x];
                if (td) {
                    td.style.maxWidth = td.style.minWidth = override_width + "px";
                    td.classList.toggle("rt-cell-clip", auto_width > override_width);
                }
            }
        }
    }
}
