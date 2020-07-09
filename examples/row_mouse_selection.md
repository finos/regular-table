# Row Selection using the Mouse

This example adds row selection to a [`<regular-table>`](https://github.com/jpmorganchase/regular-table),
allowing the user to select rows via mouse clicks.

**_Quick Note:_** The implementation of this behavior is mostly symmetric to the `column_mouse_selection` example.

We'll need a `<regular-table>` with an `id` accessible on the window using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="rowMouseSelectionRegularTable"></regular-table>
```
## `addRowMouseSelection()`
Before we get started, lets think about the feature. We expect that when we `"click"`
on the row header then the row shows as selected.
In this example, the rows are grouped as well, and when the
group is selected then rows under the group should show as selected too.

We'll also allow the user to make multiple selections when holding down the `ctrl` or `metaKey`.

Sounds like the bulk of the logic belongs in a `"click"` `EventListener`, so our
`addRowMouseSelection()` should take a `table` and add a `clickListener()`. 

It will also be responsible for adding the `StyleListener` to ensure the selection
shows correctly as the `table` scrolls.
```javascript
const addRowMouseSelection = (table, dl) => {
    const clickListener = (event) => {
        const meta = table.getMeta(event.target);
        const headerWasClicked = meta && typeof meta.row_header_x !== "undefined" && meta.row_header;
        if (headerWasClicked) {
            MOUSE_SELECTED_ROW_HEADERS = newRowHeaderSelections(MOUSE_SELECTED_ROW_HEADERS, meta, event, dl);
        } else if (!event.ctrlKey && !event.metaKey) {
            MOUSE_SELECTED_ROW_HEADERS = [];
        }
        table.draw();
    };

    table.addEventListener("click", clickListener);
    addRowSelectionStyleListener(table, dl);
    return table;
};
```
Our internal `clickListener()` will need to keep track of the information that
describes our row selection. The properties we're interested in will overlap
a bit with the `MetaData` `object` and we'll refer to an `object` with the below
properties as a `RowSelection`.
| Name | Type | Description |
| --- | --- | --- |
| [y0] | `number` | The `y` index that begins the selection. |
| [y1] | `number` | The `y` index that ends the selection. |
| [row_header_y] | `number` | The `y` of this header's `row_header`.|
| [row_header] | <code>Array.&lt;object&gt;</code> | The `Array` of headers associated with this selection. |
| [dy] | `number` | The `y` index in `DataResponse.data`, this property is only generated for `<td>`, `<th>` from `row_headers`. |

We'll add them to a collection, say `MOUSE_SELECTED_ROW_HEADERS`.
```javascript
let MOUSE_SELECTED_ROW_HEADERS = [];
```
In our `clickListener()`, we'll check if the `headerWasClicked` and if so, we can update the `MOUSE_SELECTED_ROW_HEADERS` with the `newRowHeaderSelections()`.

If the `ctrlKey` and `metaKey` aren't pressed then our user isn't multi-selecting,
and we should clear the prior selections.

Finally, we'll call `draw()` on the `table` ensuring the new selection shows.

### When creating `newRowHeaderSelections()`
If the `metaKey` or `ctrlKey` are pressed, we'll consider the interaction to be
`inMultiSelectMode` and add or remove selections - otherwise, we'll return a new
selection that replaces the entire collection. 

We'll define our helper function, `targetRowSelection()`, later .. with the help of our
`DataListener`, it take a `MetaData` `object` and generates a `RowSelection`.
```javascript
const newRowHeaderSelections = (currentSelections, meta, event, dl) => {
    const inMultiSelectMode = event.ctrlKey || event.metaKey;
    const targetSelection = targetRowSelection(meta, dl);

    if (inMultiSelectMode) {
        return newMultiSelectRowHeaders(targetSelection, dl, currentSelections);
    } else {
        return newSingleSelectRowHeaders(targetSelection, dl, currentSelections);
    }
};
```
In `newSingleSelectRowHeaders()`, we'll need to define three different behaviors -
single selection, deselection and range selection.

Most spreadsheets will allow the end user to select a range of rows, so we'll
consider selections made with the `shiftKey` a range selection.
Without the `shiftKey`, we'll `return` the single row selection or deselect it if
a matching selection already exists by returning empty.

Don't worry, we'll walk through the implementation of the helper functions shortly.
```javascript
const newSingleSelectRowHeaders = (targetSelection, dl, currentSelections) => {
    const matches = matchingRowSelections(currentSelections, targetSelection);

    if (matches.length > 0) {
        return [];
    } else {
        if (event.shiftKey) {
            return [createRowRangeSelection(currentSelections, targetSelection, dl)];
        } else {
            return [targetSelection];
        }
    }
};
```
Our multi-select implementation is slightly more complicated when we find a match.
If the user clicks on an already selected row header `inMultiSelectMode` we want
to simply remove the selection, but if the selection is a range, we'll need to split
the range into two row selections, removing the `targetSelection`.
```javascript
const newMultiSelectRowHeaders = (targetSelection, dl, currentSelections) => {
    const matches = matchingRowSelections(currentSelections, targetSelection);

    if (matches.length > 0) {
        let newSelection = rejectMatchingRowSelections(currentSelections, targetSelection);
        return splitRangeMatches(newSelection, targetSelection);
    } else {
        if (event.shiftKey) {
            return currentSelections.concat(createRowRangeSelection(currentSelections, targetSelection, dl));
        } else {
            return currentSelections.concat(targetSelection);
        }
    }
};
```
...
```javascript
const lastIndexOfRowGroup = (dl, {row_header_x, value, y}) => {
    const {num_rows} = dl(0, 0, 1, 1);
    let idx;
    const chunk = 100;
    let y0 = y;
    let y1 = Math.min(y + chunk, num_rows);
    do {
        const rowHeaderSlice = dl(0, y0, 0, y1).row_headers.map((h, idx) => [y + idx, h]);
        const result = rowHeaderSlice.find(([_, row_headers]) => row_headers[row_header_x] !== value);
        if (result) {
            [idx] = result;
        } else {
            y0 = Math.min(y0 + chunk, num_rows);
            y1 = Math.min(y1 + chunk, num_rows);
        }
    } while (idx === undefined && y1 < num_rows);
    return idx === undefined ? num_rows : idx - 1;
};

const targetRowSelection = (meta, dl) => {
    const target = {...meta};
    target.y0 = meta.y;

    const isRowGroup = meta.row_header_x !== meta.row_header.length - 1;
    if (isRowGroup) {
        target.y1 = lastIndexOfRowGroup(dl, meta);
    } else {
        target.y1 = meta.y;
    }

    return target;
};

const createRowRangeSelection = (currentSelections, newHeader, dl) => {
    const lastSelection = currentSelections[currentSelections.length - 1];
    if (lastSelection) {
        const y0 = Math.min(newHeader.y0, lastSelection.y0, newHeader.y1, lastSelection.y1);
        const y1 = Math.max(newHeader.y0, lastSelection.y0, newHeader.y1, lastSelection.y1);
        const row_header_x = Math.min(newHeader.row_header_x, lastSelection.row_header_x);
        newHeader.y0 = y0;
        newHeader.y1 = y1;
    }
    return newHeader;
};

const splitRangeMatches = (selections, newHeader) => {
    return selections.flatMap((s) => {
        const row_header_x = Math.max(newHeader.row_header_x, s.row_header_x);
        const matchesRangeSelection = s.y0 <= newHeader.y0 && newHeader.y1 <= s.y1 && s.y0 !== s.y1;
        if (matchesRangeSelection) {
            const firstSplit = {row_header_x, y0: s.y0, y1: newHeader.y0 - 1, row_header: s.row_header};
            const secondSplit = {row_header_x, y0: newHeader.y1 + 1, y1: s.y1, row_header: s.row_header};
            return [firstSplit, secondSplit].filter((s) => s.y0 <= s.y1);
        } else {
            return s;
        }
    });
};

const matchingRowSelections = (selections, {y, y0, y1}) => {
    const _y = y ? y : Math.min(y0, y1);
    return selections.filter((s) => s.y0 <= _y && _y <= s.y1);
};

const rejectMatchingRowSelections = (selections, {y, y0, y1}) => {
    const _y = y ? y : Math.min(y0, y1);
    return selections.filter(({y0, y1}) => !(y0 == _y && _y == y1));
};

```
## Styling
Lets style our `mouse-selected-row` - in this example we'll use a light yellow.
```css
regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: #ffffbb; /* yellow */
}

regular-table tbody tr th, regular-table tbody tr td {
    user-select: none;
}
```

## `StyleListener`
As our `<regular-table>` is re-rendered, we will want to ensure that our selection
is styled correctly by reapplying our `MOUSE_SELECTED_ROW_CLASS` class to the correct
`td`s and `th`s.
```javascript
const MOUSE_SELECTED_ROW_CLASS = "mouse-selected-row";

const addRowSelectionStyleListener = (table, dl) => {
    table.addStyleListener(() => {
        const ys = reapplyRowTHSelection(table, dl);
        reapplyRowTDSelection(table, ys);
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
const reapplyRowTDSelection = (table, ys) => {
    const elements = table.querySelectorAll("tbody td");

    for (const el of elements) {
        const meta = table.getMeta(el);

        if (ys.indexOf(meta.y) !== -1) {
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
const reapplyRowTHSelection = (table, dl) => {
    const elements = table.querySelectorAll("tbody th");
    let selectedYs = [];

    if (elements.length > 0) {
        const meta0 = table.getMeta(elements[0]);
        const visibleRowHeaders = dl(0, meta0.y0, 0, meta0.y1 + 1).row_headers.map((h, idx) => [meta0.y0 + idx, h]);
        for (const el of elements) {
            const meta = table.getMeta(el);

            if (isRowHeaderSelected(meta, visibleRowHeaders)) {
                selectedYs.push(meta.y);
                el.classList.add(MOUSE_SELECTED_ROW_CLASS);
            } else {
                el.classList.remove(MOUSE_SELECTED_ROW_CLASS);
            }
        }
    }
    return selectedYs;
};
```
Our `MetaData` object contains a few helpful fields we can use to ensure that our
`th` shows as selected if it is directly selected or if it's group header is selected.

Our `meta`'s `row_header_x` tells us the index of this `th`'s header in the `Array`
of `row_header`s it belongs to. We can then compare the index of each selected
header in `row_header` and know if this column is selected _(the indexes are equal)_
or if its group is selected  _(`row_header_x` is greater than the selected header's
index)_.
```javascript
function generateDataListener(num_rows, num_columns) {
    return function dl(x0, y0, x1, y1) {
        return {
            num_rows,
            num_columns,
            row_headers: range(y0, y1, group_header.bind(null, "Row")),
            column_headers: range(x0, x1, group_header.bind(null, "Column")),
            data: range(x0, x1, (x) => range(y0, y1, (y) => formatter.format(x + y))),
        };
    };
}

const isRowHeaderSelected = (meta, visibleRowHeaders) => {
    const matches = matchingRowSelections(MOUSE_SELECTED_ROW_HEADERS, meta);
    const isGroupMatch = () => {
        return MOUSE_SELECTED_ROW_HEADERS.find((m) => {
            const matchingGroupValues = visibleRowHeaders.filter(([idx]) => m.y0 <= idx && idx <= m.y1).map(([_, row_headers]) => row_headers[m.row_header_x]);
            const matchingGroupIndexes = visibleRowHeaders.filter(([idx, row_headers]) => matchingGroupValues.indexOf(row_headers[m.row_header_x]) !== -1).map(([idx]) => idx);
            return m.row_header_x < meta.row_header_x && matchingGroupIndexes.indexOf(meta.y) !== -1;
        });
    };
    const isDirectMatch = () => !!matches.find((m) => m.row_header_x == meta.row_header_x);
    return isDirectMatch() || isGroupMatch();
};

```
Now to kick off our example on `"load"` by adding an `EvenListener` that will set
our `table`'s `DataListener` (borrowed from the `two_billion_rows` example),
`addRowMouseSelection()` and make an initial call to `draw()`.
```javascript
window.addEventListener("load", () => {
    const table = window.rowMouseSelectionRegularTable;
    if (table) {
        const dl = generateDataListener(200, 50);
        table.setDataListener(dl);
        addRowMouseSelection(table, dl).draw();
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
