# Column Selection using the Mouse

... desc

Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="columnMouseSelectionRegularTable"></regular-table>
```

## Styling

... desc

```css
regular-table tbody tr td.mouse-selected-column, regular-table tr th.mouse-selected-column {
    background-color: #efefff; /* blue */
}
```
## `addColumnMouseSelection()`
... desc
```javascript
let MOUSE_SELECTED_COLUMN_HEADERS = [];
```
... desc
```javascript
const addColumnMouseSelection = (table) => {
    table.addEventListener("click", (e) => {
        const meta = table.getMeta(e.target);

        if (meta) {
            if (!event.ctrlKey && !event.metaKey) {
                MOUSE_SELECTED_COLUMN_HEADERS = [];
            }
            if (typeof meta.column_header_y !== "undefined") {
                columnHeaderClickCallback(e, table, meta);
            } else {
                table.draw();
            }
        }
    });

    addColumnSelectionStyleListener(table);
    return table;
};

```
## `StyleListener`

... desc

```javascript
const MOUSE_SELECTED_COLUMN_CLASS = "mouse-selected-column";

const columnHeaderClickCallback = (event, table, meta) => {
    const newHeader = meta.column_header[meta.column_header_y];

    const isSelected = MOUSE_SELECTED_COLUMN_HEADERS.indexOf(newHeader) !== -1;
    if (event.ctrlKey || event.metaKey) {
        if (isSelected) {
            MOUSE_SELECTED_COLUMN_HEADERS = MOUSE_SELECTED_COLUMN_HEADERS.filter((h) => h !== newHeader);
        } else {
            MOUSE_SELECTED_COLUMN_HEADERS.push(newHeader);
        }
    } else {
        if (isSelected) {
            MOUSE_SELECTED_COLUMN_HEADERS = [];
        } else {
            MOUSE_SELECTED_COLUMN_HEADERS = [newHeader];
        }
    }
    table.draw();
};

const addColumnSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);

            const columnSelected = meta.column_header.find((h) => MOUSE_SELECTED_COLUMN_HEADERS.indexOf(h) !== -1);
            if (columnSelected) {
                td.classList.add(MOUSE_SELECTED_COLUMN_CLASS);
            } else {
                td.classList.remove(MOUSE_SELECTED_COLUMN_CLASS);
            }
        }

        const columnThs = table.querySelectorAll("thead th");

        for (const th of columnThs) {
            const meta = table.getMeta(th);

            if (typeof meta.column_header.find === "function") {
                const selected = MOUSE_SELECTED_COLUMN_HEADERS.find((h) => {
                    const index = meta.column_header.indexOf(h);
                    return index !== -1 && index <= meta.column_header_y;
                });
                if (selected) {
                    th.classList.add(MOUSE_SELECTED_COLUMN_CLASS);
                } else {
                    th.classList.remove(MOUSE_SELECTED_COLUMN_CLASS);
                }
            }
        }
    });
};

```
... desc

```javascript
function init() {
    const table = window.columnMouseSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addColumnMouseSelection(table).draw();
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
