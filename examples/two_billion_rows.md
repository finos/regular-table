# Two Billion Rows
An example of a [`regular-table`](https://github.com/jpmorganchase/regular-table)
data model which generates data on-the-fly to simulate a 2,000,000,000 row *
10,000 column `<table>`.

# Style
This example uses a tiny dab of custom CSS to lighten the mood

```css
td {
    color: #1078d1;
}
```

... but is otherwise just a `regular-table`

```html
<regular-table id="my_table"></regular-table>
```

# Virtual Data Model
This data model creates data on-the-fly, from a _virtual_ data set of really
egregious dimensions:

```javascript
const NUM_ROWS = 2000000000;
const NUM_COLUMNS = 1000;

const formatter = new Intl.NumberFormat("en-us");
const range = (x0, x1, f) => Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));

function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: NUM_ROWS,
        num_columns: NUM_COLUMNS,
        column_headers: range(x0, x1, (i) => [`Column ${i}`]),
        data: range(x0, x1, (x) => range(y0, y1, (y) => formatter.format(x + y))),
    };
}
```

... and run just like a normal `regular-table`

```javascript
window.my_table.setDataListener(dataListener);
window.my_table.draw();
```

# Appendix (Dependencies)

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

```block
license: apache-2.0
```
