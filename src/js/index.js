/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {_start_profiling_loop} from "./utils";
import {RegularViewModel} from "./custom_element";

/******************************************************************************
 *
 * Main
 *
 */

window.customElements.define("regular-table", RegularViewModel);

_start_profiling_loop();
