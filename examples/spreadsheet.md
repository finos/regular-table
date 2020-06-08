# Spreadsheet
A simple spreadsheet-like app which demonstrates use of [`regular-table`](https://github.com/jpmorganchase/regular-table).
Supports a simple expression language for cells starting with a `=`
character, such as `=sum(A2..C4)` for the sum of cell values within the
rectangular region (A2, C4).

```css
td {
    outline: none;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    min-width: 22px;
}
tbody th {
    border-right: 1px solid #eee;
}
```

```html
<regular-table></regular-table>
```

## Data Model

```javascript
window.DATA = Array.from(Array(78).fill()).map(() => Array(100).fill());

window.DATA_COLUMN_NAMES = (() => {
    const caps = Array.from(Array(26)).map((val, i) => String.fromCharCode(i + 65));
    return caps.concat(
        caps.map((letter) => letter + letter),
        caps.map((letter) => letter + letter + letter)
    );
})();

window.dataListener = function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: window.DATA[0].length,
        num_columns: window.DATA.length,
        row_headers: Array.from(Array(Math.ceil(y1) - y0).keys()).map((y) => [`${y + y0}`]),
        column_headers: window.DATA_COLUMN_NAMES.slice(x0, x1).map((x) => [x]),
        data: window.DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
};
```

## Expression Language

```javascript
function col2Idx(x) {
    return window.DATA_COLUMN_NAMES.indexOf(x);
}

window.flat = function flat(arr) {
    return arr
        .flat(1)
        .map((x) => parseInt(x))
        .filter((x) => !isNaN(x));
};

window.sum = function sum(arr) {
    return window.flat(arr).reduce((x, y) => parseInt(x) + parseInt(y));
};

window.avg = function avg(arr) {
    const x = window.flat(arr);
    return x.reduce((x, y) => parseInt(x) + parseInt(y)) / x.length;
};

window.slice = function (x0, y0, x1, y1) {
    return window.DATA.slice(x0, parseInt(x1) + 1).map((z) => z.slice(y0, parseInt(y1) + 1));
};

window.stringify = function (x, y) {
    let txt = window.DATA[x][y];
    let num = parseInt(txt);
    if (isNaN(num)) {
        num = txt;
    }
    return `${num}`;
};

const RANGE_PATTERN = /([A-Z]+)([0-9]+)\.\.([A-Z]+)([0-9]+)/g;
const CELL_PATTERN = /([A-Z]+)([0-9]+)/g;

window.compile = function compile(input) {
    const output = input
        .slice(1)
        .replace(RANGE_PATTERN, (_, x0, y0, x1, y1) => {
            return `slice(${col2Idx(x0)}, ${y0}, ${col2Idx(x1)}, ${y1})`;
        })
        .replace(CELL_PATTERN, (_, x, y) => {
            return `stringify(${col2Idx(x)}, ${y})`;
        });

    console.log(`Compiled '${input}' to '${output}'`);
    return eval(output);
};
```

## `regular-table` UI

```javascript
const table = document.getElementsByTagName("regular-table")[0];

function write(active_cell) {
    const meta = table.getMeta(active_cell);
    if (meta) {
        let text = active_cell.textContent;
        if (text[0] === "=") {
            text = window.compile(text);
        }
        window.DATA[meta.x][meta.y] = text;
        active_cell.blur();
        table.draw({invalid_viewport: true});
    }
}

function increment(active_cell) {
    const meta = table.getMeta(active_cell);
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    const next_row = rows[meta.ridx + 1];
    if (next_row) {
        const td = next_row.children[meta.cidx];
        td.focus();
    }
}

table.setDataListener(window.dataListener);

table.addStyleListener(() => {
    for (const td of table.get_tds()) {
        td.setAttribute("contenteditable", true);
    }
});

table.addEventListener("scroll", () => {
    write(document.activeElement);
});

table.addEventListener("keypress", (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        const target = document.activeElement;
        write(target);
        increment(target);
    }
});

table.addEventListener("focusout", (event) => {
    write(event.target);
});

table.draw();
```

## Appendix - Dependencies

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

```block
license: apache: 2.0
```
