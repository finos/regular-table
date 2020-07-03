# Row Selection using the Mouse

This example adds row selection to a [`<regular-table>`](https://github.com/jpmorganchase/regular-table),
allowing the user to select rows via mouse clicks.

We'll need a `<regular-table>` with an `id` accessible on the window using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="rowMouseSelectionRegularTable"></regular-table>
```
## `addRowMouseSelection()`

Before we get started, lets think about the feature. We expect that when we `"click"`
on the row header then the row shows as selected.
In this example, the rows are grouped as well, and when the
group is selected then rows under the group should show as selected too.

We'll need to keep track of the selected row headers for later use.
```javascript
let MOUSE_SELECTED_ROW_HEADERS = [];
```
Sounds like the bulk of the logic belongs in a `"click"` `EventListener`, so our
`addRowMouseSelection()` should take a `table` and add a `clickListener()`. The `clickListener()` looks up the `event.target`'s `metadata` from `getMeta()` and either calls 

It will also be responsible for adding the `StyleListener` to ensure the selection shows correctly as the `table` scrolls.
```javascript
const addRowMouseSelection = (table) => {
    table.addEventListener("click", async (e) => {
        const meta = table.getMeta(e.target);
        if (meta) {
            if (!event.ctrlKey && !event.metaKey) {
                MOUSE_SELECTED_ROW_HEADERS = [];
            }
            if (typeof meta.row_header_x !== "undefined") {
                rowHeaderClickCallback(e, table, meta);
            }
            await table.draw();
        }
    });

    addRowSelectionStyleListener(table);
    return table;
};
```
## Styling

... desc

```css
regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: #ffffbb; /* yellow */
}
```

## `StyleListener`

... desc

```javascript

const MOUSE_SELECTED_ROW_CLASS = "mouse-selected-row";

const rowHeaderClickCallback = (event, table, meta) => {
    const newHeader = meta.row_header[meta.row_header_x];

    const isSelected = MOUSE_SELECTED_ROW_HEADERS.indexOf(newHeader) !== -1;
    if (event.ctrlKey || event.metaKey) {
        if (isSelected) {
            MOUSE_SELECTED_ROW_HEADERS = MOUSE_SELECTED_ROW_HEADERS.filter((h) => h !== newHeader);
        } else {
            MOUSE_SELECTED_ROW_HEADERS.push(newHeader);
        }
    } else {
        if (isSelected) {
            MOUSE_SELECTED_ROW_HEADERS = [];
        } else {
            MOUSE_SELECTED_ROW_HEADERS = [newHeader];
        }
    }
    table.draw();
};

const addRowSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
        const tds = table.querySelectorAll("tbody td");

        for (const td of tds) {
            const meta = table.getMeta(td);

            const rowSelected = meta.row_header.find((h) => MOUSE_SELECTED_ROW_HEADERS.indexOf(h) !== -1);
            if (rowSelected) {
                td.classList.add(MOUSE_SELECTED_ROW_CLASS);
            } else {
                td.classList.remove(MOUSE_SELECTED_ROW_CLASS);
            }
        }

        const rowThs = table.querySelectorAll("tbody th");

        for (const th of rowThs) {
            const meta = table.getMeta(th);

            const selected = MOUSE_SELECTED_ROW_HEADERS.find((h) => {
                const index = meta.row_header.indexOf(h);
                return index !== -1 && index <= meta.row_header_x;
            });
            if (selected) {
                th.classList.add(MOUSE_SELECTED_ROW_CLASS);
            } else {
                th.classList.remove(MOUSE_SELECTED_ROW_CLASS);
            }
        }
    });
};


```
... desc

```javascript
function init() {
    const table = window.rowMouseSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addRowMouseSelection(table).draw();
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
