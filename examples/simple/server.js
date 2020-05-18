/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require("fs");

fs.realpath(`${__dirname}/../../packages/html-grid/dist/umd`, (err, html_grid_assets) => {
  const {WebSocketServer} = require("@finos/perspective");
  new WebSocketServer({assets: [__dirname, html_grid_assets]});
});


