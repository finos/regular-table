<p align="center">
<img alt="regular-table" src="https://raw.githubusercontent.com/jpmorganchase/regular-table/master/logo.png" width="300">
</p>

<p align="center">
<a href="https://www.npmjs.com/package/regular-table"><img alt="NPM Version" src="https://img.shields.io/npm/v/regular-table.svg?color=brightgreen&style=flat-squar"></a>
<a href="https://travis-ci.org/jpmorganchase/regular-table"><img alt="Travis Status" src="https://travis-ci.org/jpmorganchase/regular-table.svg?branch=master"></a>
</p>

#

A Javascript library for the browser, `regular-table` exports
a [custom element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
named `<regular-table>`,
which renders a regular HTML `<table>` to a `sticky` position within a scollable
viewport.  Only visible cells are rendered and queried from a natively `async`
virtual data model, making `regular-table` ideal for enormous or remote data
sets.  Use it to build Data Grids, Spreadsheets, Pivot Tables, File Trees, or
anytime you need:

* Just a regular `<table>`.
* Virtually rendered for high-performance.
* `async` data model handles slow, remote, enormous, and/or distributed backends.
* Easy to style, works with any regular CSS for `<table>`.
* Small bundle size, no dependencies.

## Examples

||||
|:--|:--|:--|
|two_billion_rows|canvas_data_model|perspective_headers|
|[![two_billion_rows](https://bl.ocks.org/texodus/raw/483a42e7b877043714e18bea6872b039/thumbnail.png)](https://bl.ocks.org/texodus/483a42e7b877043714e18bea6872b039)|[![canvas_data_model](https://bl.ocks.org/texodus/raw/4c6537e23dff3c8f97c316559cef012e/thumbnail.png)](https://bl.ocks.org/texodus/4c6537e23dff3c8f97c316559cef012e)|[![perspective_headers](https://bl.ocks.org/texodus/raw/d92520387cb7aa5752dad7286cbb89c9/thumbnail.png)](https://bl.ocks.org/texodus/d92520387cb7aa5752dad7286cbb89c9)|
|minesweeper|file_browser|spreadsheet|
|[![minesweeper](https://bl.ocks.org/texodus/raw/96a9ed60d0250f7d3187c0fed5f5b78c/thumbnail.png)](https://bl.ocks.org/texodus/96a9ed60d0250f7d3187c0fed5f5b78c)|[![file_browser](https://bl.ocks.org/texodus/raw/a7b7588c899e3953dd8580e81c51b3f9/thumbnail.png)](https://bl.ocks.org/texodus/a7b7588c899e3953dd8580e81c51b3f9)|[![spreadsheet](https://bl.ocks.org/texodus/raw/3e0e3d6f8bf8b47294a7847b402b55fb/thumbnail.png)](https://bl.ocks.org/texodus/3e0e3d6f8bf8b47294a7847b402b55fb)|

## Documentation

What follows functions as a quick-start guide, and will explain the basics of
the Virtual Data Models, Styling and Interaction APIs.  Complete [API docs](https://github.com/jpmorganchase/regular-table/blob/master/api.md)
and documented [examples](https://github.com/jpmorganchase/regular-table/tree/master/examples)
are also available.

- QuickStart
  - [Installation](#installation)
  - [`<regular-table>` Custom Element](#regular-table-custom-element)
  - [`.setDataListener()` Virtual Data Model](#setdatalistener-virtual-data-model)
    - [Column and Row Headers](#column-and-row-headers)
    - [Hierarchial/Group Headers](#hierarchialgroup-headers)
    - [`async` Data Models](#async-data-models)
  - [`.addStyleListener()` and `getMeta()` Styling](#addstylelistener-and-getmeta-styling)
  - [`.addEventListener()` Interaction](#addeventlistener-interaction)
  - [Pivots, Filters, Sorts, and Column Expressions with `perspective`](#pivots-filters-sorts-and-column-expressions-with-perspective)
  - [Development](#development)

- [API Docs](https://github.com/jpmorganchase/regular-table/blob/master/api.md)

- Annotated Examples
  - [2d_array.md](examples/2d_array.md)
  - [canvas_data_model.md](examples/canvas_data_model.md)
  - [file_browser.md](examples/file_browser.md)
  - [minesweeper.md](examples/minesweeper.md)
  - [perspective.md](examples/perspective.md)
  - [react.md](examples/react.md)
  - [spreadsheet.md](examples/spreadsheet.md)
  - [two_billion_rows.md](examples/two_billion_rows.md)

## Installation

Include via a CDN like [JSDelivr](https://cdn.jsdelivr.net/npm/regular-table):

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/regular-table/dist/css/material.css">
```

Or, add to your project via `yarn`:

```bash
yarn add regular-table
```

... then import into your asset bundle.

```javascript
import "regular-table";
import "regular-table/dist/css/material.css";
```

## `<regular-table>` Custom Element

`regular-table` exports no symbols, only the `<regular-table>` Custom Element 
which is registered as a module import side-effect.  Once loaded,
`<regular-table>` can be used just like any other `HTMLElement`, using regular
browser APIs:

```javascript
const regularTable = document.createElement("regular-table");
document.body.appendChild(regularTable);
```

... or from regular HTML:

```html
<regular-table></regular-table>
```

... or from your library of choice, as long as it supports regular HTML! Here's
an example for [React/JSX](https://reactjs.org/):

```javascript
const App = () => <regular-table></regular-table>;
ReactDOM.render(<App />, document.getElementById("root"));
```

## `.setDataListener()` Virtual Data Model

Let's start with with a simple data model, a two dimensional `Array`.  This one
is very small at 3 columns x 6 rows, but even for very small data sets,
`regular-table` won't read your entire dataset at once.  Instead, we'll need
to write a simple _virtual_ data model to access `DATA` and `COLUMN_NAMES`
indirectly.

```javascript
const DATA = [
    [0, 1, 2, 3, 4, 5],
    ["A", "B", "C", "D", "E", "F"],
    [true, false, true, false, true, false],
];
```

When clipped by the scrollable viewport, you may end up with a `<table>` of just
a rectangular region of `DATA`, rather than the entire set.  A simple viewport
2x2 may yield this `<table>`:

<table>
<tbody>
<tr>
<td>0</td>
<td>A</td>
</tr>
<tr>
<td>1</td>
<td>B</td>
</tr>
</tbody>
</table>

```json
{
    "num_rows": 26,
    "num_columns": 3,
    "data": [
        [0, 1],
        ["A", "B"]
    ]
}
```

Here's a an implementation for this simple _virtual_ data model,
the function `getDataSlice()`.  This function is called by your 
`<regular-table>` whenever it needs more data, with coordinate arguments,
`(x0, y0)` to `(x1, y1)`.  Only
this region is needed to render the viewport, so `getDataSlice()` returns 
this rectangular `slice` of `DATA`.  For the window (0, 0) to (2, 2),
`getDataSlice()` would generate an Object as above, containing the `data` slice,
as well as the overall dimensions of 
`DATA` itself ( `num_rows`, `num_columns`), for sizing the scroll area.  To
render this virtual data model to a regular HTML `<table>`, register this data
model via the `setDataListener()` method:

```javascript
function getDataSlice(x0, y0, x1, y1) {
    return {
        num_rows: (num_rows = DATA[0].length),
        num_columns: DATA.length,
        data: DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
}

regularTable.setDataListener(getDataSlice);
```

This will render your regular HTML `<table>` !  Your DOM will look something
like this, depending on the size of your viewport.  Notice there are fewer rows
and columns in the resulting HTML, e.g. the column `Column 3 (boolean)` - as you
scroll, more data will be fetched from `getDataSlice()`, and parts of the
`<table>` will redrawn or extended as needed.

```html
<regular-table>

    <table>
        <tbody>
            <tr>
                <td>0</td>
                <td>A</td>
            </tr>
            <tr>
                <td>1</td>
                <td>B</td>
            </tr>
        </tbody>
    </table>

</regular-table>
```

### Column and Row Headers

`regular-table` can also generate Hierarchial Row and Column Headers, using
`<th>` elements which layout in a `fixed` position within the virtual table.
It can generate Column Headers (within the `<thead>`), or Row Headers (the first
children of each `tbody tr`), via the `column_headers` and `row_headers`
properties (respectively) of your data model's `Response` object.  This can be
renderered with `column_headers`, a two dimensional `Array` which must be of 
length `x1 - x0`, one `Array` for every column in your `data` window.


<table>
<thead>
<tr>
<th>Column 1 (number)</th>
<th>Column 2 (string)</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>A</td>
</tr>
<tr>
<td>1</td>
<td>B</td>
</tr>
</tbody>
</table>

```json
{
    "num_rows": 26,
    "num_columns": 3,
    "data": [
        [0, 1],
        ["A", "B"]
    ],
    "column_headers": [
        ["Column 1 (number)"],
        ["Column 2 (string)"]
    ]
}
```

###   Hierarchial/Group Headers

`regular-table` supports multiple `<tr>` of `<th>`, and also uses `colspan` and
`rowspan` to merge simple consecutive names, which allows description of simple
Row and Column Group Hierarchies such as this:


<table>
<thead>
<tr>
<th colspan="2" rowspan="2"></th>
<th colspan="2">Colgroup 1</th>
</tr>
<tr>
<th>Column 1</th>
<th>Column 2</th>
</tr>
</thead>
<tbody>
<tr>
<th rowspan="2">Rowgroup 1</th>
<th>Row 1</th>
<td>0</td>
<td>A</td>
</tr>
<tr>
<th>Row 2</th>
<td>1</td>
<td>B</td>
</tr>
</tbody>
</table>

```json
{
    "num_rows": 26,
    "num_columns": 3,
    "data": [
        [0, 1],
        ["A", "B"]
    ],
    "row_headers": [
        ["Rowgroup 1", "Row 1"],
        ["Rowgroup 1", "Row 2"]
    ],
    "column_headers": [
        ["Colgroup 1", "Column 1"],
        ["Colgroup 1", "Column 2"]
    ]
}
```

Note that in the rendered HTML, for these Row and Column `Array`,
repeated elements in a sequence will be automatically merged via `rowspan` and
`colspan` attributes.  In this example, e.g. `"Rowgroup 1"` will only output
to one `<th>` node in the resulting `<table>`.

### `async` Data Models

With an `async` data model, it's easy to serve `getDataSlice()` remotely
from `node.js` or re-implement the JSON response protocol in any language.
Just return a `Promise()` from, or use an `async` function as an argument to,
`setDataListener()`.  Your `<regular-table>` won't render until the
`Promise` is resolved, nor will it call your data model function again until
the current call is resolved or rejected.  The following `async` example uses a
Web Worker, but the same principle applies to Web Sockets, `readFile()` or any
other asynchronous source.  Returning a `Promise` blocks rendering until the Web
Worker replies:

```javascript
// Browser

let callback;

worker.addEventListener("message", (event) => {
    callback(event.data);
});

regularTable.setDataListener((...viewport) => {
    return new Promise(function (resolve) {
        callback = resolve;
        worker.postMessage(viewport);
    });
});
```

```javascript
// Web Worker

self.addEventListener("message", async (event) => {
    const response = await getDataSlice.apply(null, event.data);
    self.postMessage(response);
});
```

## `.addStyleListener()` and `getMeta()` Styling

`regular-table` can be styled trivially with just regular CSS for `<table>`.

```css
// Zebra striping!
regular-table tr:nth-child(even) td {
    background: rgba(0,0,0,0.2);
}
```
However, CSS alone cannot select on properties of your _data_ - if you scroll
this example, the 2nd row will always be the striped one.  Some other
data-reliant style examples include:

* Styling a specific column in the virtual data set, as ` <td>` may represent
  a different column based on horizontal scroll position.
* Styling cells by value, +/-, heatmaps, categories, etc.
* Styling cells based on data within-or-outside of the virtual viewport,
  grouping depth, grouping categories, etc.

To make CSS that is virtual-data-model-aware, you'll need to use
`addStyleListener()`, which invokes a callback whenever the `<table>` is
re-rendered, such as through API invocations of `draw()` and user-initiated
events such as scrolling.  Within this optionally `async` callback, you can
select `<td>`, `<th>`, etc. elements via regular DOM API methods like
`querySelectorAll()`.

```javascript
// Only select row_headers!
table.addStyleListener(() => {
    for (const th of table.querySelectorAll("tbody th")) {
        style_th(th);
    }
});
```

Once you've selected the `<td>` and `<th>` you want to paint, `getMeta()`
will return a `MetaData` record of information about the HTMLElement's
virtual position.  This example uses `meta.x`, the position in `data`-space,
to make virtual-scroll-aware zebra striping.

```javascript
function style_th(th) {
    const meta = table.getMeta(th);
    th.classList.toggle("zebra-striped", meta.x % 2 === 0);
}
```

```css
.zebra-striped {
    background-color: rgba(0,0,0,0.2);
}
```

## `.addEventListener()` Interaction

`<regular-table>` is a nornal `HTMLElement`!  Use the `regular-table` API
in concert with regular DOM API methods that work on other `HTMLElement`
to create advanced functionality, such as this example of virtual row
select:

```javascript
const selected_rows = [];

table.addEventListener("mousedown", (event) => {
    const meta = table.getMeta(event.target);
    if (meta && meta.y >= 0) {
        selected_rows.push(meta.y);
        table.draw();
    }
});

table.addStyleListener(() => {
    for (const td of table.querySelectorAll("td")) {
        const meta = table.getMeta(td);
        td.classList.toggle("row-selected", selected_rows.includes(meta.y));
    }
});
```

Advanced examples can be found in the [`examples`](https://github.com/jpmorganchase/regular-table/tree/master/examples)
directory, and in the [`bl.ocks` example gallery](https://github.com/jpmorganchase/regular-table#examples).

## Pivots, Filters, Sorts, and Column Expressions with `perspective`

`regular-table` is natively compatible with [`perspective`](https://github.com/finos/perspective/),
a WebAssembly streaming visualization engine.  By using a `persective.Table` as a
Virtual Data Nodel, it becomes simple to achieve user-driven row and
column pivots, filters, sorts, and column expressions, as well as charts
and persistent layouts, from high-frequency updating data. 

<!-- add examples when perspective 0.5.1 is released -->

## Development

First install `dev_dependencies`:

```bash
yarn
```

Build the library

```bash
yarn build
```

Run the test suite

```bash
yarn test
```

Start the example server at [`http://localhost:8080/examples/`](http://localhost:8080/examples/)

```bash
yarn start
```
<!-- 
## Stats

[![Build Status](https://travis-ci.org/jpmorganchase/regular-table.svg?branch=master)](https://travis-ci.org/jpmorganchase/regular-table)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/regular-table) 
-->