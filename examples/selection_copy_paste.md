# Cell Selection

... desc

Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="selectionCopyPasteRegularTable"></regular-table>
```

## Styling

... desc

```css

regular-table tbody tr td {
    user-select: none;
}

regular-table tbody tr td.row-selected, regular-table tr th.row-selected {
    background-color: rgb(255, 255, 0, 0.25); /* yellow */
}

regular-table tbody tr td.column-selected, regular-table tr th.column-selected {
    background-color: rgb(0, 0, 255, 0.15); /* blue */
}

regular-table tbody tr td.cell-selected {
    background-color: rgb(255, 0, 0, 0.25); /* red */
}

regular-table tbody tr td.row-selected.column-selected, regular-table tr th.row-selected.column-selected {
    background-color: rgb(50, 205, 50, 0.33); /* green */
}

regular-table tbody tr td.cell-selected.row-selected {
    background-color: rgb(255, 165, 0, 0.33); /* orange */
}

regular-table tbody tr td.cell-selected.column-selected {
    background-color: rgb(128, 0, 128, 0.33); /* violet */
}

regular-table tbody tr td.cell-selected.column-selected.row-selected {
    background-color: rgb(183, 65, 14, 0.33); /* rust */
}
```

## `StyleListener`

... desc

```javascript
function init() {
    const table = window.selectionCopyPasteRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addCellSelection(table);
        addRowAndColumnSelection(table);
        table.draw();
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
<script src="/dist/examples/row_and_column_selection.js"></script>
<script src="/dist/examples/cell_selection.js"></script>
```
