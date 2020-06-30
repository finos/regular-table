# Row and Column Selection

... desc

Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="rowAndColumnSelectionRegularTable"></regular-table>
```

## Styling

... desc

```css
regular-table tbody tr td.row-selected, regular-table tr th.row-selected {
    background-color: #ffffbb; /* yellow */
}

regular-table tbody tr td.column-selected, regular-table tr th.column-selected {
    background-color: #efefff; /* blue */
}

regular-table tbody tr td.row-selected.column-selected, regular-table tr th.row-selected.column-selected {
    background-color: #bbffbb; /* green */
}
```

## `StyleListener`

... desc

```javascript
let SELECTED_ROW_HEADERS = [];
let SELECTED_COLUMN_HEADERS = [];

const ROW_SELECTED_CLASS = "row-selected";
const COLUMN_SELECTED_CLASS = "column-selected";

const columnHeaderClickCallback = (event, table, meta) => {
    const newHeader = meta.column_header[meta.column_header_y];

    const isSelected = SELECTED_COLUMN_HEADERS.indexOf(newHeader) !== -1;
    if (event.ctrlKey || event.metaKey) {
        if (isSelected) {
            SELECTED_COLUMN_HEADERS = SELECTED_COLUMN_HEADERS.filter((h) => h !== newHeader);
        } else {
            SELECTED_COLUMN_HEADERS.push(newHeader);
        }
    } else {
        if (isSelected) {
            SELECTED_COLUMN_HEADERS = [];
        } else {
            SELECTED_COLUMN_HEADERS = [newHeader];
        }
    }
    table.draw();
};

const rowHeaderClickCallback = (event, table, meta) => {
    const newHeader = meta.row_header[meta.row_header_x];

    const isSelected = SELECTED_ROW_HEADERS.indexOf(newHeader) !== -1;
    if (event.ctrlKey || event.metaKey) {
        if (isSelected) {
            SELECTED_ROW_HEADERS = SELECTED_ROW_HEADERS.filter((h) => h !== newHeader);
        } else {
            SELECTED_ROW_HEADERS.push(newHeader);
        }
    } else {
        if (isSelected) {
            SELECTED_ROW_HEADERS = [];
        } else {
            SELECTED_ROW_HEADERS = [newHeader];
        }
    }
    table.draw();
};

const addSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);

            const rowSelected = meta.row_header.find((h) => SELECTED_ROW_HEADERS.indexOf(h) !== -1);
            if (rowSelected) {
                td.classList.add(ROW_SELECTED_CLASS);
            } else {
                td.classList.remove(ROW_SELECTED_CLASS);
            }

            const columnSelected = meta.column_header.find((h) => SELECTED_COLUMN_HEADERS.indexOf(h) !== -1);
            if (columnSelected) {
                td.classList.add(COLUMN_SELECTED_CLASS);
            } else {
                td.classList.remove(COLUMN_SELECTED_CLASS);
            }
        }

        const rowThs = table.querySelectorAll("tbody th");

        for (const th of rowThs) {
            const meta = table.getMeta(th);

            const selected = SELECTED_ROW_HEADERS.find((h) => {
                const index = meta.row_header.indexOf(h);
                return index !== -1 && index <= meta.row_header_x;
            });
            if (selected) {
                th.classList.add(ROW_SELECTED_CLASS);
            } else {
                th.classList.remove(ROW_SELECTED_CLASS);
            }
        }
        const columnThs = table.querySelectorAll("thead th");

        for (const th of columnThs) {
            const meta = table.getMeta(th);

            if (typeof meta.column_header.find === "function") {
                const selected = SELECTED_COLUMN_HEADERS.find((h) => {
                    const index = meta.column_header.indexOf(h);
                    return index !== -1 && index <= meta.column_header_y;
                });
                if (selected) {
                    th.classList.add(COLUMN_SELECTED_CLASS);
                } else {
                    th.classList.remove(COLUMN_SELECTED_CLASS);
                }
            }
        }
    });
};

const addRowAndColumnSelection = (table) => {
    table.addEventListener("click", (e) => {
        const meta = table.getMeta(e.target);

        if (meta) {
            if (!event.ctrlKey && !event.metaKey) {
                SELECTED_ROW_HEADERS = [];
                SELECTED_COLUMN_HEADERS = [];
            }
            if (typeof meta.column_header_y !== "undefined") {
                columnHeaderClickCallback(e, table, meta);
            } else if (typeof meta.row_header_x !== "undefined") {
                rowHeaderClickCallback(e, table, meta);
            } else {
                table.draw();
            }
        }
    });

    addSelectionStyleListener(table);
    return table;
};

```
... desc

```javascript
function init() {
    const table = window.rowAndColumnSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addRowAndColumnSelection(table).draw();
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
