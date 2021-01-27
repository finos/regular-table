/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

use web_sys::HtmlElement;

pub struct RegularVirtualTableViewModel {
    pub element: HtmlElement,
    pub virtual_panel: HtmlElement,
}

impl RegularVirtualTableViewModel {
    pub async fn draw(&mut self) {}
}
