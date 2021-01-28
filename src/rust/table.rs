/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */
// use crate::constants::*;
use std::cmp::max;
use std::iter::FromIterator;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use js_intern::*;
use js_sys::Reflect;
use wasm_bindgen_futures::{future_to_promise, JsFuture};
use web_sys::{DocumentFragment, HtmlElement};

use crate::tbody::RegularBodyViewModel;
use crate::thead::RegularHeaderViewModel;

struct viewState {
    viewport_width: i32,
    selected_id: JsValue, // can be Option<T>, just need to find out T
    ridx_offset: i32,
    x0: i32,
    x1: i32,
    y1: i32,
    row_height: i32,
    row_headers_length: i32,
}

#[wasm_bindgen]
pub struct RegularTableViewModel {
    table: HtmlElement,
    header: RegularHeaderViewModel,
    body: RegularBodyViewModel,
    fragment: DocumentFragment,
    _column_sizes: js_sys::Object,
}

#[wasm_bindgen]
impl RegularTableViewModel {
    #[wasm_bindgen(constructor)]
    pub fn new(container: js_sys::Object, column_sizes: js_sys::Object, element: web_sys::HtmlElement) -> RegularTableViewModel {
        element.set_inner_html("<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>");
        let table = element.children().item(0).unwrap().dyn_into::<HtmlElement>().unwrap();
        let table_children = table.children();
        let thead = table_children.item(0).unwrap().dyn_into::<HtmlElement>().unwrap();
        let tbody = table_children.item(1).unwrap().dyn_into::<HtmlElement>().unwrap();

        let fragment = web_sys::window().expect("No window").document().expect("").create_document_fragment();

        RegularTableViewModel {
            table: table,
            header: RegularHeaderViewModel::new(column_sizes.clone(), container.clone(), thead),
            body: RegularBodyViewModel::new(column_sizes.clone(), container.clone(), tbody),
            fragment: fragment,
            _column_sizes: column_sizes.clone(),
        }
    }

    pub fn num_columns(&mut self) -> usize {
        self.header.num_columns()
    }

    pub fn clear(&self, element: HtmlElement) {
        element.set_inner_html("<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>");
    }

    pub fn autosize_cells(&mut self, last_cells: js_sys::Array) {
        while last_cells.length() > 0 {
            let item: js_sys::Array = js_sys::Array::from(&last_cells.pop());
            let cell: HtmlElement = item.get(0).into();
            let metadata: js_sys::Object = item.get(1).into();

            let style = web_sys::window().expect("no window").get_computed_style(&cell).expect("must have style").expect("must have style"); // lol

            let mut offset_width: f64 = 0.0;

            match style.get_property_value("boxSizing").ok() {
                Some(value) => {
                    if value != "border-box" {
                        offset_width = cell.client_width() as f64;
                        offset_width -= style
                            .get_property_value("paddingLeft")
                            .ok()
                            .unwrap_or(String::from("0")) // lol
                            .parse::<f64>()
                            .unwrap_or(0.0);
                        offset_width -= style.get_property_value("paddingRight").ok().unwrap_or(String::from("0")).parse::<f64>().unwrap_or(0.0);
                    } else {
                        offset_width = cell.offset_width() as f64;
                    }
                }
                None => offset_width = cell.offset_width() as f64,
            }

            match Reflect::get(&self._column_sizes, js_intern!("row_height")).ok() {
                Some(value) => Reflect::set(&self._column_sizes, js_intern!("row_height"), &value),
                None => Reflect::set(&self._column_sizes, js_intern!("row_height"), &JsValue::from(cell.offset_height())),
            }
            .expect("set row_height");

            let size_key = Reflect::get(&metadata, js_intern!("size_key")).ok().expect("size_key");
            Reflect::set(&self._column_sizes, &size_key, &JsValue::from_f64(offset_width)).expect("set size_key");

            let _override: js_sys::Object = Reflect::get(&self._column_sizes, js_intern!("override")).ok().unwrap().into();
            let is_override = _override.has_own_property(&size_key);

            if offset_width != 0.0 && is_override {
                let auto = Reflect::get(&self._column_sizes, js_intern!("auto")).ok().expect("column_sizes.auto");
                Reflect::set(&auto, &size_key, &JsValue::from_f64(offset_width)).unwrap();
            }

            match cell.style().get_property_value("minWidth").ok() {
                Some(w) => {
                    if w == "0px" {
                        let width = format!("{}px", offset_width);
                        cell.style().set_property("minWidth", width.as_str()).unwrap();
                    }
                }
                None => {}
            };
        }
    }

    pub fn draw(
        &mut self,
        container_size: js_sys::Object,
        view_cache: js_sys::Object,
        selected_id: JsValue,
        preserve_width: bool,
        viewport: js_sys::Object,
        num_columns: i32,
    ) -> Result<js_sys::Promise, JsValue> {
        let container_width: i32 = Reflect::get(&container_size, js_intern!("width"))?.as_f64().ok_or_else(|| JsValue::NULL)? as i32;
        let container_height: i32 = Reflect::get(&container_size, js_intern!("height"))?.as_f64().ok_or_else(|| JsValue::NULL)? as i32;
        let view: js_sys::Function = Reflect::get(&view_cache, js_intern!("view"))?.into();
        let config: js_sys::Object = Reflect::get(&view_cache, js_intern!("config"))?.into();

        let view_args: js_sys::Array = js_sys::Array::from_iter(
            [js_intern!("start_col"), js_intern!("start_row"), js_intern!("end_col"), js_intern!("end_row")]
                .iter()
                .map(|prop| Reflect::get(&viewport, prop).ok().unwrap()),
        );
        let view_promise: js_sys::Promise = view.apply(&JsValue::UNDEFINED, &view_args)?.into();
        // JS Promise -> Rust Future
        let view_result: JsFuture = JsFuture::from(view_promise);

        Ok(future_to_promise(RegularTableViewModel::_draw_helper(view_result, viewport)))
    }

    async fn _draw_helper(view: JsFuture, viewport: js_sys::Object) -> Result<JsValue, JsValue> {
        let result = view.await?;
        let data = Reflect::get(&result, js_intern!("data"))?;
        let mut row_headers = Reflect::get(&result, js_intern!("row_headers"))?;
        let column_headers = Reflect::get(&result, js_intern!("column_headers"))?;

        let ridx_offset = Reflect::get(&viewport, js_intern!("start_row"))?.as_f64().unwrap_or(0.0) as usize;
        let x0 = Reflect::get(&viewport, js_intern!("start_col"))?.as_f64().unwrap_or(0.0) as usize;
        let x1 = Reflect::get(&viewport, js_intern!("end_col"))?.as_f64().unwrap_or(0.0) as usize;
        let y1 = Reflect::get(&viewport, js_intern!("end_row"))?.as_f64().unwrap_or(0.0) as usize;

        let mut row_headers_array: js_sys::Array = js_sys::Array::new();
        let mut row_headers_length: usize = 0;

        if !row_headers.is_undefined() {
            row_headers_array = row_headers.dyn_into::<js_sys::Array>()?;

            let mut _get_max = |max_val: JsValue, x, _, _| {
                let len = Reflect::get(&x, js_intern!("length")).unwrap().as_f64().unwrap_or(0.0) as i32;
                JsValue::from(max(max_val.as_f64().unwrap_or(0.0) as i32, len))
            };

            let get_max_ref: &mut dyn FnMut(JsValue, JsValue, u32, js_sys::Array) -> JsValue = &mut _get_max;
            row_headers_length = row_headers_array.reduce(get_max_ref, &JsValue::from(0)).as_f64().unwrap() as usize;
            let mut _map_row_headers = |x: JsValue, _, _| {
                Reflect::set(&x, js_intern!("length"), &JsValue::from(row_headers_length as i32)).unwrap();
                x
            };
            let map_row_headers_ref: &mut dyn FnMut(JsValue, u32, js_sys::Array) -> JsValue = &mut _map_row_headers;
            row_headers_array = row_headers_array.map(map_row_headers_ref);
        }

        Ok(js_sys::Array::from_iter(vec![data, JsValue::from(row_headers_length as i32)].iter()).into())
    }

    async fn draw_row_headers(
        this: &RegularTableViewModel,
        draw_state: &js_sys::Object,
        last_cells: &mut js_sys::Array,
        config: &js_sys::Object,
        view_state: &js_sys::Object,
        x0: usize,
        container_height: usize,
        view_cache: &js_sys::Object,
        preserve_width: bool,
    ) {
    }
}
