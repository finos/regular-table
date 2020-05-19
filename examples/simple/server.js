/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

 const { program } = require('commander');
const fs = require("fs");


program
  .option('--port <number>', 'specify port for server to run on', 8080)
  .parse(process.argv);

fs.realpath(`${__dirname}/../../packages/html-grid/dist/umd`, (err, html_grid_assets) => {
  const {WebSocketServer} = require("@finos/perspective");
  new WebSocketServer({assets: [__dirname, html_grid_assets], port: program.port});
});
