/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

#![macro_use]

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

#[macro_export]
macro_rules! js_object {
	($($key:expr, $value:expr);+ $(;)*) => {
		{
			use js_intern::{js_intern};
			let o = js_sys::Object::new();
			$(
				{
					let k = js_intern!($key);
                    Reflect::set(&o, k, &$value.into()).unwrap();
				}
			)*
			o
		}
	};

	($o:expr; with $($key:expr, $value:expr);+ $(;)*) => {
		{
			use js_intern::{js_intern};
			$(
				{
					let k = js_intern!($key);
                    Reflect::set($o, k, &$value.into()).unwrap();
				}
			)*
			$o
		}
	};
}

#[macro_export]
macro_rules! js_obj_field {
    ($value:expr, $key:expr) => {{
        use js_intern::js_intern;
        Reflect::get($value, js_intern!($key)).map(|x| x.unchecked_into::<js_sys::Object>())
    }};
}

#[macro_export]
macro_rules! js_html_field {
    ($value:expr, $key:expr) => {{
        use js_intern::js_intern;
        Reflect::get($value, js_intern!($key)).map(|x| x.unchecked_into::<web_sys::HtmlElement>())
    }};
}

#[macro_export]
macro_rules! js_arr_field {
    ($value:expr, $key:expr) => {{
        use js_intern::js_intern;
        Reflect::get($value, js_intern!($key)).map(|x| x.unchecked_into::<js_sys::Array>())
    }};
}

#[macro_export]
macro_rules! js_bool_field {
    ($value:expr, $key:expr) => {{
        use js_intern::js_intern;
        let k = js_intern!($key);
        Reflect::get($value, k)?.as_bool().ok_or(k)
    }};

    ($value:expr, $key:expr, $def:expr) => {{
        use js_intern::js_intern;
        let d = $def;
        Reflect::get($value, js_intern!($key)).unwrap_or(d).as_bool().unwrap_or(d)
    }};
}

#[macro_export]
macro_rules! js_f64_field {
    ($value:expr, $key:expr) => {{
        use js_intern::js_intern;
        let k = js_intern!($key);
        Reflect::get($value, k)?.as_f64().ok_or(k)
    }};

    ($value:expr, $key:expr, $def:expr) => {{
        use js_intern::js_intern;
        Reflect::get($value, js_intern!($key))?.as_f64().unwrap_or($def)
    }};
}
