# Row, Column and Cell Selection

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

regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: rgb(255, 255, 0, 0.25); /* yellow */
}

regular-table tbody tr td.mouse-selected-column, regular-table tr th.mouse-selected-column {
    background-color: rgb(0, 0, 255, 0.15); /* blue */
}

regular-table tbody tr td.cell-selected {
    background-color: rgb(255, 0, 0, 0.25); /* red */
}

regular-table tbody tr td.mouse-selected-row.mouse-selected-column, regular-table tr th.mouse-selected-row.mouse-selected-column {
    background-color: rgb(50, 205, 50, 0.33); /* green */
}

regular-table tbody tr td.cell-selected.mouse-selected-row {
    background-color: rgb(255, 165, 0, 0.33); /* orange */
}

regular-table tbody tr td.cell-selected.mouse-selected-column {
    background-color: rgb(128, 0, 128, 0.33); /* violet */
}

regular-table tbody tr td.cell-selected.mouse-selected-column.mouse-selected-row {
    background-color: rgb(183, 65, 14, 0.33); /* rust */
}
```

## `StyleListener`

... desc

```javascript
window.addEventListener("load", () => {
    const table = window.selectionCopyPasteRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addCellSelection(table);
        addRowMouseSelection(table);
        addColumnMouseSelection(table);
        table.draw();
    }
});
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
<script src="/dist/examples/row_mouse_selection.js"></script>
<script src="/dist/examples/column_mouse_selection.js"></script>
<script src="/dist/examples/cell_selection.js"></script>
```
