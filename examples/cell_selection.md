# Cell Selection

... desc

Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="cellSelectionRegularTable"></regular-table>
```

## Styling

... desc

```css

regular-table tbody tr td {
    user-select: none;
}

regular-table tbody tr td.cell-selected {
    background-color: #ffbbbb; /* red */
}
```

## `StyleListener`

... desc

```javascript
let CELL_SELECTION_START = {};
let CELL_SELECTION_END = {};

const CELL_SELECTED_CLASS = "cell-selected";

const drawCellSelection = (table, cellSelectionEnd = CELL_SELECTION_END) => {
    const tds = table.querySelectorAll("tbody td");
    if (CELL_SELECTION_START.x !== undefined && CELL_SELECTION_START.y !== undefined && cellSelectionEnd.x !== undefined && cellSelectionEnd.y !== undefined) {
        const x0 = Math.min(CELL_SELECTION_START.x, cellSelectionEnd.x);
        const x1 = Math.max(CELL_SELECTION_START.x, cellSelectionEnd.x);
        const y0 = Math.min(CELL_SELECTION_START.y, cellSelectionEnd.y);
        const y1 = Math.max(CELL_SELECTION_START.y, cellSelectionEnd.y);

        for (const td of tds) {
            td.classList.remove(CELL_SELECTED_CLASS);
            const meta = table.getMeta(td);
            if (x0 <= meta.x && meta.x <= x1) {
                if (y0 <= meta.y && meta.y <= y1) {
                    td.classList.add(CELL_SELECTED_CLASS);
                }
            }
        }
    }
};

const addCellSelectionStyleListener = (table) => {
    table.addStyleListener(() => drawCellSelection(table));
};

const addCellSelection = (table) => {
    let isMouseDown = false;
    table.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        const meta = table.getMeta(e.target);
        if (meta.x !== undefined && meta.y !== undefined) {
            CELL_SELECTION_START = {x: meta.x, y: meta.y};
        }
    });

    table.addEventListener("mouseover", (e) => {
        if (isMouseDown) {
            const meta = table.getMeta(e.target);
            if (meta && meta.x !== undefined && meta.y !== undefined) {
                drawCellSelection(table, {x: meta.x, y: meta.y});
            }
        }
    });

    table.addEventListener("mouseup", (e) => {
        const meta = table.getMeta(e.target);
        if (meta.x !== undefined && meta.y !== undefined) {
            CELL_SELECTION_END = {x: meta.x, y: meta.y};
        }
        isMouseDown = false;
        table.draw();
    });

    addCellSelectionStyleListener(table);
    return table;
};

```
... desc

```javascript
function init() {
    const table = window.cellSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addCellSelection(table).draw();
    }
}

window.addEventListener("load", () => init());
```

## Appendix (Dependencies)

The usual suspects.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

Borrow a data model from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
