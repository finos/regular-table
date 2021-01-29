/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_val(s: &JsValue);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_obj(s: &js_sys::Object);

    #[wasm_bindgen(js_namespace = console, js_name = log)]
    pub fn log_str(s: &str);
}

thread_local! {
    pub static METADATA_MAP: js_sys::WeakMap = js_sys::WeakMap::new();
}

#[wasm_bindgen]
pub fn get_metadata_map() -> js_sys::WeakMap {
    METADATA_MAP.with(|x| x.clone())
}

pub trait StaticKey {
    fn key(&'static self) -> JsValue;
}

impl StaticKey for std::thread::LocalKey<JsValue> {
    fn key(&'static self) -> JsValue {
        self.with(|x| (*x).clone())
    }
}

// TODO this works but only saves like 5k overall and may impede errors?

// pub trait JSFastUnwrap<T> {
//     fn unwrap_fast(self) -> T;
// }

// impl<T> JSFastUnwrap<T> for Option<T> {
//     #[inline]
//     fn unwrap_fast(self) -> T {
//         use std::process;
//         match self {
//             Some(t) => t,
//             None => process::abort(),
//         }
//     }
// }

// impl<T, E> JSFastUnwrap<T> for Result<T, E> {
//     #[inline]
//     fn unwrap_fast(self) -> T {
//         use std::process;
//         match self {
//             Ok(t) => t,
//             Err(e) => {
//                 // log_str(&formate);
//                 process::abort()
//             }
//         }
//     }
// }
