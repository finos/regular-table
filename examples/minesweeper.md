# Minesweeper
A clone of the classic game Minesweeper with 1,000,000 cells, built with [`regular-table`](https://github.com/jpmorganchase/regular-table).  
    
```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

```css
body {
    background: black;
}
regular-table::-webkit-scrollbar-thumb {
    background-color: #fff !important;
}
regular-table td {
    max-width: 20px !important;
    min-width: 20px !important;
    height: 20px !important;
    font-family: monospace;
    font-weight: 700;
    text-align: center;
    padding: 0 !important;
    font-size: 16px;
}
regular-table td.unknown {
    background-color: #999;
    border-top: 4px solid #CCC;
    border-left: 4px solid #AAA;
    border-bottom: 4px solid #666;
    border-right: 4px solid #888;
}
td.boom,td.boom span {
    color: red !important;
    background-color: red !important;
    border: 0px !important;
}
regular-table {
    cursor: pointer;
}
td {
    background-color: white;
}
regular-table tbody:hover tr:hover td {
    background: white;
}
regular-table tbody:hover tr:hover td.unknown {
    background: #999;
}
table tr:hover {
    color: #333;
}
.flag, regular-table tbody:hover tr:hover td.flag {
    background-color: sandybrown;
}
.marker-1 {
    color: black;
    background-color: white;
}
.marker-2 {
    color: purple;
    background-color: white;
}
.marker-3 {
    color: blue;
    background-color: white;
}
.marker-4 {
    color: green;
    background-color: white;
}
.marker-5 {
    color: yellow;
    background-color: white;
}
.marker-6 {
    color: orange;
    background-color: white;
}
.marker-7 {
    color: red;
    background-color: white;
}
.marker-8 {
    color: black;
    background-color: white;
}
```

```html
<regular-table></regular-table>
```

```javascript
const WIDTH = 1000;
const HEIGHT = 1000;
const NUM_MINES = 130000;

let BOOM = false;

const MINE_ENUM = 9;
const FLAG_ENUM = 10;
const CLEAR_ENUM = -1;

const OFFSETS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 0],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];

const VIEW_DATA = Array(WIDTH)
    .fill(0)
    .map(() => Array(HEIGHT).fill(CLEAR_ENUM));

const MINE_DATA = Array(WIDTH)
    .fill(0)
    .map(() => Array(HEIGHT).fill(CLEAR_ENUM));

for (let i = 0; i < NUM_MINES; i++) {
    MINE_DATA[Math.floor(Math.random() * WIDTH)][Math.floor(Math.random() * HEIGHT)] = 9;
}

function* neighborIterator(x, y) {
    for (const [dx, dy] of OFFSETS) {
        const x2 = x + dx;
        const y2 = y + dy;
        if (x2 < 0 || x2 >= WIDTH || y2 < 0 || y2 >= HEIGHT) continue;
        yield [x2, y2];
    }
}

function clear(candidates) {
    while (candidates.length > 0) {
        let count = 0;
        const [x1, y1] = candidates.pop();
        if (x1 < 0 || x1 >= WIDTH || y1 < 0 || y1 >= HEIGHT) continue;

        for (const [x2, y2] of neighborIterator(x1, y1)) {
            if (MINE_DATA[x2][y2] === MINE_ENUM) {
                count++;
            }
        }
        VIEW_DATA[x1][y1] = count;
        if (count === 0) {
            for (const [x2, y2] of neighborIterator(x1, y1)) {
                if (VIEW_DATA[x2][y2] === CLEAR_ENUM) {
                    candidates.push([x2, y2]);
                }
            }
        }
    }
}

async function detonate(x, y) {
    if (VIEW_DATA[x][y] !== CLEAR_ENUM) return;
    if (MINE_DATA[x][y] === MINE_ENUM) {
        VIEW_DATA[x][y] = MINE_ENUM;
    } else {
        clear([[x, y]]);
    }
    await table.draw({invalid_viewport: true});
}

function format(x) {
    switch (x) {
        case CLEAR_ENUM:
            return "";
        case MINE_ENUM:
            BOOM = true;
            return "";
        case FLAG_ENUM:
            return "F";
        case 0:
            return "";
        default:
            return x;
    }
}

function styleListener() {
    for (const td of table.get_tds()) {
        const meta = table.getMeta(td);
        const val = VIEW_DATA[meta.x][meta.y];
        const numeric = parseInt(val);
        td.className = "";
        if (BOOM) {
            td.classList.add("boom");
        } else if (numeric > 0 && numeric < 9) {
            td.classList.add(`marker-${val}`);
            td.classList.toggle("unknown", false);
            td.classList.toggle("flag", false);
        } else {
            td.classList.toggle("unknown", VIEW_DATA[meta.x][meta.y] === CLEAR_ENUM);
            td.classList.toggle("flag", VIEW_DATA[meta.x][meta.y] === FLAG_ENUM);
        }
    }
}

function dataListener(x0, y0, x1, y1) {
    const data = VIEW_DATA.slice(x0, x1).map((col) => col.slice(y0, y1).map(format));
    const num_columns = VIEW_DATA.length;
    const num_rows = VIEW_DATA[0].length;

    return {
        num_rows,
        num_columns,
        data,
    };
}

function clickEventListener(event) {
    if (event.target.tagName === "TD") {
        const meta = table.getMeta(event.target);
        detonate(meta.x, meta.y);
    }
}

function contextMenuEventListener(event) {
    event.preventDefault();
    if (event.target.tagName === "TD") {
        const meta = table.getMeta(event.target);
        const val = VIEW_DATA[meta.x][meta.y];
        if (val > CLEAR_ENUM && val < 9) {
            const candidates = [];
            let count = 0;
            for (const [x2, y2] of neighborIterator(meta.x, meta.y)) {
                if (VIEW_DATA[x2][y2] !== FLAG_ENUM) {
                    candidates.push([x2, y2]);
                } else {
                    count++;
                }
            }
            if (count === val) {
                clear(candidates);
            }
        } else if (val === FLAG_ENUM) {
            VIEW_DATA[meta.x][meta.y] = CLEAR_ENUM;
        } else if (val === CLEAR_ENUM) {
            VIEW_DATA[meta.x][meta.y] = FLAG_ENUM;
        }
        table.draw({invalid_viewport: true});
    }
}

const table = document.getElementsByTagName("regular-table")[0];
table.setDataListener(dataListener);
table.addStyleListener(styleListener);
table.addEventListener("click", clickEventListener);
table.addEventListener("contextmenu", contextMenuEventListener);
table.draw();
```
