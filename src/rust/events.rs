/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */
use std::cmp::{max, min};

use crate::constants::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use js_intern::*;
use js_sys::{Reflect, Promise};
use web_sys::{Event, HtmlElement, MouseEvent, Node, TouchEvent, WheelEvent};

// use crate::view_model::MetaData;
use crate::scroll_panel::RegularVirtualTableViewModel;

#[wasm_bindgen]
pub struct RegularViewEventModel {
    // virtual_view_model: RegularVirtualTableViewModel,
    _memo_touch_startY: i32,
    _memo_touch_startX: i32,
}

#[wasm_bindgen]
impl RegularViewEventModel {
    #[wasm_bindgen(constructor)]
    pub fn new() -> RegularViewEventModel {
        RegularViewEventModel {
            _memo_touch_startX: 0,
            _memo_touch_startY: 0
        }
    }

    pub fn _on_scroll(&mut self, event: WheelEvent) {
        event.stop_propagation();
        Reflect::set(
            &event,
            js_intern!("returnValue"),
            &JsValue::from_bool(false),
        )
        .unwrap();
    }

    pub fn _on_mousewheel(&mut self, event: WheelEvent, view_model: &HtmlElement, virtual_panel: &HtmlElement) -> bool {
        let client_width = view_model.client_width();
        let client_height = view_model.client_height();
        let scroll_top = view_model.scroll_top();
        let scroll_left = view_model.scroll_left();
        let scroll_height = view_model.scroll_height();

        if (event.delta_y() > 0.0 && scroll_top + client_height < scroll_height)
            || (event.delta_y() < 0.0 && scroll_top > 0)
            || event.delta_y() == 0.0
        {
            event.prevent_default();
            Reflect::set(
                &event,
                js_intern!("returnValue"),
                &JsValue::from_bool(false),
            )
            .unwrap();

            let offset_height = virtual_panel.offset_height();
            let offset_width = virtual_panel.offset_width();

            let total_scroll_height = max(
                1,
                (offset_height - client_height) as i64,
            );
            let total_scroll_width = max(
                1,
                (offset_width - client_width) as i64,
            );

            let new_scroll_top = min(total_scroll_height, scroll_top as i64 + (event.delta_y() as i64)) as i32;
            let new_scroll_left = min(total_scroll_width, scroll_left as i64 + (event.delta_x() as i64)) as i32;

            view_model.set_scroll_top(new_scroll_top);
            view_model.set_scroll_left(new_scroll_left);

            return true;
        }

        false
    }

    pub fn _on_touchmove(&mut self, event: TouchEvent, view_model: &HtmlElement, virtual_panel: &HtmlElement) {
        event.prevent_default();
        Reflect::set(
            &event,
            js_intern!("returnValue"),
            &JsValue::from_bool(false),
        )
        .unwrap();

        let client_width = view_model.client_width();
        let client_height = view_model.client_height();
        let scroll_top = view_model.scroll_top();
        let scroll_left = view_model.scroll_left();

        let total_scroll_height = max(1, virtual_panel.offset_height() - client_height);
        let total_scroll_width = max(1, virtual_panel.offset_width() - client_width);

        let touches = event.touches();
        let touch = touches.item(0).expect("Expected touch");

        view_model.set_scroll_top(min(total_scroll_height, scroll_top + (self._memo_touch_startY - touch.screen_y())));
        view_model.set_scroll_left(min(total_scroll_width, scroll_left + (self._memo_touch_startX - touch.screen_x())));
    }

    pub fn _on_touchstart(&mut self, event: TouchEvent) {
        let touches = event.touches();
        let touch = touches.item(0).expect("Expected touch");
        self._memo_touch_startY = touch.screen_y();
        self._memo_touch_startX = touch.screen_x();

        log_str(format!("{}, {}", self._memo_touch_startX, self._memo_touch_startY).as_str());
    }

    pub fn _on_dblclick(&mut self, event: MouseEvent, view_model: &HtmlElement) -> Option<HtmlElement> {
        let mut element: HtmlElement = event.target().unwrap().dyn_into::<HtmlElement>().expect("HTML element");

        while element.tag_name() != "TD" && element.tag_name() != "TH" {
            match element.parent_element() {
                Some(elem) => {
                    let node: &Node = elem.as_ref();
                    if !view_model.contains(Some(node)) {
                        return None;
                    }

                    element = elem.dyn_into::<HtmlElement>().expect("HTML element");
                }
                None => return None
            }
        }

        return Some(element);

    }

    pub fn _on_click(&mut self, event: MouseEvent, view_model: &HtmlElement) -> Option<HtmlElement> {
        if event.button() == 0 {
            // bubble up to the actual table element we click on, not whatever
            // is inside it.
            let mut element: HtmlElement = event.target().unwrap().dyn_into::<HtmlElement>().expect("HTML element");

            while element.tag_name() != "TD" && element.tag_name() != "TH" {
                match element.parent_element() {
                    Some(elem) => {
                        let node: &Node = elem.as_ref();
                        if !view_model.contains(Some(node)) {
                            return None;
                        }

                        element = elem.dyn_into::<HtmlElement>().expect("HTML element");
                    }
                    None => return None
                }
            }

            return Some(element);
        }

        None
    }

    // pub fn _on_resize_column(&mut self, event: MouseEvent, element: HtmlElement, metadata: MetaData) {
    //     let start = event.page_x();
    // }

    // pub fn _on_resize_column_move(&mut self, event: Event, th: HtmlElement, start: f64, width: f64, metadata: MetaData) {}
}
