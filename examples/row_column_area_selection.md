# Row, Column and Area Mouse Selection

We're going to create a composite example with all of our selection behaviors mixed in to one [`<regular-table>`](https://github.com/jpmorganchase/regular-table).

Lets make a `<regular-table>` with a way-to-specific `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).
```html
<regular-table id="allTheMouseSelectionRegularTable"></regular-table>
```
Our example has two primary responsibilities - adding the behaviors via the `addAreaMouseSelection()`, `addRowMouseSelection()`  and `addColumnMouseSelection()` functions and making the overlapping selections obvious with some `css`.
## Styling
Lets start by adding some `css` for all combinations of the selection classes -
`.mouse-selected-row`, `.mouse-selected-column` and `.mouse-selected-area`. Here
we've chosen light complementary colors so, for instance, our yellow row selection
and blue column selection intersect with a light green color.

Primary colors for no intersection.
```css
regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: rgb(255, 255, 0, 0.25); /* yellow */
}

regular-table tbody tr td.mouse-selected-column, regular-table tr th.mouse-selected-column {
    background-color: rgb(0, 0, 255, 0.15); /* blue */
}

regular-table tbody tr td.mouse-selected-area {
    background-color: rgb(255, 0, 0, 0.25); /* red */
}
```
Secondary colors for a single intersection.
```css
regular-table tbody tr td.mouse-selected-row.mouse-selected-column, regular-table tr th.mouse-selected-row.mouse-selected-column {
    background-color: rgb(50, 205, 50, 0.33); /* green */
}

regular-table tbody tr td.mouse-selected-area.mouse-selected-row {
    background-color: rgb(255, 165, 0, 0.33); /* orange */
}

regular-table tbody tr td.mouse-selected-area.mouse-selected-column {
    background-color: rgb(128, 0, 128, 0.33); /* violet */
}
```
...and a rusty brown color for all selection types intersecting.
```css
regular-table tbody tr td.mouse-selected-area.mouse-selected-column.mouse-selected-row {
    background-color: rgb(183, 65, 14, 0.33); /* rust */
}
```
Lets turn off the `user-select` style for this example too.
```css
regular-table tbody tr td {
    user-select: none;
}
```

## Adding the Behaviors
On `"load"`, we can add each of our behaviors from the `row_mouse_selection`, `column_mouse_selection` and `area_mouse_selection` examples. Let's add them here.

```html
<script src="/dist/examples/row_mouse_selection.js"></script>
<script src="/dist/examples/column_mouse_selection.js"></script>
<script src="/dist/examples/area_mouse_selection.js"></script>
```

We'll need to set our `table`'s `DataListener` and make the initial `draw()` call as well.
```javascript
window.addEventListener("load", () => {
    const table = window.allTheMouseSelectionRegularTable;
    if (table) {
        addAreaMouseSelection(table);
        addRowMouseSelection(table);
        addColumnMouseSelection(table);
        table.setDataListener(window.dataListener);
        table.draw();
    }
});
```

## Appendix (Dependencies)

Our Libraries.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

The `two_billion_rows` example for the its `DataListener`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
