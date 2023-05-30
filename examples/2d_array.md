# Simple Example

You'll need to create a `<regular-table>`. The easiest way is to just add one directly to your page's HTML, and we'll give it an `id` attribute to refer to it easily later. Fun fact - elements with
`id` attributes are accessible on the global `window` Object in Javascript via `window.${id}`, at least
[maybe](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="regularTable"></regular-table>
```

Let's start with with a simple data model, a two dimensional `Array`. This one is very small at 3 columns x 26 rows, but even for very small data sets, `regular-table` won't read your entire dataset
at once. Instead, we'll need to write a simple _virtual_ data model to access `DATA` and `COLUMN_NAMES` indirectly.

```javascript
const DATA = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
];
```

When clipped by the scrollable viewport, you may end up with a `<table>` of just a rectangular region of `DATA`, rather than the entire set. A simple viewport 2x2 may yield this `<table>`:

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
    "num_rows": 15,
    "num_columns": 3,
    "data": [
        [0, 1],
        ["A", "B"]
    ]
}
```

Here's a an implementation for this simple _virtual_ data model, the function `dataListener()`. This function is called by your `<regular-table>` whenever it needs more data, with coordinate
arguments, `(x0, y0)` to `(x1, y1)`. Only this region is needed to render the viewport, so `dataListener()` returns this rectangular `slice` of `DATA`. For the window (0, 0) to (2, 2),
`dataListener()` would generate an Object as above, containing the `data` slice, as well as the overall dimensions of `DATA` itself ( `num_rows`, `num_columns`), for sizing the scroll area. To render
this virtual data model to a regular HTML `<table>`, register this data model via the `setDataListener()` method:

```javascript
export function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: DATA[0].length,
        num_columns: DATA.length,
        data: DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
}
```

You can register and invoke this table thusly:

```javascript
export function init() {
    window.regularTable.setDataListener(dataListener);
    window.regularTable.draw();
}
```

... which we'll do on the Window `"load"` event.

```html
<script type="module">
    import { init } from "/dist/examples/2d_array.js";
    window.addEventListener("load", () => init());
</script>
```

# Appendix (Dependencies)

```html
<script src="/dist/esm/regular-table.js"></script>
<link rel="stylesheet" href="/dist/css/material.css" />
```

```block
license: apache-2.0
```
