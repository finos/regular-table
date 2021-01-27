/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

use crate::constants;
use crate::utils::coerce_str;
use js_intern::*;
use js_sys::Reflect;
use std::iter::FromIterator;

use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::view_model;

/******************************************************************************
 *
 * View Model
 *
 */

#[wasm_bindgen]
pub struct RegularHeaderViewModel {
    view_model: view_model::ViewModel,
    _offset_cache: js_sys::Array,
    _group_header_cache: js_sys::Array,
}

#[wasm_bindgen]
impl RegularHeaderViewModel {
    #[wasm_bindgen(constructor)]
    pub fn new(column_sizes: js_sys::Object, container: js_sys::Object, table: web_sys::HtmlElement) -> RegularHeaderViewModel {
        RegularHeaderViewModel {
            view_model: view_model::ViewModel::new(column_sizes, container, table),
            _offset_cache: js_sys::Array::new(),
            _group_header_cache: js_sys::Array::new(),
        }
    }

    pub fn _draw_group_th(&mut self, d: u32, column: &str) -> Result<web_sys::HtmlElement, JsValue> {
        let cidx = if d < self._offset_cache.length() {
            self._offset_cache.get(d).as_f64().unwrap() as usize
        } else {
            0
        };

        let th = self.view_model._get_cell(js_intern!("TH"), d as usize, cidx);
        self._offset_cache.set(d, JsValue::from_f64((cidx + 1) as f64));
        th.set_class_name("");
        th.remove_attribute("colspan")?;
        th.style().set_property("min-width", "0")?;
        th.set_inner_html(&format!(" {}  <span class=\"pd-column-resize\"></span>", column));
        Ok(th)
    }

    pub fn _draw_group(&self, column: &JsValue, column_name: &JsValue, th: web_sys::HtmlElement) -> Result<js_sys::Object, JsValue> {
        let metadata = self._get_or_create_metadata(&th);
        Reflect::set(&metadata, js_intern!("column_header"), column)?;
        Reflect::set(&metadata, js_intern!("value"), column_name)?;
        th.set_class_name("");
        Ok(metadata)
    }

    pub fn _draw_th(&self, column: &JsValue, column_name: &JsValue, th: &web_sys::HtmlElement, _: &JsValue, size_key: &JsValue) -> Result<js_sys::Object, JsValue> {
        let metadata = self._get_or_create_metadata(&th);
        let _size_key_array = size_key.clone().dyn_into::<js_sys::Array>();
        Reflect::set(&metadata, js_intern!("column_header"), column)?;
        Reflect::set(&metadata, js_intern!("value"), column_name)?;
        Reflect::set(
            &metadata,
            js_intern!("size_key"),
            &if js_sys::Array::is_array(size_key) { _size_key_array.clone()?.get(0) } else { size_key.clone() },
        )?;

        if !(_size_key_array.is_ok() && _size_key_array?.length() > 1) {
            let override_width = {
                let overrides = &Reflect::get(&self.view_model._column_sizes(), js_intern!("override"))?;
                Reflect::get(overrides, size_key)?
            };

            let auto_width = {
                let auto = &Reflect::get(&self.view_model._column_sizes(), js_intern!("auto"))?;
                Reflect::get(auto, size_key)?
            };

            if !override_width.is_undefined() {
                let cond = !auto_width.is_undefined() && auto_width.as_f64().unwrap() > override_width.as_f64().unwrap();
                th.class_list().toggle_with_force("pd-cell-clip", cond)?;
                let override_width_str = format!("{}px", override_width.as_string().unwrap());
                th.style().set_property("min-width", &override_width_str)?;
                th.style().set_property("max-width", &override_width_str)?;
            } else if !auto_width.is_undefined() {
                th.class_list().remove(&js_sys::Array::from_iter([js_intern!("pd-cell-clip")].iter()))?;
                th.style().set_property("max-width", "")?;
                th.style().set_property("min-width", &format!("{}px", auto_width.as_f64().unwrap()))?;
            } else {
                // TODO bug?
                // th.style().set_property("min-width", "")?;
                th.style().set_property("max-width", "")?;
            }
        }

        Ok(metadata)
    }

    pub fn get_column_header(&mut self, cidx: usize) -> web_sys::HtmlElement {
        self.view_model._get_cell(js_intern!("TH"), self.view_model.num_rows() - 1, cidx)
    }

    pub fn draw(&mut self, alias: &JsValue, parts: &JsValue, colspan: bool, x: &JsValue, size_key: &JsValue, x0: &JsValue, _virtual_x: &JsValue) -> Result<js_sys::Object, JsValue> {
        if parts.is_undefined() {
            return Ok(JsValue::UNDEFINED.into());
        }

        // TODO wrong - this is not an array, but we can treat it like one here
        let _parts_arr = parts.clone().unchecked_into::<js_sys::Array>();
        let header_levels = _parts_arr.length(); // Reflect::get(&_parts_arr, js_intern!("length"))?.as_f64().unwrap() as usize;
        let mut th: Option<web_sys::HtmlElement> = None;
        let mut metadata: Option<js_sys::Object> = None;
        for d in 0..header_levels {
            let column_name = &if d < _parts_arr.length() && !_parts_arr.get(d).is_undefined() {
                coerce_str(&_parts_arr.get(d))
            } else {
                "".to_string()
            };

            Reflect::set(
                &self._offset_cache,
                &JsValue::from(d),
                &if self._offset_cache.get(d).is_undefined() { JsValue::from(0) } else { self._offset_cache.get(d) },
            )?;

            if d < header_levels - 1 {
                let _group_header_cache_d0value = {
                    let _ghc_entry = self._group_header_cache.get(d);
                    if !_ghc_entry.is_undefined() {
                        let _entry2 = _ghc_entry.unchecked_ref::<js_sys::Array>().get(0);
                        if !_entry2.is_undefined() {
                            Reflect::get(&_entry2, js_intern!("value"))?.as_string().map(|x| x == *column_name).unwrap_or(false)
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                };

                if _group_header_cache_d0value {
                    let _group_header_cache_d_row = self._group_header_cache.get(d).unchecked_into::<js_sys::Array>();
                    let _th = _group_header_cache_d_row.get(1).dyn_into::<web_sys::HtmlElement>()?;
                    _group_header_cache_d_row.set(2, {
                        let _v = _group_header_cache_d_row.get(2);
                        JsValue::from(_v.as_f64().unwrap_or(0.0) + 1.0)
                    });
                    if colspan {
                        Reflect::set(&_group_header_cache_d_row.get(0), js_intern!("row_header_x"), &size_key)?;
                    }
                    _th.set_attribute("colspan", &_group_header_cache_d_row.get(2).as_f64().unwrap().to_string())?;
                    th = Some(_th);
                } else {
                    let _th = self._draw_group_th(d, column_name)?;
                    let _metadata = self._draw_th(if alias.is_undefined() { parts } else { alias }, &JsValue::from_str(column_name), &_th, x, size_key)?;
                    let _new_group_header_row = js_sys::Array::from_iter([&_metadata, &_th, &JsValue::from_f64(1.0).into()].iter()).into();
                    self._group_header_cache.set(d, _new_group_header_row);
                    th = Some(_th);
                    metadata = Some(_metadata);
                }
            } else {
                let _th = self._draw_group_th(d, column_name)?;
                let _metadata = self._draw_th(if alias.is_undefined() { parts } else { alias }, &JsValue::from_str(column_name), &_th, x, size_key)?;
                for group_meta in self._group_header_cache.values() {
                    let old_key = Reflect::get(&_metadata, js_intern!("size_key"))?;
                    let group_meta_first = group_meta?.dyn_into::<js_sys::Array>()?.get(0);
                    Reflect::set(&group_meta_first, js_intern!("size_key"), &old_key)?;
                }
                _th.remove_attribute("colspan")?;
                th = Some(_th);
                metadata = Some(_metadata);
            }

            match metadata.clone() {
                None => {}
                Some(_metadata) => {
                    Reflect::set(&_metadata, js_intern!("x"), x)?;
                    Reflect::set(&_metadata, js_intern!("column_header_y"), &JsValue::from_f64(d as f64))?;
                    Reflect::set(&_metadata, js_intern!("x0"), x0)?;
                    Reflect::set(&_metadata, js_intern!("_virtual_x"), _virtual_x)?;
                    if colspan {
                        Reflect::set(&_metadata, js_intern!("row_header_x"), size_key)?;
                    }
                }
            }
        }

        self.view_model._clean_rows(self._offset_cache.length());

        let ret_obj = js_sys::Object::new();
        Reflect::set(&ret_obj, js_intern!("th"), &th.unwrap_or(JsValue::UNDEFINED.into()))?;
        Reflect::set(&ret_obj, js_intern!("metadata"), &metadata.unwrap_or(JsValue::UNDEFINED.into()))?;
        Ok(ret_obj)
    }

    pub fn clean(&mut self) {
        self.view_model._clean_columns_cache(&self._offset_cache);
        self._offset_cache = js_sys::Array::new();
        self._group_header_cache = js_sys::Array::new();
    }

    pub fn num_rows(&self) -> usize {
        self.view_model.num_rows()
    }

    pub fn num_columns(&mut self) -> usize {
        self.view_model.num_columns()
    }

    pub fn _fetch_cell(&mut self, ridx: f64, cidx: f64) -> web_sys::HtmlElement {
        self.view_model._fetch_cell(ridx, cidx)
    }

    pub fn _get_or_create_metadata(&self, td: &web_sys::HtmlElement) -> js_sys::Object {
        self.view_model._get_or_create_metadata(td)
    }
}
