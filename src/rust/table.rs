/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

use js_intern::*;
use js_sys::{Array, Object, Promise, Reflect};
use std::cell::RefCell;
use std::iter::FromIterator;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::future_to_promise;
use web_sys::HtmlElement;

// use crate::constants::*;
use crate::tbody::RegularBodyViewModel;
use crate::thead::RegularHeaderViewModel;

// struct viewState {
//     viewport_width: i32,
//     selected_id: JsValue, // can be Option<T>, just need to find out T
//     ridx_offset: i32,
//     x0: i32,
//     x1: i32,
//     y1: i32,
//     row_height: i32,
//     row_headers_length: i32,
// }

#[wasm_bindgen]
#[derive(Clone)]
pub struct RegularTableViewModel {
    table: HtmlElement,
    header: RegularHeaderViewModel,
    body: RegularBodyViewModel,
    container: Object,
    // fragment: DocumentFragment,
    _column_sizes: Object,
}

const TABLE_HTML: &str = "<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>";

#[wasm_bindgen]
impl RegularTableViewModel {
    #[wasm_bindgen(constructor)]
    pub fn new(container: Object, column_sizes: Object, element: web_sys::HtmlElement) -> RegularTableViewModel {
        element.set_inner_html(TABLE_HTML);
        let table = element.children().item(0).unwrap().dyn_into::<HtmlElement>().unwrap();
        let table_children = table.children();
        let thead = table_children.item(0).unwrap().dyn_into::<HtmlElement>().unwrap();
        let tbody = table_children.item(1).unwrap().dyn_into::<HtmlElement>().unwrap();
        let model = RegularTableViewModel {
            table: table,
            container: container.clone(),
            header: RegularHeaderViewModel::new(column_sizes.clone(), container.clone(), thead),
            body: RegularBodyViewModel::new(column_sizes.clone(), container.clone(), tbody),
            _column_sizes: column_sizes.clone(),
        };

        model
    }

    pub fn get_header(&mut self) -> RegularHeaderViewModel {
        self.header.clone()
    }

    pub fn get_body(&self) -> RegularBodyViewModel {
        self.body.clone()
    }

    #[wasm_bindgen(getter, js_name = _column_sizes)]
    pub fn get_column_sizes(&self) -> Object {
        self._column_sizes.clone()
    }

    pub fn num_columns(&mut self) -> usize {
        self.header.num_columns()
    }

    pub fn clear(&self, element: HtmlElement) {
        element.set_inner_html(TABLE_HTML);
    }

    /// Calculate amendments to auto size from this render pass.
    ///
    /// # Arguments
    ///
    /// * `last_cells` - the last (bottom) element in every column, used to
    ///   read column dimensions.
    pub fn autosize_cells(&mut self, last_cells: Array) -> Result<(), JsValue> {
        while last_cells.length() > 0 {
            let (cell, metadata) = {
                let item = Array::from(&last_cells.pop());
                (item.get(0).dyn_into::<web_sys::HtmlElement>()?, item.get(1).dyn_into::<Object>()?)
            };

            let style = web_sys::window().unwrap().get_computed_style(&cell).unwrap().unwrap(); // lol
            let offset_width: f64 = match style.get_property_value("box-sizing").ok() {
                Some(value) if value != "border-box" => {
                    let padding_left = style.get_property_value("padding-left")?.parse().unwrap_or(0.0);
                    let padding_right = style.get_property_value("padding-right")?.parse().unwrap_or(0.0);
                    (cell.client_width() as f64) - padding_left - padding_right
                }
                _ => cell.offset_width() as f64,
            };

            Reflect::set(&self._column_sizes, js_intern!("row_height"), &{
                let _val = Reflect::get(&self._column_sizes, js_intern!("row_height"))?;
                if _val.is_undefined() {
                    JsValue::from(cell.offset_height())
                } else {
                    _val
                }
            })?;

            let _size_key = &js_obj_field!(&metadata, "size_key")?;
            let _indices = &js_obj_field!(&self._column_sizes, "indices")?;
            Reflect::set(_indices, &_size_key, &JsValue::from_f64(offset_width))?;
            let is_override = {
                let _override = js_obj_field!(&self._column_sizes, "override")?;
                _override.has_own_property(&_size_key)
            };

            if offset_width != 0.0 && !is_override {
                let auto = js_obj_field!(&self._column_sizes, "auto")?;
                Reflect::set(&auto, &_size_key, &JsValue::from_f64(offset_width))?;
            }

            match cell.style().get_property_value("min-width").ok() {
                Some(x) if x == "0px" => {
                    let width = format!("{}px", offset_width);
                    cell.style().set_property("min-width", &width)?;
                }
                _ => {}
            };
        }
        Ok(())
    }

    // pub fn draw(
    //     self,
    //     container_size: Object,
    //     view_cache: Object,
    //     selected_id: JsValue,
    //     preserve_width: bool,
    //     viewport: Object,
    //     num_columns: usize,
    // ) -> Result<JsValue, JsValue> {
    //     let container_width: usize = Reflect::get(&container_size, js_intern!("width"))?.as_f64().ok_or_else(|| JsValue::NULL)? as usize;
    //     let container_height: usize = Reflect::get(&container_size, js_intern!("height"))?.as_f64().ok_or_else(|| JsValue::NULL)? as usize;
    //     let view: js_sys::Function = Reflect::get(&view_cache, js_intern!("view"))?.into();
    //     let config: Object = Reflect::get(&view_cache, js_intern!("config"))?.into();

    //     let view_args: Array = Array::from_iter(
    //         [js_intern!("start_col"), js_intern!("start_row"), js_intern!("end_col"), js_intern!("end_row")]
    //             .iter()
    //             .map(|prop| Reflect::get(&viewport, prop).ok().unwrap()),
    //     );

    //     let _column_sizes = self._column_sizes.clone();

    //     // TODO: call this draw helper to resolve the view promise, and then
    //     // call draw_row_header and draw_columns
    //     self.draw_helper(
    //         view.clone(),
    //         view_args.clone(),
    //         view_cache.clone(),
    //         viewport.clone(),
    //         _column_sizes,
    //         selected_id,
    //         container_height,
    //         preserve_width,
    //     )?;

    //     Ok(JsValue::NULL)
    // }

    // fn draw_helper(
    //     self,
    //     view: js_sys::Function,
    //     view_args: Array,
    //     view_cache: Object,
    //     viewport: Object,
    //     _column_sizes: Object,
    //     selected_id: JsValue,
    //     container_height: usize,
    //     preserve_width: bool,
    // ) -> Result<Promise, JsValue> {
    //     let view_promise: Promise = view.apply(&JsValue::UNDEFINED, &view_args)?.into();
    //     // JS Promise -> Rust Future
    //     let view_result: JsFuture = JsFuture::from(view_promise);

    //     Ok(future_to_promise(RegularTableViewModel::_draw_helper(
    //         RefCell::new(self),
    //         view_result,
    //         view_cache.clone(),
    //         viewport.clone(),
    //         _column_sizes.clone(),
    //         selected_id.clone(),
    //         container_height,
    //         preserve_width,
    //     )))
    // }

    // async fn _draw_helper(
    //     this: RefCell<RegularTableViewModel>,
    //     view: JsFuture,
    //     view_cache: Object,
    //     viewport: Object,
    //     _column_sizes: Object,
    //     selected_id: JsValue,
    //     container_height: usize,
    //     preserve_width: bool,
    // ) -> Result<JsValue, JsValue> {
    //     let result = view.await?;
    //     let data = Reflect::get(&result, js_intern!("data"))?;
    //     let mut row_headers = Reflect::get(&result, js_intern!("row_headers"))?.dyn_into::<Array>()?;
    //     let column_headers = Reflect::get(&result, js_intern!("column_headers"))?.dyn_into::<Array>()?;

    //     let ridx_offset = Reflect::get(&viewport, js_intern!("start_row"))?;
    //     let x0 = Reflect::get(&viewport, js_intern!("start_col"))?;
    //     let x1 = Reflect::get(&viewport, js_intern!("end_col"))?;
    //     let y1 = Reflect::get(&viewport, js_intern!("end_row"))?;

    //     let mut row_headers_length = JsValue::UNDEFINED;

    //     if !row_headers.is_undefined() {
    //         let mut _get_max = |max_val: JsValue, x, _, _| {
    //             let len = Reflect::get(&x, js_intern!("length")).unwrap().as_f64().unwrap_or(0.0) as i32;
    //             JsValue::from(max(max_val.as_f64().unwrap_or(0.0) as i32, len))
    //         };

    //         let get_max_ref: &mut dyn FnMut(JsValue, JsValue, u32, Array) -> JsValue = &mut _get_max;

    //         row_headers_length = row_headers.reduce(get_max_ref, &JsValue::from(0));

    //         let mut _map_row_headers = |x: JsValue, _, _| {
    //             Reflect::set(&x, js_intern!("length"), &row_headers_length).unwrap();
    //             x
    //         };
    //         let map_row_headers_ref: &mut dyn FnMut(JsValue, u32, Array) -> JsValue = &mut _map_row_headers;
    //         row_headers = row_headers.map(map_row_headers_ref);
    //     }

    //     let _cp = column_headers.get(0).dyn_into::<Array>()?;
    //     let column_pivots = Array::new();
    //     if !_cp.is_undefined() {
    //         column_pivots.fill(&JsValue::UNDEFINED, 0, _cp.length());
    //     }

    //     let _rp = row_headers.get(0).dyn_into::<Array>()?;
    //     let row_pivots = Array::new();
    //     if !_rp.is_undefined() {
    //         row_pivots.fill(&JsValue::UNDEFINED, 0, _rp.length());
    //     }

    //     let config = Reflect::get(&view_cache, js_intern!("config"))?;

    //     // we only use column_pivots.length, it seems
    //     Reflect::set(&config, js_intern!("column_pivots"), &column_pivots.keys())?;
    //     Reflect::set(&config, js_intern!("row_pivots"), &row_pivots.keys())?;

    //     let view_state = Object::new();

    //     Reflect::set(&view_state, js_intern!("viewport_width"), &JsValue::from(0))?;
    //     Reflect::set(&view_state, js_intern!("selected_id"), &selected_id)?;
    //     Reflect::set(&view_state, js_intern!("ridx_offset"), &ridx_offset)?;
    //     Reflect::set(&view_state, js_intern!("x0"), &x0)?;
    //     Reflect::set(&view_state, js_intern!("x1"), &x1)?;
    //     Reflect::set(&view_state, js_intern!("y1"), &y1)?;
    //     Reflect::set(&view_state, js_intern!("row_headers_length"), &row_headers_length)?;

    //     let row_height = Reflect::get(&_column_sizes, js_intern!("row_height"))?;
    //     Reflect::set(&view_state, js_intern!("row_height"), &row_height)?;

    //     let draw_state = Object::new();
    //     Reflect::set(&draw_state, js_intern!("cont_body"), &JsValue::NULL)?;
    //     Reflect::set(&draw_state, js_intern!("first_col"), &JsValue::from(true))?;
    //     Reflect::set(&draw_state, js_intern!("_virtual_x"), &JsValue::from(0))?;

    //     let last_cells = Array::new();

    //     Ok(Array::from_iter(vec![data, JsValue::from(row_headers_length.as_f64().unwrap_or(0.0) as i32)].iter()).into())
    // }

    // pub fn draw_row_headers(
    //     &self,
    //     draw_state: &Object,
    //     last_cells: &Array,
    //     row_headers: Array,
    //     config: &Object,
    //     view_state: &Object,
    //     x0: usize,
    //     container_height: usize,
    //     view_cache: &Object,
    //     preserve_width: bool,
    // ) -> Promise {
    //     future_to_promise(RegularTableViewModel::_draw_row_headers(
    //         self.clone(),
    //         draw_state.clone(),
    //         last_cells.clone(),
    //         row_headers.clone(),
    //         config.clone(),
    //         view_state.clone(),
    //         x0,
    //         container_height,
    //         view_cache.clone(),
    //         preserve_width,
    //     ))
    // }

    /// Draws a column representing the `row_headers` data slice property,
    /// e.g. a `<th>` table element.
    pub fn draw_row_headers(
        &mut self,
        draw_state: Object,
        last_cells: Array,
        row_headers: Array,
        config: Object,
        view_state: Object,
        x0: usize,
        container_height: usize,
        view_cache: Object,
        preserve_width: bool,
    ) -> Result<JsValue, JsValue> {
        let mut cont_body = js_obj_field!(&draw_state, "cont_body")?;
        let mut first_col = js_bool_field!(&draw_state, "first_col")?;
        let mut _virtual_x = js_f64_field!(&draw_state, "_virtual_x")?;
        let _row_pivots = js_arr_field!(&config, "row_pivots")?;
        let _view_cache_config = js_obj_field!(&view_cache, "config")?;
        let __column_pivots = js_arr_field!(&_view_cache_config, "column_pivots")?;
        let __row_pivots = js_arr_field!(&_view_cache_config, "row_pivots")?;
        if !row_headers.is_undefined() && row_headers.length() > 0 {
            let column_name = _row_pivots.join(",");
            let column_state = js_object!(
                "column_name", &column_name;
                "cidx", 0.0;
                "column_data", &row_headers;
                "row_headers", &row_headers;
                "first_col", first_col;
            );

            let size_key = _virtual_x + (x0 as f64);
            Reflect::set(&view_state, js_intern!("x0"), &JsValue::from(0))?;
            cont_body = self.body.draw(
                container_height,
                column_state,
                view_state.clone(),
                true,
                &JsValue::UNDEFINED,
                &JsValue::UNDEFINED,
                JsValue::from(size_key),
                _virtual_x as usize,
            )?;

            let mut cont_heads: Vec<Object> = vec![];
            let parts = {
                let cp_len = __column_pivots.length();
                let arr = Array::new_with_length(cp_len + 1);
                arr.fill(js_intern!(""), 0, cp_len)
            };

            for i in 0..__row_pivots.length() {
                cont_heads.push(
                    self.header
                        .draw(&column_name, &parts, true, &JsValue::UNDEFINED, &JsValue::from(i), &JsValue::from(x0 as f64), &JsValue::from(i))?,
                );
            }

            first_col = false;
            Reflect::set(
                &view_state,
                js_intern!("viewport_width"),
                &cont_heads.iter().enumerate().fold(JsValue::from(0.0), |total, _obj| {
                    let (i, b) = _obj;
                    let th = js_html_field!(b, "th").unwrap();
                    let _indices = js_arr_field!(&self._column_sizes, "indices").unwrap();
                    let item = _indices.get(i as u32);
                    JsValue::from(total.as_f64().unwrap() + if item.is_undefined() { th.offset_width() as f64 } else { item.as_f64().unwrap() })
                }),
            )?;

            Reflect::set(&view_state, js_intern!("row_height"), &{
                let row_height = Reflect::get(&view_state, js_intern!("row_height"))?;
                if row_height.is_undefined() {
                    Reflect::get(&cont_body, js_intern!("row_height"))?
                } else {
                    row_height
                }
            })?;

            _virtual_x = row_headers.get(0).dyn_into::<Array>()?.length() as f64;
            if !preserve_width {
                for i in 0..__row_pivots.length() {
                    let _th_rec = &cont_heads[i as usize];
                    let th = js_obj_field!(&_th_rec, "th")?;
                    let th_meta = js_obj_field!(&_th_rec, "metadata")?;
                    let _td_rec = js_obj_field!(&cont_body, "tds")?;
                    let td = js_obj_field!(&_td_rec, "td")?;
                    let td_meta = js_obj_field!(&_td_rec, "metadata")?;
                    last_cells.push(&Array::from_iter(
                        [if th.is_undefined() { td } else { th }, if th_meta.is_undefined() { td_meta } else { th_meta }].iter(),
                    ));
                }
            }
        };

        js_object!(&draw_state; with
            "cont_body", &cont_body;
            "first_col", first_col;
            "_virtual_x", _virtual_x;
        );

        Ok(draw_state.into())
    }

    pub fn draw_columns(self) -> Promise {
        future_to_promise(Self::_draw_columns(RefCell::new(self.clone())))
    }

    async fn _draw_columns(_this: RefCell<RegularTableViewModel>) -> Result<JsValue, JsValue> {
        Ok(JsValue::NULL)
    }
}
