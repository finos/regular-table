/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import {_start_profiling_loop} from "./utils";
import {DatagridViewModel} from "./datagrid";
import MATERIAL_STYLE from "../less/material.less";

/**
 * Appends the default tbale CSS to `<head>`, should be run once on module
 *  import.
 *
 */
function _register_global_styles() {
    const style = document.createElement("style");
    style.textContent = MATERIAL_STYLE;
    document.head.appendChild(style);
}

/******************************************************************************
 *
 * Main
 *
 */

window.customElements.define("regular-table", DatagridViewModel);

_start_profiling_loop();
_register_global_styles();
