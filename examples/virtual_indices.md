# Virtual Indices

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

```css
td {
    color: #1078d1;
}
```

```html
<regular-table></regular-table>
```

```javascript
const NUM_ROWS = 200000;
const NUM_COLUMNS = 1000;

const formatter = new Intl.NumberFormat("en-us");
const clamp = (x, y, offset = 0) => Math.floor(x / y) * y + offset + "";
const range = (x0, x1, f) => Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));

function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: NUM_ROWS,
        num_columns: NUM_COLUMNS,
        column_headers: range(x0, x1, (i) => [`Group ${clamp(i, 10, 0)}`, `Column ${i}`]),
        row_headers: range(y0, y1, (i) => ["Group " + clamp(i, 10, 0), "Row " + i]),
        data: range(x0, x1, (x) => range(y0, y1, (y) => formatter.format(x + y))),
    };
}

const table = document.getElementsByTagName("regular-table")[0];
table.setDataListener(dataListener);
table.draw();
```