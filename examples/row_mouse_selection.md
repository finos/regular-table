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
`addRowMouseSelection()` should take a `table` and add a `clickListener()`. 

It will also be responsible for adding the `StyleListener` to ensure the selection
shows correctly as the `table` scrolls.
```javascript
const addRowMouseSelection = (table) => {
    const clickListener = async (event) => {
        const meta = table.getMeta(event.target);
        if (!event.ctrlKey && !event.metaKey) {
            MOUSE_SELECTED_ROW_HEADERS = [];
        }
        const rowHeaderWasClicked = meta && typeof meta.row_header_x !== "undefined";
        if (rowHeaderWasClicked) {
            const newHeader = meta.row_header[meta.row_header_x];
            MOUSE_SELECTED_ROW_HEADERS = getNewHeaderSelections(MOUSE_SELECTED_ROW_HEADERS, newHeader, meta, event);
        }
        await table.draw();
    };

    table.addEventListener("click", clickListener);
    addRowSelectionStyleListener(table);
    return table;
};
```
Our internal `clickListener()` first checks to see if the event is a single selection
and if so, clears `MOUSE_SELECTED_ROW_HEADERS` before new selections are made.
Then it checks if the `rowHeaderWasClicked` before updating the `MOUSE_SELECTED_ROW_HEADERS`
with the new header selection. Finally, we'll call `draw()` on the `table` ensuring
the new selection shows.

There are a number of conditions to consider when we `getNewHeaderSelections()`.
If the `metaKey` or `ctrlKey` are pressed, we'll consider the interaction to be
`inMultiSelectMode`, and the new selection will be added or removed from the `currentSelection`
collection. Otherwise, we'll return a new `currentSelection` that replaces the entire
collection.

```javascript
const getNewHeaderSelections = (currentSelection, newHeader, meta, event) => {
    const inMultiSelectMode = event.ctrlKey || event.metaKey;
    const isSelected = currentSelection.indexOf(newHeader) !== -1;

    let newHeaderSelection = currentSelection;

    if (inMultiSelectMode) {
        if (isSelected) {
            newHeaderSelection = currentSelection.filter((h) => h !== newHeader);
        } else {
            newHeaderSelection.push(newHeader);
        }
    } else {
        if (isSelected) {
            newHeaderSelection = [];
        } else {
            newHeaderSelection = [newHeader];
        }
    }
    return newHeaderSelection;
};
```
## Styling
Lets style our `mouse-selected-row` - in this example we'll use a light yellow.
```css
regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: #ffffbb; /* yellow */
}
```

## `StyleListener`
As our `<regular-table>` is re-rendered, we will want to ensure that our selection
is styled correctly by reapplying our `MOUSE_SELECTED_ROW_CLASS` class to the correct
`td`s and `th`s.
```javascript
const MOUSE_SELECTED_ROW_CLASS = "mouse-selected-row";

const addRowSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
        reapplyRowTDSelection(table);
        reapplyRowTHSelection(table);
    });
};
```
In order to reapply row selection to our `td`s, we'll need to find all of them in
our `table` and iterate over the collection - adding or removing the `MOUSE_SELECTED_ROW_CLASS`
based on whether or not it `isSelected`. For each `td` we can determine if it `isSelected`
by looking at its metadata recovered from `getMeta()` and trying to `find()` the
`row_header` associated with it in the `MOUSE_SELECTED_ROW_HEADERS`. If the header
is present we will add the class.
```javascript
const reapplyRowTDSelection = (table) => {
    const elements = table.querySelectorAll("tbody td");

    for (const el of elements) {
        const meta = table.getMeta(el);

        const isSelected = meta.row_header.find((h) => MOUSE_SELECTED_ROW_HEADERS.indexOf(h) !== -1);
        if (isSelected) {
            el.classList.add(MOUSE_SELECTED_ROW_CLASS);
        } else {
            el.classList.remove(MOUSE_SELECTED_ROW_CLASS);
        }
    }
};
```
Similarly, we can reapply the selection class to our `th`s. The only real difference
in our approach is how we determine if the element `isSelected`.
```javascript
const reapplyRowTHSelection = (table) => {
    const elements = table.querySelectorAll("tbody th");
    for (const el of elements) {
        const meta = table.getMeta(el);

        if (isRowHeaderSelected(meta)) {
            el.classList.add(MOUSE_SELECTED_ROW_CLASS);
        } else {
            el.classList.remove(MOUSE_SELECTED_ROW_CLASS);
        }
    }
};
```
Our `MetaData` object contains a few helpful fields we can use to ensure that our
`th` shows as selected if it is directly selected or if it's group header is selected.

Our `meta`'s `row_header_x` tells us the index of this `th`'s header in the `Array`
of `row_header`s it belongs to. We can then compare the index of each selected
header in `row_header` and know if this column is selected _(the indexes are equal)_
or if its group is selected  _(`row_header_x` is less than the selected header's
index)_.
```javascript
const isRowHeaderSelected = (meta) =>
    MOUSE_SELECTED_ROW_HEADERS.find((h) => {
        const index = meta.row_header.indexOf(h);
        return index !== -1 && index <= meta.row_header_x;
    });
```
Now to kick off our example on `"load"` by adding an `EvenListener` that will set
our `table`'s `DataListener` (borrowed from the `two_billion_rows` example),
`addRowMouseSelection()` and make an initial call to `draw()`.
```javascript
window.addEventListener("load", () => {
    const table = window.rowMouseSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addRowMouseSelection(table).draw();
    }
});
```

## Appendix (Dependencies)

None of this would work without our libraries below.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

And we will borrow our data model from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
