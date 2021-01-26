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
use web_sys::{HtmlElement, DocumentFragment};


pub struct RegularVirtualTableViewModel {
    pub element: HtmlElement,
    pub virtual_panel: HtmlElement,
}

impl RegularVirtualTableViewModel {
    pub async fn draw(&mut self) {}
}
