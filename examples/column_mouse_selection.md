# Column Selection using the Mouse

This example adds column selection to a [`<regular-table>`](https://github.com/jpmorganchase/regular-table),
allowing the user to select columns via mouse clicks.

**_Quick Note:_** The implementation of this behaviour is mostly symmetric to the
`row_mouse_selection` example. There's actually so much overlap we will reuse its
`getNewHeaderSelections()` function.
```html
<script src="/dist/examples/row_mouse_selection.js"></script>
```
Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="columnMouseSelectionRegularTable"></regular-table>
```
## `addColumnMouseSelection()`
Similar to `addRowMouseSelection()`, we expect that when we `"click"` on the column
header or the grouped column header - the columns shows as selected.

Lets track the selected columns like so..
```javascript
let MOUSE_SELECTED_COLUMN_HEADERS = [];
```
And add a `"click"` `EventListener` to the `table` passed to `addColumnMouseSelection()`.

We will also need to add a `StyleListener` to ensure the selection
shows correctly as the `table` re-renders.
```javascript
const addColumnMouseSelection = (table) => {
    const clickListener = (event) => {
        const meta = table.getMeta(event.target);
        if (!event.ctrlKey && !event.metaKey) {
            MOUSE_SELECTED_COLUMN_HEADERS = [];
        }

        const headerWasClicked = meta && typeof meta.column_header_y !== "undefined";
        if (headerWasClicked) {
            const newHeader = meta.column_header[meta.column_header_y];
            MOUSE_SELECTED_COLUMN_HEADERS = getNewHeaderSelections(MOUSE_SELECTED_COLUMN_HEADERS, newHeader, meta, event);
        }
        table.draw();
    };

    table.addEventListener("click", clickListener);
    addColumnSelectionStyleListener(table);
    return table;
};

```
Our internal `clickListener()` first checks to see if the event is a single selection
and if so, clears `MOUSE_SELECTED_COLUMN_HEADERS`.

Next it checks if the `headerWasClicked` before updating the `MOUSE_SELECTED_COLUMN_HEADERS`
with the new header selection from `getNewHeaderSelections()` from `row_mouse_selecion`.

Finally, we'll call `draw()` on the `table` ensuring
the new selection shows.

## Styling
Our `mouse-selected-column` will need some style to make it visually distinct.
```css
regular-table tbody tr td.mouse-selected-column, regular-table tr th.mouse-selected-column {
    background-color: #efefff; /* blue */
}
```
## `StyleListener`
We need to use a `StyleListener` to make our selection re-render correctly as the user, for example, scrolls it into and out of view.

Here we'll check each `td` and `th` in our `table` and update their `classList` by adding or removing our `MOUSE_SELECTED_COLUMN_CLASS`.
```javascript
const MOUSE_SELECTED_COLUMN_CLASS = "mouse-selected-column";

const addColumnSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
        reapplyColumnTDSelection(table);
        reapplyColumnTHSelection(table);
    });
};
```
Our `reapplyColumnTDSelection()` function is nearly the same implementation as
our `reapplyRowTDSelection()` - checking the `MetaData` of each `td` and adding or
removing the class if a `column_header` matches a `MOUSE_SELECTED_COLUMN_HEADERS`.

This could be refactored to DRY up the examples but the legibility of the examples suffer.
```javascript
const reapplyColumnTDSelection = (table) => {
    const elements = table.querySelectorAll("tbody td");

    for (const el of elements) {
        const meta = table.getMeta(el);

        const isSelected = meta.column_header.find((h) => MOUSE_SELECTED_COLUMN_HEADERS.indexOf(h) !== -1);
        if (isSelected) {
            el.classList.add(MOUSE_SELECTED_COLUMN_CLASS);
        } else {
            el.classList.remove(MOUSE_SELECTED_COLUMN_CLASS);
        }
    }
};

const reapplyColumnTHSelection = (table) => {
    const elements = table.querySelectorAll("thead th");

    for (const el of elements) {
        const meta = table.getMeta(el);

        if (typeof meta.column_header.find === "function") {
            const selected = MOUSE_SELECTED_COLUMN_HEADERS.find((h) => {
                const index = meta.column_header.indexOf(h);
                return index !== -1 && index <= meta.column_header_y;
            });
            if (selected) {
                el.classList.add(MOUSE_SELECTED_COLUMN_CLASS);
            } else {
                el.classList.remove(MOUSE_SELECTED_COLUMN_CLASS);
            }
        }
    }
};

```
Now to kick off our example on `"load"` by adding an `EvenListener` that will set
our `table`'s `DataListener` from `two_billion_rows`, `addColumnMouseSelection()`
and make an initial call to `draw()`.
```javascript
window.addEventListener("load", () => {
    const table = window.columnMouseSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addColumnMouseSelection(table).draw();
    }
});
```

## Appendix (Dependencies)

Of course we'll pull in our libraries.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

For this example lets borrow a data model from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
