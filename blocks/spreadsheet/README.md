## Spreadsheet

A simple spreadsheet-like app which demonstrates use of [`regular-table`](https://github.com/finos/regular-table). Supports a simple expression language for cells starting with a `=` character, such as `=sum(A2..C4)` for the sum of cell values within the rectangular region (A2, C4).

## Data Model

The `<regular-table>` in question uses the simplest data model of all, the humble 2D `Array`.  We'll start with an empty one in columnar-orientation.

```javascript
const NUM_COLUMNS = 200;
const NUM_ROWS = 1000;

const DATA = Array(NUM_COLUMNS)
    .fill()
    .map(() => Array(NUM_ROWS).fill());
```

In Excel-like fashion though, we'll want _alphabetic_ symbols for `column_headers`, so we'll generate a sequence of those using  `String.fromCharCode()`.

```javascript
const DATA_COLUMN_NAMES = generate_column_names();

function generate_column_names() {
    const nums = Array.from(Array(26));
    const alphabet = nums.map((val, i) => String.fromCharCode(i + 65));
    let caps = [],
        i = 1;
    while (caps.length < NUM_COLUMNS) {
        caps = caps.concat(alphabet.map((letter) => to_column_name(i, letter)));
        i++;
    }
    return caps;
}

function to_column_name(i, letter) {
    return Array(i).fill(letter).join("");
}
```

This leads to a simple Virtual Data Model based on `Array.prototype.slice()`.

```javascript
function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: DATA[0].length,
        num_columns: DATA.length,
        row_headers: Array.from(Array(Math.ceil(y1) - y0).keys()).map((y) => [
            `${y + y0}`,
        ]),
        column_headers: DATA_COLUMN_NAMES.slice(x0, x1).map((x) => [x]),
        data: DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
}
```

We can go ahead and register this `dataListener` with our `<regular-table>` now, since nothing will happen within this cycle of the event loop until `draw()` is called.

```javascript
const table = document.getElementsByTagName("regular-table")[0];
table.setDataListener(dataListener);
```

## Expression Language

Our expression language features this expansive standard library:

```javascript
function sum(arr) {
    return flat(arr).reduce((x, y) => parseInt(x) + parseInt(y));
}

function avg(arr) {
    const x = flat(arr);
    return x.reduce((x, y) => parseInt(x) + parseInt(y)) / x.length;
}
```

It will also internally use these helper functions:

* `stringify(2, 6)` for cell references `B6`
* `slice(1, 3, 1, 5)` for rectangular slices `A3..A5`

```javascript
function stringify(x, y) {
    let txt = DATA[x][y];
    let num = parseInt(txt);
    if (isNaN(num)) {
        num = txt;
    }
    return `${num}`;
}

function slice(x0, y0, x1, y1) {
    return DATA.slice(x0, parseInt(x1) + 1).map((z) =>
        z.slice(y0, parseInt(y1) + 1)
    );
}
```

```javascript
function col2Idx(x) {
    return DATA_COLUMN_NAMES.indexOf(x);
}

function flat(arr) {
    return arr
        .flat(1)
        .map((x) => parseInt(x))
        .filter((x) => !isNaN(x));
}
```

The evaluation engine uses the most powerful, performant and _utilized_ general purpose parsing framework available today: `Regex`.

```javascript
const RANGE_PATTERN = "([A-Z]+)([0-9]+)\\.\\.([A-Z]+)([0-9]+)";
const CELL_PATTERN = "([A-Z]+)([0-9]+)";
```

The `compile()` function simply removes the leading `=` and applies these regular expressions via `replace()` - there is no need to handle nested cases, since neither of these patterns are recursive.

```javascript
function compile(input) {
    const output = input
        .slice(1)
        .replace(
            new RegExp(RANGE_PATTERN, "g"),
            (_, x0, y0, x1, y1) =>
                `slice(${col2Idx(x0)}, ${y0}, ${col2Idx(x1)}, ${y1})`
        )
        .replace(
            new RegExp(CELL_PATTERN, "g"),
            (_, x, y) => `stringify(${col2Idx(x)}, ${y})`
        );
    console.log(`Compiled '${input}' to '${output}'`);
    return eval(output);
}
```

## User Interaction

```javascript

const SELECTED_POSITION = {x: 0, y: 0};
```

We will need a way to track the `SELECTED_POSITION` in the `regular-table`  with the `x` and `y` coordinates currently focused so that we can scroll  to another distant part of the table and back with our selection preserved. We can default it to the origin.

```javascript

const updateFocus = () => {
    const tds = table.querySelectorAll("td");
    for (const td of tds) {
        const meta = table.getMeta(td);
        if (meta.x === SELECTED_POSITION.x && meta.y === SELECTED_POSITION.y) {
            td.focus();
        }
    }
};

table.addEventListener("click", (event) => {
    const meta = table.getMeta(event.target);
    SELECTED_POSITION.x = meta.x;
    SELECTED_POSITION.y = meta.y;
    updateFocus();
});
```

We will use `updateFocus` either directly or by adding it as a style listener below to refocus the `td` on our `SELECTED_POSITION` whenever the `regular-table`s `draw()`  completes - due to scrolling or key navigation.

We'll need to ensure that on click the cell target is selected and has `focus()`.

```javascript

table.addStyleListener(() => {
    for (const td of table.querySelectorAll("td")) {
        td.setAttribute("contenteditable", true);
    }
});

table.addStyleListener(updateFocus);

table.draw();
```

`contenteditable` takes care of most of the basics for us, but we'll still need to update our data model when the user evaluates a cell.  Given a cell, this is a simple task of checking the first character for `"="` to determine whether this cell needs to be `eval()`'d, then setting the Array contents of `DATA` directly and calling `draw()` to update the `regular-table`.

```javascript
function write(active_cell) {
    const meta = table.getMeta(active_cell);
    if (meta) {
        let text = active_cell.textContent;
        if (text[0] === "=") {
            text = compile(text);
        }
        DATA[meta.x][meta.y] = text;
        active_cell.blur();
        clear_highlight();
        table.draw();
    }
}
```

We'll call this function whenever the user evaluates a cell, such as when the `return` key is pressed, by looking up the element with focus, `document.activeElement`.

```javascript
table.addEventListener("keypress", (event) => {
    const target = document.activeElement;
    if (event.keyCode === 13) {
        event.preventDefault();
        if (event.shiftKey) {
            moveSelection(target, 0, -1);
        } else {
            moveSelection(target, 0, 1);
        }
    }
});

table.addEventListener("keyup", (event) => {
    const target = document.activeElement;
    if (event.keyCode !== 13) {
        highlight(target);
    }
});

table.addEventListener("keydown", (event) => {
    const target = document.activeElement;
    switch (event.keyCode) {
        // tab
        case 9:
            event.preventDefault();
            if (event.shiftKey) {
                moveSelection(target, -1, 0);
            } else {
                moveSelection(target, 1, 0);
            }
            break;
        // left arrow
        case 37:
            moveSelection(target, -1, 0);
            break;
        // up arrow
        case 38:
            moveSelection(target, 0, -1);
            break;
        // right arrow
        case 39:
            moveSelection(target, 1, 0);
            break;
        // down arrow
        case 40:
            moveSelection(target, 0, 1);
            break;
    }
});
```

These key handlers also make use of `moveSelection()`, which uses some simple metadata-math to look up the next cell in either the `x` or `y` direction and update the `SELECTED_POSITION` - scrolling the table if  necessary and providing a small buffer to the edge of the visible table.

```javascript
const SCROLL_AHEAD = 4;

async function moveSelection(active_cell, dx, dy) {
    const meta = table.getMeta(active_cell);
    if (dx !== 0) {
        if (meta.x + dx < NUM_COLUMNS && 0 <= meta.x + dx) {
            SELECTED_POSITION.x = meta.x + dx;
        }
        if (meta.x1 <= SELECTED_POSITION.x + SCROLL_AHEAD) {
            await table.scrollToCell(meta.x0 + 2, meta.y0, NUM_COLUMNS, NUM_ROWS);
        } else if (SELECTED_POSITION.x - SCROLL_AHEAD < meta.x0) {
            if (0 < meta.x0 - 1) {
                await table.scrollToCell(meta.x0 - 1, meta.y0, NUM_COLUMNS, NUM_ROWS);
            } else {
                await table.scrollToCell(0, meta.y0, NUM_COLUMNS, NUM_ROWS);
            }
        }
    }

    if (dy !== 0) {
        if (meta.y + dy < NUM_ROWS && 0 <= meta.y + dy) {
            SELECTED_POSITION.y = meta.y + dy;
        }
        if (meta.y1 <= SELECTED_POSITION.y + SCROLL_AHEAD) {
            await table.scrollToCell(meta.x0, meta.y0 + 1, NUM_COLUMNS, NUM_ROWS);
        } else if (SELECTED_POSITION.y - SCROLL_AHEAD + 2 < meta.y0) {
            if (0 < meta.y0 - 1) {
                await table.scrollToCell(meta.x0, meta.y0 - 1, NUM_COLUMNS, NUM_ROWS);
            } else {
                await table.scrollToCell(meta.x0, 0, NUM_COLUMNS, NUM_ROWS);
            }
        }
    }
    updateFocus();
}
```

There are some simple quality-of-life improvements we can make as well. By default, a `scroll` event such as initiated by the mouse wheel will cause `regular-table` to re-render, which will result in the very un-spreadsheet  like behavior of resetting a cell which has focus and was in a partial state of edit.  To prevent this, we'll call `write()` when a scroll event happens.

```javascript
table.addEventListener("scroll", () => {
    write(document.activeElement);
});
```

In fact, let's go ahead and do this anytime focus is lost on an element within our `<regular-table>`.

```javascript
table.addEventListener("focusout", (event) => {
    write(event.target);
});
```

## Cell Highlighting

Wouldn't it be cool if the spreadsheet highlighted the cells that would be including in a selection, _as you type?_  It's no longer a far-fetched dream, rather `spredsheet.md` already does this!

The `highlight()` function is similar to `compile()`, except in this case, the compiler output is `class` attributes on `<td>` elements.

```javascript
async function highlight(active_cell) {
    clear_highlight();
    const text = active_cell.textContent;
    const meta = table.getMeta(active_cell);

    for (const [x, y] of cell_iter(CELL_PATTERN, text)) {
        paint_highlight(x + 1, y, meta);
    }

    for (const [x0, y0, x1, y1] of cell_iter(RANGE_PATTERN, text)) {
        for (let i = x0; i <= x1; i++) {
            for (let j = y0; j <= y1; j++) {
                paint_highlight(i + 1, j, meta);
            }
        }
    }
}
```

There are three cell-level helper functions - `clear_highlight()` and `paint_highlight()` remove and apply the cell highlighting (respectively), and `cell_iter()` generator produces a sequence of match cells, translated into `regular-table` Metadata coordinates (`x`, `y`).

```javascript
function clear_highlight() {
    for (const td of table.querySelectorAll("td.highlight")) {
        td.classList.remove("highlight");
    }
}

function* cell_iter(patt, text) {
    let match;
    let regex = new RegExp(patt, "g");
    while ((match = regex.exec(text)) !== null) {
        yield match
            .slice(1)
            .map((x, i) => (i % 2 === 0 ? col2Idx(x) : parseInt(x)));
    }
}

function paint_highlight(x, y, meta) {
    const tr = table.querySelector("tbody").children[y - meta.y0];
    const td = tr.children[x - meta.x0];
    td.classList.add("highlight");
}
```

## HTML and CSS

There is not much elaborate about the HTML setup for this `regular-table`.

```html
<regular-table></regular-table>
```

However, we'd like an Excel-like User Experience, so let's liven up the default theme with a trendy grid, which we can easily do purely via CSS, since these cells are always `<td>` elements.  We're also going to limit the cells to `22px` - they need to be big enough to click on, and as they start empty, they may end up quite narrow.

```css
td {
    outline: none;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    min-width: 22px;
}
```

We'll do the same for `row_headers` and `column_headers` to separate them from the editable cells.

```css
th {
    border-right: 1px solid #eee;
}
```

The special class `highlight` is used by the `highlight()` function to paint cells which will be returned by a cell or range query in an expression.

```css
.highlight {
    background-color: rgba(0,0,155, 0.1);
}
```

## Appendix (Dependencies)

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css">
```

```block
license: apache-2.0
```

