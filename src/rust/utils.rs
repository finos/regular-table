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
use serde::Serialize;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

#[wasm_bindgen]
pub struct DrawFPS {
    avg: f64,
    total: f64,
    start: f64,
}

#[derive(Serialize)]
pub struct FPSResult {
    avg: f64,
    real_fps: f64,
    virtual_fps: f64,
    num_frames: f64,
    elapsed: f64,
}

#[wasm_bindgen]
impl DrawFPS {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DrawFPS {
        let window = web_sys::window().expect("");
        let performance = window.performance().expect("");
        let now = performance.now();
        DrawFPS { avg: 0.0, total: 0.0, start: now }
    }

    pub fn get_draw_fps(&mut self) -> JsValue {
        let window = web_sys::window().expect("No window");
        let performance = window.performance().expect("No `performance` object");
        let now = performance.now();
        let elapsed = now - self.start;
        let real_fps = (self.total * 1000.0) / elapsed;
        let virtual_fps = 1000.0 / self.avg;
        self.avg = 0.0;
        self.total = 0.0;
        self.start = now;
        let fps_result = FPSResult {
            avg: self.avg,
            num_frames: self.total,
            real_fps,
            virtual_fps,
            elapsed,
        };
        JsValue::from_serde(&fps_result).unwrap()
    }

    pub fn log_perf(&mut self, x: f64) {
        self.avg = (self.avg * self.total + x) / (self.total + 1.0);
        self.total += 1.0;
    }
}

thread_local! {
    static STRING_CTR: js_sys::Function = Reflect::get(&web_sys::window().unwrap(), js_intern!("String")).unwrap().dyn_into().unwrap();
}

pub fn coerce_str(js: &JsValue) -> String {
    STRING_CTR.with(|x| x.call1(&JsValue::UNDEFINED, js)).unwrap().as_string().unwrap()
}
