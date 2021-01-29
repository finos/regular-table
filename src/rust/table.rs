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
use js_sys::Reflect;
use std::cell::RefCell;
use std::cmp::max;
use std::iter::FromIterator;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::{future_to_promise, JsFuture};
use web_sys::{DocumentFragment, HtmlElement};

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
pub struct RegularTableViewModel {
    table: HtmlElement,
    header: Box<RegularHeaderViewModel>,
    body: Box<RegularBodyViewModel>,
    fragment: DocumentFragment,
    _column_sizes: js_sys::Object,
}

#[wasm_bindgen]
impl RegularTableViewModel {
    #[wasm_bindgen(constructor)]
    pub fn new(
        container: js_sys::Object,
        column_sizes: js_sys::Object,
        element: web_sys::HtmlElement,
    ) -> RegularTableViewModel {
        element.set_inner_html("<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>");

        let table = element
            .children()
            .item(0)
            .unwrap()
            .dyn_into::<HtmlElement>()
            .unwrap();
        let table_children = table.children();
        let thead = table_children.item(0).unwrap().dyn_into::<HtmlElement>().unwrap();
        let tbody = table_children.item(1).unwrap().dyn_into::<HtmlElement>().unwrap();
        let fragment = web_sys::window().expect("No window").document().expect("").create_document_fragment();
        let model = RegularTableViewModel {
            table: table,
            header: Box::new(RegularHeaderViewModel::new(column_sizes.clone(), container.clone(), thead)),
            body: Box::new(RegularBodyViewModel::new(column_sizes.clone(), container.clone(), tbody)),
            fragment: fragment,
            _column_sizes: column_sizes.clone(),
        };

        // model.clear(element);
        model
    }

    // #[wasm_bindgen(getter)]
    // pub fn body(&self) -> RegularBodyViewModel {
    //     *self.body
    // }

    // #[wasm_bindgen(getter)]
    // pub fn header(&self) -> RegularHeaderViewModel {
    //     *self.header
    // }

    #[wasm_bindgen(getter)]
    pub fn get_table(&self) -> HtmlElement {
        self.table.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn get_fragment(&self) -> DocumentFragment {
        self.fragment.clone()
    }

    #[wasm_bindgen(getter, js_name = _column_sizes)]
    pub fn get_column_sizes(&self) -> js_sys::Object {
        self._column_sizes.clone()
    }

    pub fn num_columns(&mut self) -> usize {
        self.header.num_columns()
    }

    pub fn clear(&self, element: HtmlElement) {
        element.set_inner_html("<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>");
    }

    /// Calculate amendments to auto size from this render pass.
    ///
    /// # Arguments
    ///
    /// * `last_cells` - the last (bottom) element in every column, used to
    ///   read column dimensions.
    pub fn autosize_cells(&mut self, last_cells: js_sys::Array) -> Result<(), JsValue> {
        while last_cells.length() > 0 {
            let (cell, metadata) = {
                let item = js_sys::Array::from(&last_cells.pop());
                (
                    item.get(0).dyn_into::<web_sys::HtmlElement>()?,
                    item.get(1).dyn_into::<js_sys::Object>()?,
                )
            };

            let style = web_sys::window()
                .unwrap()
                .get_computed_style(&cell)
                .unwrap()
                .unwrap(); // lol
            let offset_width: f64 = match style.get_property_value("box-sizing").ok() {
                Some(value) if value != "border-box" => {
                    let padding_left = style
                        .get_property_value("padding-left")?
                        .parse()
                        .unwrap_or(0.0);
                    let padding_right = style
                        .get_property_value("padding-right")?
                        .parse()
                        .unwrap_or(0.0);
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

            let _size_key = Reflect::get(&metadata, js_intern!("size_key"))?;
            let _indices = &Reflect::get(&self._column_sizes, js_intern!("indices"))?;
            Reflect::set(_indices, &_size_key, &JsValue::from_f64(offset_width))?;
            let is_override = {
                let _override = Reflect::get(&self._column_sizes, js_intern!("override"))?
                    .dyn_into::<js_sys::Object>()?;
                _override.has_own_property(&_size_key)
            };

            if offset_width != 0.0 && !is_override {
                let auto = Reflect::get(&self._column_sizes, js_intern!("auto"))?;
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

    pub fn draw(
        &mut self,
        container_size: js_sys::Object,
        view_cache: js_sys::Object,
        selected_id: JsValue,
        preserve_width: bool,
        viewport: js_sys::Object,
        num_columns: usize,
    ) -> Result<JsValue, JsValue> {
        let container_width: usize = Reflect::get(&container_size, js_intern!("width"))?
            .as_f64()
            .ok_or_else(|| JsValue::NULL)? as usize;
        let container_height: usize = Reflect::get(&container_size, js_intern!("height"))?
            .as_f64()
            .ok_or_else(|| JsValue::NULL)? as usize;
        let view: js_sys::Function = Reflect::get(&view_cache, js_intern!("view"))?.into();
        let config: js_sys::Object = Reflect::get(&view_cache, js_intern!("config"))?.into();

        let view_args: js_sys::Array = js_sys::Array::from_iter(
            [
                js_intern!("start_col"),
                js_intern!("start_row"),
                js_intern!("end_col"),
                js_intern!("end_row"),
            ]
            .iter()
            .map(|prop| Reflect::get(&viewport, prop).ok().unwrap()),
        );

        // TODO: call this draw helper to resolve the view promise, and then
        // call draw_row_header and draw_columns
        self.draw_helper(
            view.clone(),
            view_args.clone(),
            view_cache.clone(),
            viewport.clone(),
            self._column_sizes.clone(),
            selected_id,
            container_height,
            preserve_width,
        );

        Ok(JsValue::NULL)
    }

    pub fn draw_helper(
        &self,
        view: js_sys::Function,
        view_args: js_sys::Array,
        view_cache: js_sys::Object,
        viewport: js_sys::Object,
        _column_sizes: js_sys::Object,
        selected_id: JsValue,
        container_height: usize,
        preserve_width: bool,
    ) -> Result<js_sys::Promise, JsValue> {
        let view_promise: js_sys::Promise = view.apply(&JsValue::UNDEFINED, &view_args)?.into();
        // JS Promise -> Rust Future
        let view_result: JsFuture = JsFuture::from(view_promise);

        Ok(future_to_promise(RegularTableViewModel::_draw_helper(
            RefCell::new(self),
            view_result,
            view_cache.clone(),
            viewport.clone(),
            _column_sizes.clone(),
            selected_id.clone(),
            container_height,
            preserve_width
        )))
    }

    async fn _draw_helper(
        this: RefCell<RegularTableViewModel>,
        view: JsFuture,
        view_cache: js_sys::Object,
        viewport: js_sys::Object,
        _column_sizes: js_sys::Object,
        selected_id: JsValue,
        container_height: usize,
        preserve_width: bool,
    ) -> Result<JsValue, JsValue> {
        let result = view.await?;
        let data = Reflect::get(&result, js_intern!("data"))?;
        let mut row_headers =
            Reflect::get(&result, js_intern!("row_headers"))?.dyn_into::<js_sys::Array>()?;
        let column_headers =
            Reflect::get(&result, js_intern!("column_headers"))?.dyn_into::<js_sys::Array>()?;

        let ridx_offset = Reflect::get(&viewport, js_intern!("start_row"))?;
        let x0 = Reflect::get(&viewport, js_intern!("start_col"))?;
        let x1 = Reflect::get(&viewport, js_intern!("end_col"))?;
        let y1 = Reflect::get(&viewport, js_intern!("end_row"))?;

        let mut row_headers_length = JsValue::UNDEFINED;

        if !row_headers.is_undefined() {
            let mut _get_max = |max_val: JsValue, x, _, _| {
                let len = Reflect::get(&x, js_intern!("length"))
                    .unwrap()
                    .as_f64()
                    .unwrap_or(0.0) as i32;
                JsValue::from(max(max_val.as_f64().unwrap_or(0.0) as i32, len))
            };

            let get_max_ref: &mut dyn FnMut(JsValue, JsValue, u32, js_sys::Array) -> JsValue =
                &mut _get_max;

            row_headers_length = row_headers
                .reduce(get_max_ref, &JsValue::from(0));

            let mut _map_row_headers = |x: JsValue, _, _| {
                Reflect::set(
                    &x,
                    js_intern!("length"),
                    &row_headers_length,
                )
                .unwrap();
                x
            };
            let map_row_headers_ref: &mut dyn FnMut(JsValue, u32, js_sys::Array) -> JsValue =
                &mut _map_row_headers;
            row_headers = row_headers.map(map_row_headers_ref);
        }

        let _cp = column_headers.get(0).dyn_into::<js_sys::Array>()?;
        let column_pivots = js_sys::Array::new();
        if !_cp.is_undefined() {
            column_pivots.fill(&JsValue::UNDEFINED, 0, _cp.length());
        }

        let _rp = row_headers.get(0).dyn_into::<js_sys::Array>()?;
        let row_pivots = js_sys::Array::new();
        if !_rp.is_undefined() {
            row_pivots.fill(&JsValue::UNDEFINED, 0, _rp.length());
        }

        let config = Reflect::get(&view_cache, js_intern!("config"))?;

        // we only use column_pivots.length, it seems
        Reflect::set(&config, js_intern!("column_pivots"), &column_pivots.keys())?;
        Reflect::set(&config, js_intern!("row_pivots"), &row_pivots.keys())?;

        let view_state = js_sys::Object::new();

        Reflect::set(&view_state, js_intern!("viewport_width"), &JsValue::from(0))?;
        Reflect::set(&view_state, js_intern!("selected_id"), &selected_id)?;
        Reflect::set(&view_state, js_intern!("ridx_offset"), &ridx_offset)?;
        Reflect::set(&view_state, js_intern!("x0"), &x0)?;
        Reflect::set(&view_state, js_intern!("x1"), &x1)?;
        Reflect::set(&view_state, js_intern!("y1"), &y1)?;
        Reflect::set(&view_state, js_intern!("row_headers_length"), &row_headers_length)?;

        let row_height = Reflect::get(&_column_sizes, js_intern!("row_height"))?;
        Reflect::set(&view_state, js_intern!("row_height"), &row_height)?;

        let draw_state = js_sys::Object::new();
        
        Reflect::set(&draw_state, js_intern!("cont_body"), &JsValue::NULL)?;
        Reflect::set(&draw_state, js_intern!("first_col"), &JsValue::from(true))?;
        Reflect::set(&draw_state, js_intern!("_virtual_x"), &JsValue::from(0))?;

        let last_cells = js_sys::Array::new();

        Ok(
            js_sys::Array::from_iter(vec![data, JsValue::from(row_headers_length.as_f64().unwrap_or(0.0) as i32)].iter())
                .into(),
        )
    }

    pub fn draw_row_headers(
        self,
        draw_state: &js_sys::Object,
        last_cells: &js_sys::Array,
        row_headers: js_sys::Array,
        config: &js_sys::Object,
        view_state: &js_sys::Object,
        x0: usize,
        container_height: usize,
        view_cache: &js_sys::Object,
        preserve_width: bool,
    ) -> Result<js_sys::Promise, JsValue> {
        Ok(future_to_promise(RegularTableViewModel::_draw_row_headers(
            RefCell::new(self),
            draw_state.clone(),
            last_cells.clone(),
            row_headers.clone(),
            config.clone(),
            view_state.clone(),
            x0,
            container_height,
            view_cache.clone(),
            preserve_width,
        )))
    }

    async fn _draw_row_headers(
        this: RefCell<RegularTableViewModel>,
        draw_state: js_sys::Object,
        last_cells: js_sys::Array,
        row_headers: js_sys::Array,
        config: js_sys::Object,
        view_state: js_sys::Object,
        x0: usize,
        container_height: usize,
        view_cache: js_sys::Object,
        preserve_width: bool,
    ) -> Result<JsValue, JsValue> {
        let mut cont_body = Reflect::get(&draw_state, js_intern!("cont_body"))?.unchecked_into::<js_sys::Object>();
        let mut first_col = Reflect::get(&draw_state, js_intern!("first_col"))?.as_bool().unwrap_or(false);
        let _virtual_x = Reflect::get(&draw_state, js_intern!("_virtual_x"))?.as_f64().unwrap();
        let _row_pivots = Reflect::get(&config, js_intern!("row_pivots"))?.unchecked_into::<js_sys::Array>();
        let _column_pivots = Reflect::get(&config, js_intern!("column_pivots"))?.unchecked_into::<js_sys::Array>();
        if !row_headers.is_undefined() && row_headers.length() > 0 {
            let column_name = _row_pivots.join(",");
            let column_state = {
                let _obj = js_sys::Object::new();
                Reflect::set(&_obj, js_intern!("column_name"), &JsValue::from(&column_name))?;
                Reflect::set(&_obj, js_intern!("cidx"), &JsValue::from(0.0))?;
                Reflect::set(&_obj, js_intern!("column_data"), &row_headers)?;
                Reflect::set(&_obj, js_intern!("row_headers"), &row_headers)?;
                Reflect::set(&_obj, js_intern!("first_col"), &JsValue::from(first_col))?;
                _obj
            };
            let size_key = _virtual_x + (x0 as f64);
            Reflect::set(&view_state, js_intern!("x0"), &JsValue::from(0))?;
            cont_body = this.borrow_mut().body.draw(
                container_height,
                column_state,
                view_state.clone(),
                true,
                &JsValue::UNDEFINED,
                &JsValue::UNDEFINED,
                JsValue::from(size_key),
                _virtual_x as usize,
            )?;
            let mut cont_heads: Vec<js_sys::Object> = vec![];
            for i in 0.._row_pivots.length() - 1 {
                cont_heads.push(this.borrow_mut().header.draw(
                    &column_name,
                    &js_sys::Array::new_with_length(_column_pivots.length() + 1).fill(js_intern!(""), 0, _column_pivots.length()),
                    true,
                    &JsValue::UNDEFINED,
                    &JsValue::from(i),
                    &JsValue::from(x0 as f64),
                    &JsValue::from(i),
                )?);
            }
            first_col = false;
            Reflect::set(
                &view_state,
                js_intern!("viewport_width"),
                &cont_heads.iter().enumerate().fold(cont_heads[0].clone().into(), |acc, _obj| {
                    let (i, b) = _obj;
                    // let th = Reflect::get(b, js_intern!("th")).dyn_into::<web_sts::HtmlElement>()?;
                    // let _indices_i = Reflect::get(self._column_sizes.length())
                    // JsValue::from(total + )
                    JsValue::from(0)
                }), // .into_inner(),
            );
        }
        Ok(draw_state.into())
    }

    pub fn draw_columns(self) {}

    async fn _draw_columns(this: RefCell<RegularTableViewModel>) {}
}
