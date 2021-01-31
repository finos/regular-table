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
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{HtmlElement, Node};

use crate::utils::coerce_str;
use crate::view_model;

/******************************************************************************
 *
 * View Model
 *
 */

#[wasm_bindgen]
#[derive(Clone)]
pub struct RegularBodyViewModel {
    view_model: Rc<RefCell<view_model::ViewModel>>,
}

#[wasm_bindgen]
impl RegularBodyViewModel {
    #[wasm_bindgen(constructor)]
    pub fn new(column_sizes: js_sys::Object, container: js_sys::Object, table: HtmlElement) -> RegularBodyViewModel {
        RegularBodyViewModel {
            view_model: Rc::new(RefCell::new(view_model::ViewModel::new(column_sizes, container, table))),
        }
    }

    pub fn _draw_td(&mut self, tag_name: &JsValue, ridx: usize, val: &JsValue, cidx: usize, column_name: &JsValue, ridx_offset: usize, size_key: &JsValue) -> Result<js_sys::Object, JsValue> {
        let td = self.view_model.borrow_mut()._get_cell(tag_name, ridx, cidx);
        let metadata = self.view_model.borrow_mut()._get_or_create_metadata(&td);
        Reflect::set(&metadata, js_intern!("y"), &JsValue::from_f64((ridx + ridx_offset) as f64))?;
        Reflect::set(&metadata, js_intern!("size_key"), size_key)?;

        let overrides = &Reflect::get(&self.view_model.borrow_mut()._column_sizes(), js_intern!("override"))?;

        if tag_name == "TD" {
            Reflect::set(&metadata, js_intern!("column_header"), column_name)?;
        }

        match Reflect::get(overrides, size_key) {
            Ok(override_width) => {
                let auto = &Reflect::get(&self.view_model.borrow_mut()._column_sizes(), js_intern!("auto"))?;
                let cond = match Reflect::get(auto, size_key)?.as_f64() {
                    None => false,
                    Some(auto_width) => !override_width.is_undefined() && auto_width > override_width.as_f64().unwrap(),
                };

                td.class_list().toggle_with_force("rt-cell-clip", cond)?;
                if !override_width.is_undefined() {
                    let width_str = format!("{}px", override_width.as_f64().unwrap());
                    td.style().set_property("min-width", &width_str)?;
                    td.style().set_property("max-width", &width_str)?;
                }
            }
            Err(_) => {
                let args = &js_sys::Array::from(&JsValue::from_serde(&["rt-cell-clip"]).unwrap());
                td.class_list().remove(args)?;
                td.style().set_property("min-width", "")?;
                td.style().set_property("max-width", "")?;
            }
        }

        if HtmlElement::instanceof(val) {
            Node::set_text_content(&td, None);
            let elem_val = &val.clone().unchecked_into::<Node>();
            td.append_child(elem_val)?;
        } else if val.is_undefined() || val.is_null() {
            Node::set_text_content(&td, None);
        } else {
            Node::set_text_content(&td, Some(&coerce_str(val)));
        }

        Reflect::set(&metadata, js_intern!("value"), val)?;

        let ret_obj = js_sys::Object::new();
        Reflect::set(&ret_obj, js_intern!("td"), &td)?;
        Reflect::set(&ret_obj, js_intern!("metadata"), &metadata)?;
        Ok(ret_obj)
    }

    pub fn draw(
        &mut self,
        container_height: usize,
        column_state: js_sys::Object,
        view_state: js_sys::Object,
        th: bool,
        x: &JsValue,
        x0: &JsValue,
        size_key: JsValue,
        _virtual_x: usize,
    ) -> Result<js_sys::Object, JsValue> {
        let cidx = Reflect::get(&column_state, js_intern!("cidx"))?.as_f64().unwrap();
        let column_data = Reflect::get(&column_state, js_intern!("column_data"))?.dyn_into::<js_sys::Array>()?;
        let row_headers = Reflect::get(&column_state, js_intern!("row_headers"))?;
        let mut row_height = Reflect::get(&view_state, js_intern!("row_height"))?;
        let mut metadata: Option<js_sys::Object> = None;
        let mut ridx_offset: Vec<u32> = vec![];
        let mut tds: Vec<js_sys::Object> = vec![];
        let mut ridx: usize = 0;
        let mut cidx_offset: Vec<u32> = vec![];
        let iterations = if th {
            Reflect::get(&view_state, js_intern!("row_headers_length"))?.as_f64().unwrap() as u32
        } else {
            1
        };

        for i in 0..iterations {
            ridx = 0;
            for val in column_data.values() {
                let _val = val?;
                let id = if row_headers.is_undefined() {
                    JsValue::UNDEFINED
                } else {
                    row_headers.clone().unchecked_into::<js_sys::Array>().get(ridx as u32)
                };

                let mut obj: Option<js_sys::Object> = None;
                if th {
                    let row_header = _val.clone().unchecked_into::<js_sys::Array>().get(i);

                    let _ridx_offset = if (i as usize) < ridx_offset.len() { ridx_offset[i as usize] } else { 1 } as f64;
                    let _ridx = (f64::from(ridx as u32) - _ridx_offset) as f64;
                    let prev_row = self.view_model.borrow_mut()._fetch_cell(_ridx, cidx + i as f64);
                    let prev_row_metadata = self.view_model.borrow_mut()._get_or_create_metadata(&prev_row);

                    let _cidx_offset = if ridx < cidx_offset.len() { cidx_offset[ridx] as usize } else { 1 } as f64;
                    let _cidx = (f64::from(cidx as u32) + (i as f64) - _cidx_offset) as f64;
                    let prev_col = self.view_model.borrow_mut()._fetch_cell(ridx as f64, _cidx);
                    let prev_col_metadata = self.view_model.borrow_mut()._get_or_create_metadata(&prev_col);

                    let _prev_col_metadata_value = Reflect::get(&prev_col_metadata, js_intern!("value")).unwrap_or(JsValue::UNDEFINED);
                    let _prev_row_metadata_value = Reflect::get(&prev_row_metadata, js_intern!("value")).unwrap_or(JsValue::UNDEFINED);

                    // TODO object equality?
                    if !prev_col.is_undefined() && (_prev_col_metadata_value == row_header || row_header.is_undefined()) && !prev_col.has_attribute("rowspan") {
                        while ridx > cidx_offset.len() {
                            cidx_offset.push(1);
                        }

                        if ridx < cidx_offset.len() {
                            cidx_offset[ridx] = cidx_offset[ridx] + 1;
                        } else {
                            cidx_offset.push(2);
                            assert_eq!(cidx_offset.len() - 1, ridx);
                        }

                        prev_col.set_attribute("colspan", &cidx_offset[ridx].to_string())?;
                        self.view_model.borrow_mut()._replace_cell(ridx, (cidx as usize) + (i as usize));
                    } else if !prev_row.is_undefined() && _prev_row_metadata_value == row_header && !prev_row.has_attribute("colspan") {
                        while (i as usize) > ridx_offset.len() {
                            ridx_offset.push(2);
                        }
                        if (i as usize) < ridx_offset.len() {
                            ridx_offset[i as usize] = ridx_offset[i as usize] + 1;
                        } else {
                            ridx_offset.push(2);
                            assert_eq!(ridx_offset.len() - 1, i as usize);
                        }

                        prev_row.set_attribute("rowspan", &ridx_offset[i as usize].to_string())?;
                        self.view_model.borrow_mut()._replace_cell(ridx, (cidx as usize) + (i as usize));
                    } else {
                        let _column_state_column_name = Reflect::get(&column_state, js_intern!("column_name"))?;
                        let _view_state_ridx_offset = Reflect::get(&view_state, js_intern!("ridx_offset"))?.as_f64().unwrap() as usize;
                        let _view_state_y1 = Reflect::get(&view_state, js_intern!("y1"))?.as_f64().unwrap() as usize;
                        let _obj = self._draw_td(
                            js_intern!("TH"),
                            ridx,
                            &row_header,
                            (cidx as usize) + i as usize,
                            &_column_state_column_name,
                            _view_state_ridx_offset,
                            &JsValue::from_f64(i as f64),
                        )?;
                        obj = Some(_obj.clone());
                        let _obj_td = Reflect::get(&_obj, js_intern!("td"))?.dyn_into::<web_sys::HtmlElement>()?;
                        let _obj_metadata = Reflect::get(&_obj, js_intern!("metadata"))?.dyn_into::<js_sys::Object>()?;

                        _obj_td.style().set_property("display", "")?;
                        _obj_td.remove_attribute("rowspan")?;
                        _obj_td.remove_attribute("colspan")?;

                        Reflect::set(&_obj_metadata, js_intern!("row_header"), &_val)?;
                        Reflect::set(&_obj_metadata, js_intern!("row_header_x"), &JsValue::from_f64(i as f64))?;
                        Reflect::set(&_obj_metadata, js_intern!("x0"), x0)?;
                        Reflect::set(&_obj_metadata, js_intern!("y0"), &JsValue::from_f64(_view_state_ridx_offset as f64))?;
                        Reflect::set(&_obj_metadata, js_intern!("y1"), &JsValue::from_f64(_view_state_y1 as f64))?;
                        Reflect::set(&_obj_metadata, js_intern!("_virtual_x"), &JsValue::from_f64(i as f64))?;

                        if (i as usize) < ridx_offset.len() {
                            ridx_offset[i as usize] = 1;
                        } else {
                            ridx_offset.push(1);
                        }

                        if (ridx as usize) < cidx_offset.len() {
                            cidx_offset[ridx as usize] = 1;
                        } else {
                            cidx_offset.push(1);
                        }

                        if (i as usize) >= tds.len() {
                            tds.push(_obj);
                        } else {
                            tds[i as usize] = _obj;
                        };
                    }
                    ridx = ridx + 1;
                } else {
                    let _column_state_column_name = Reflect::get(&column_state, js_intern!("column_name"))?;
                    let _view_state_ridx_offset = Reflect::get(&view_state, js_intern!("ridx_offset"))?.as_f64().unwrap() as usize;
                    let _view_state_x1 = Reflect::get(&view_state, js_intern!("x1"))?.as_f64().unwrap() as usize;
                    let _view_state_y1 = Reflect::get(&view_state, js_intern!("y1"))?.as_f64().unwrap() as usize;

                    let _obj = self._draw_td(js_intern!("TD"), ridx, &_val, cidx as usize, &_column_state_column_name, _view_state_ridx_offset, &size_key)?;
                    ridx = ridx + 1;

                    obj = Some(_obj.clone());

                    let _obj_td = Reflect::get(&_obj, js_intern!("td"))?.dyn_into::<web_sys::HtmlElement>()?;
                    let _obj_metadata = Reflect::get(&_obj, js_intern!("metadata"))?.dyn_into::<js_sys::Object>()?;
                    let _obj_metadata_y = Reflect::get(&_obj_metadata, js_intern!("y"))?.as_f64().unwrap();

                    Reflect::set(&_obj_metadata, js_intern!("x"), x)?;
                    Reflect::set(&_obj_metadata, js_intern!("x0"), x0)?;
                    Reflect::set(&_obj_metadata, js_intern!("x1"), &JsValue::from_f64(_view_state_x1 as f64))?;
                    Reflect::set(&_obj_metadata, js_intern!("row_header"), &id)?;
                    Reflect::set(&_obj_metadata, js_intern!("y0"), &JsValue::from_f64(_view_state_ridx_offset as f64))?;
                    Reflect::set(&_obj_metadata, js_intern!("y1"), &JsValue::from_f64(_view_state_y1 as f64))?;
                    Reflect::set(&_obj_metadata, js_intern!("dx"), &JsValue::from_f64(x.as_f64().unwrap() - x0.as_f64().unwrap()))?;
                    Reflect::set(&_obj_metadata, js_intern!("dy"), &JsValue::from_f64(_obj_metadata_y - _view_state_ridx_offset as f64))?;
                    Reflect::set(&_obj_metadata, js_intern!("_virtual_x"), &JsValue::from_f64(_virtual_x as f64))?;
                    if tds.len() == 0 {
                        tds.push(_obj);
                    } else {
                        tds[0] = _obj;
                    };
                }

                metadata = match obj {
                    Some(x) => {
                        if row_height.is_undefined() {
                            let _obj_td = Reflect::get(&x, js_intern!("td"))?.unchecked_into::<web_sys::HtmlElement>();
                            row_height = JsValue::from_f64(_obj_td.offset_height() as f64);
                        }
                        Some(Reflect::get(&x, js_intern!("metadata"))?.unchecked_into::<js_sys::Object>())
                    }
                    None => metadata,
                };

                if ridx * (row_height.as_f64().unwrap() as usize) > container_height {
                    break;
                }
            }
        }

        self.view_model.borrow_mut()._clean_rows(ridx as u32);

        let ret_obj = js_sys::Object::new();
        let array = js_sys::Array::new();
        for td in tds {
            array.push(&td);
        }
        Reflect::set(&ret_obj, js_intern!("tds"), &array)?;
        Reflect::set(&ret_obj, js_intern!("ridx"), &JsValue::from_f64(ridx as f64))?;
        Reflect::set(&ret_obj, js_intern!("metadata"), &metadata.unwrap())?;
        Reflect::set(&ret_obj, js_intern!("row_height"), &row_height)?;
        Ok(ret_obj)
    }

    pub fn clean(&mut self, obj: js_sys::Object) -> Result<(), JsValue> {
        let ridx: f64 = Reflect::get(&obj, js_intern!("ridx"))?.as_f64().unwrap();
        let cidx: f64 = Reflect::get(&obj, js_intern!("cidx"))?.as_f64().unwrap();
        let mut _view_model = self.view_model.borrow_mut();
        _view_model._clean_rows(ridx as u32);
        _view_model._clean_columns(cidx);
        Ok(())
    }

    pub fn _fetch_cell(&mut self, ridx: f64, cidx: f64) -> web_sys::HtmlElement {
        self.view_model.borrow_mut()._fetch_cell(ridx, cidx)
    }
}
