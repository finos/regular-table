/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

import {get_metadata_map} from "../../pkg";

// Singleton `WeakMap`s to store metadata for td/th elements, as well as the
// datagrids themselves for each `<perspective-viewer>`
export const METADATA_MAP = get_metadata_map();

// Output runtime debug info like FPS.
export const DEBUG = true;

// The largest size virtual <div> in (px) that Chrome can support without
// glitching.
const isFirefox = navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
export const BROWSER_MAX_HEIGHT = isFirefox ? 5000000 : 10000000;
