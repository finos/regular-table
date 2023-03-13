# Two Billion Rows

An example of a [`regular-table`](https://github.com/finos/regular-table) data model which generates data on-the-fly to simulate a 2,000,000,000 row `<table>`.

## HTML

You'll need a `<regular-table>` for this example, which you can create in HTML:

```html
<regular-table></regular-table>
```

## Virtual Data Model

To simulate a _really big_ data set, this model will take advantage of the `regular-table` Virtual Data Model to generate data only for the window currently visible on screen.  This is how _really big_:

```javascript
const NUM_ROWS = 2000000000;
const NUM_COLUMNS = 1000;
```

The `dataListener` function for this virtual data set is simple, and returns the static dimensions directly:

```javascript
export function dataListener(num_rows, num_columns) {
    return (x0, y0, x1, y1) => ({
        num_rows,
        num_columns,
        row_headers: range(y0, y1, group_header.bind(null, "Row")),
        column_headers: range(x0, x1, group_header.bind(null, "Column")),
        data: range(x0, x1, (x) =>
            range(y0, y1, (y) => formatter.format(x + y))
        ),
    });
}
```

It makes copious use of the `range()` function, which generates a sequence from [`x0` .. `x1`], mapped by the function argument `f()`.

```javascript
function range(x0, x1, f) {
    return Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));
}
```

Generated row and column headers, as well as header groups for every group of 10, are also done on demand via `group_header()`, this time using the `clamp()` function.

```javascript
function group_header(name, i) {
    const group = clamp(i, 10);
    return [`Group ${group}`, `${name} ${formatter.format(i)}`];
}
```

`clamp()` formats a number `x` to it's nearest `y`

```javascript
const clamp = (x, y) => formatter.format(Math.floor(x / y) * y);
```

## `regular-table` Initialization

With these, all that's left is to register the `dataListener` and draw the `<table>`.

```javascript
export function init() {
    const table = document.getElementsByTagName("regular-table")[0];
    const dl = dataListener(NUM_ROWS, NUM_COLUMNS);
    table.setDataListener(dl);
    table.draw();
}
```

We'll initialize this table within a `<script>` tag, so that this ".js" output from `literally` of this Markdown file will not initialize, allowing `dataListener()` to be re-used as a data model in other examples.

```html
<script type="module">
    import {init} from "https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/examples/two_billion_rows.js";
    window.addEventListener("load", () => init());
</script>
```

## Styling

We want to distinguish the cells from the headers:

```css
td {
    color: #1078d1;
}
```

And some special styling to separate the `row_headers` from the `column_headers`:

```css
tbody th:last-of-type,
thead tr:nth-child(2) th:nth-child(2),
thead tr:first-child th:first-child {
    border-right: 1px solid #ddd;
}
```

## Appendix (Utilities)

A formatter for Numbers:

```javascript
const formatter = new Intl.NumberFormat("en-us");
```

## Appendix (Dependencies)

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css">
```

```block
license: apache-2.0
```

