# React example

```html
<script src="/node_modules/react/dist/react.js"></script>
<script src="/node_modules/react-dom/dist/react-dom.js"></script>
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">

<div id="root"></div>
```

```css
#id {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
td {
    color: #1078d1;
}
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

function setRegularTable(table) {
    table.setDataListener(dataListener);
    table.draw();
}

window.onload = function () {
    window.ReactDOM.render(window.React.createElement("regular-table", {ref: setRegularTable}), document.getElementById("root"));
};
 ```