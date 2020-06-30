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
let CELL_SELECTIONS = [];

const CELL_SELECTED_CLASS = "cell-selected";

const drawCellSelection = (table, downCoord, upCoord) => {
    const tds = table.querySelectorAll("tbody td");
    if (downCoord.x !== undefined && downCoord.y !== undefined && upCoord.x !== undefined && upCoord.y !== undefined) {
        const x0 = Math.min(downCoord.x, upCoord.x);
        const x1 = Math.max(downCoord.x, upCoord.x);
        const y0 = Math.min(downCoord.y, upCoord.y);
        const y1 = Math.max(downCoord.y, upCoord.y);

        for (const td of tds) {
            const meta = table.getMeta(td);
            if (x0 <= meta.x && meta.x <= x1) {
                if (y0 <= meta.y && meta.y <= y1) {
                    td.classList.add(CELL_SELECTED_CLASS);
                }
            }
        }
    }
};

const redrawCellSelections = (table, cellSelections = CELL_SELECTIONS) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        td.classList.remove(CELL_SELECTED_CLASS);
    }

    for (const cs of cellSelections) {
        drawCellSelection(table, cs[0], cs[1]);
    }
};

const addCellSelectionStyleListener = (table) => {
    table.addStyleListener(() => redrawCellSelections(table));
};

const addCellSelection = (table) => {
    let downCoord = {};

    table.addEventListener("mousedown", (event) => {
        downCoord = {};
        if (!event.ctrlKey && !event.metaKey) {
            CELL_SELECTIONS = [];
        }
        const meta = table.getMeta(event.target);
        if (meta.x !== undefined && meta.y !== undefined) {
            downCoord = {x: meta.x, y: meta.y};
        }
    });

    table.addEventListener("mouseover", (event) => {
        if (downCoord.x !== undefined) {
            const meta = table.getMeta(event.target);
            if (meta && meta.x !== undefined && meta.y !== undefined) {
                redrawCellSelections(table, CELL_SELECTIONS.concat([[downCoord, {x: meta.x, y: meta.y}]]));
            }
        }
    });

    table.addEventListener("mouseup", (event) => {
        const meta = table.getMeta(event.target);
        if (downCoord.x !== undefined && meta.x !== undefined && meta.y !== undefined) {
            const upCoord = {x: meta.x, y: meta.y};
            CELL_SELECTIONS.push([downCoord, upCoord]);
            redrawCellSelections(table);
        }
        downCoord = {};
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
