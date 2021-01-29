/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

use serde::Serialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::constants;

/******************************************************************************
 *
 * View Model
 *
 */

#[derive(Serialize)]
pub struct MetaData {}

pub struct ViewModel {
    column_sizes: js_sys::Object,
    container: js_sys::Object,
    table: web_sys::HtmlElement,
    cells: Vec<Vec<web_sys::HtmlElement>>,
    rows: Vec<web_sys::HtmlElement>,
}

type CellsRow<'a> = (&'a web_sys::HtmlElement, &'a mut Vec<web_sys::HtmlElement>);

impl ViewModel {
    pub fn new(column_sizes: js_sys::Object, container: js_sys::Object, table: web_sys::HtmlElement) -> ViewModel {
        ViewModel {
            column_sizes,
            container,
            table,
            cells: vec![],
            rows: vec![],
        }
    }

    pub fn num_rows(&self) -> usize {
        self.cells.len()
    }

    pub fn num_columns(&self) -> usize {
        if self.cells.len() == 0 {
            0
        } else {
            self.cells[0].len()
        }
    }

    pub fn _set_metadata(&self, td: js_sys::Object, metadata: js_sys::Object) {
        constants::METADATA_MAP.with(|x| x.set(&td, &metadata));
    }

    pub fn _get_or_create_metadata(&self, td: &web_sys::HtmlElement) -> js_sys::Object {
        if td.is_undefined() {
            let metadata = MetaData {};
            JsValue::from_serde(&metadata).unwrap()
        } else if constants::METADATA_MAP.with(|x| x.has(&td)) {
            constants::METADATA_MAP.with(|x| x.get(&td))
        } else {
            let metadata = MetaData {};
            let jsvalue = JsValue::from_serde(&metadata).unwrap();
            constants::METADATA_MAP.with(|x| x.set(&td, &jsvalue));
            jsvalue
        }
        .unchecked_into::<js_sys::Object>()
    }

    pub fn _replace_cell(&mut self, ridx: usize, cidx: usize) {
        let (tr, row_container) = self._get_row(ridx);
        if cidx < row_container.len() && !row_container[cidx].is_undefined() {
            tr.remove_child(&row_container[cidx]).expect("");
            row_container[cidx] = JsValue::UNDEFINED.into();
        }
    }

    pub fn _fetch_cell(&mut self, ridx: f64, cidx: f64) -> web_sys::HtmlElement {
        if ridx < 0.0 || cidx < 0.0 {
            JsValue::UNDEFINED.into()
        } else {
            let (_, row_container) = self._get_row(ridx as usize);
            if cidx as usize >= row_container.len() {
                JsValue::UNDEFINED.into()
            } else {
                row_container[cidx as usize].clone().into()
            }
        }
    }

    pub fn _get_cell(&mut self, tag: &JsValue, ridx: usize, cidx: usize) -> web_sys::HtmlElement {
        let (tr, row_container) = self._get_row(ridx);
        let tag_str = tag.as_string().unwrap();
        if cidx >= row_container.len() {
            while row_container.len() < cidx {
                row_container.push(JsValue::UNDEFINED.into());
            }

            let new_td = web_sys::window()
                .expect("No window")
                .document()
                .expect("")
                .create_element(&tag_str)
                .expect("not created")
                .unchecked_into();

            row_container.push(new_td);
            assert_eq!(cidx, row_container.len() - 1);
            tr.append_child(&row_container[cidx]).expect("Failed to append Element");
        }

        if row_container[cidx].is_undefined() {
            row_container[cidx] = web_sys::window()
                .expect("No window")
                .document()
                .expect("No document")
                .create_element(&tag_str)
                .expect("Failed to create Element")
                .unchecked_into();

            let new_td = row_container[cidx + 1..].iter().find(|x| !x.is_undefined()).map(|x| x.as_ref());

            tr.insert_before(&row_container[cidx], new_td).expect("");
        }

        let td = &row_container[cidx];
        if td.tag_name() != tag_str {
            let new_td = web_sys::window()
                .expect("No window")
                .document()
                .expect("")
                .create_element(&tag_str)
                .expect("not create")
                .unchecked_into::<web_sys::HtmlElement>();

            tr.replace_child(&new_td, td).expect("");
            self.cells[ridx][cidx] = new_td;
            self.cells[ridx][cidx].clone()
        } else {
            td.clone()
        }
    }

    fn _get_row<'a>(&'a mut self, ridx: usize) -> CellsRow<'a> {
        if ridx >= self.rows.len() {
            let window = web_sys::window().expect("No window");
            let document = window.document().expect("");
            let tr = document.create_element("tr").unwrap().unchecked_into::<web_sys::HtmlElement>();
            self.table.append_child(&tr).expect("");
            self.rows.push(tr);
            assert_eq!(ridx, self.rows.len() - 1);
        }

        let tr = &self.rows[ridx];
        assert_eq!(tr.is_undefined(), false);
        if ridx >= self.cells.len() {
            self.cells.push(vec![]);
            assert_eq!(ridx, self.cells.len() - 1);
        }

        let row_container = &mut self.cells[ridx];
        (tr, row_container)
    }

    pub fn num_hol_columns(&mut self) -> usize {
        let idx = if self.rows.len() <= 1 { 0 } else { self.rows.len() - 1 };
        let (_, row_container) = self._get_row(idx);
        row_container.len()
    }

    pub fn _clean_columns_cache(&mut self, cidx: &js_sys::Array) {
        for (i, tr) in self.rows.iter().enumerate() {
            let ccidx = match cidx.get(i as u32).as_f64() {
                Some(_cidx) => _cidx,
                None => cidx.as_f64().unwrap_or(f64::from(self.cells[i].len() as u32) - 1.0),
            };

            self.cells[i] = self.cells[i][..ccidx as usize].to_vec();
            let idx = self.cells[i].iter().filter(|x| !x.is_undefined()).count();
            while idx < tr.children().length() as usize {
                tr.remove_child(&tr.children().item(idx as u32).unwrap()).unwrap();
            }
        }
    }

    pub fn _clean_columns(&mut self, cidx: f64) {
        for (i, tr) in self.rows.iter().enumerate() {
            self.cells[i] = self.cells[i][..cidx as usize].to_vec();
            let idx = self.cells[i].iter().filter(|x| !x.is_undefined()).count();
            while idx < tr.children().length() as usize {
                tr.remove_child(&tr.children().item(idx as u32).unwrap()).ok();
            }
        }
    }

    pub fn _clean_rows(&mut self, ridx: u32) {
        while ridx < self.table.children().length() {
            let child = &self.table.children().item(ridx).unwrap();
            self.table.remove_child(child).ok();
        }

        if ridx < self.rows.len() as u32 {
            self.rows = self.rows[..ridx as usize].to_vec();
        }

        if ridx < self.cells.len() as u32 {
            self.cells = self.cells[..ridx as usize].to_vec();
        }
    }

    pub fn _column_sizes(&self) -> js_sys::Object {
        self.column_sizes.clone()
    }

    pub fn table(&self) -> web_sys::HtmlElement {
        self.table.clone()
    }

    pub fn _container(&self) -> js_sys::Object {
        self.container.clone()
    }
}
