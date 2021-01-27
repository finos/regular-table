/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */
use crate::constants::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use js_intern::*;
use js_sys::Reflect;
use web_sys::{DocumentFragment, HtmlElement, Node};

use crate::tbody::RegularBodyViewModel;
use crate::thead::RegularHeaderViewModel;

#[wasm_bindgen]
pub struct RegularTableViewModel {
    table: JsValue,
    _column_sizes: JsValue,
    header: RegularHeaderViewModel,
    body: RegularBodyViewModel,
    fragment: DocumentFragment,
}

#[wasm_bindgen]
impl RegularTableViewModel {
    pub fn num_columns(&mut self) -> usize {
        self.header.num_columns()
    }
    pub fn clear(&self, element: HtmlElement) {
        element.set_inner_html("<table cellspacing=\"0\"><thead></thead><tbody></tbody></table>");
    }
}
