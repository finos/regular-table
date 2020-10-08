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
on the row or row header then the row shows as selected.
In this example, the rows are grouped as well, and when the
group is selected then rows under the group should show as selected too.

We'll also allow the user to make multiple selections when holding down the `ctrl` or `metaKey`.

Sounds like the bulk of the logic belongs in a `"click"` `EventListener`, so our
`addRowMouseSelection()` should take a `table` and add a `clickListener()`. 

It will also be responsible for adding the `StyleListener` to ensure the selection
shows correctly as the `table` scrolls.
```javascript
const addRowMouseSelection = (table, dl, cellSelectionEnabled = true) => {
    const clickListener = (event) => {
        const meta = table.getMeta(event.target);
        const headerWasClicked = meta && typeof meta.row_header_x !== "undefined" && meta.row_header;
        const cellWasClicked = meta && typeof meta.y !== "undefined" && !meta.column_header_y;

        if (headerWasClicked) {
            MOUSE_SELECTED_ROWS = newRowSelections(meta, event, dl);
        } else if (cellWasClicked && cellSelectionEnabled) {
            MOUSE_SELECTED_ROWS = newRowSelections(meta, event, dl);
        } else if (!event.ctrlKey && !event.metaKey) {
            MOUSE_SELECTED_ROWS = [];
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
a bit with the `MetaData` `object`, and we'll refer to an `object` with the below
properties as a `RowSelection`.
| Name | Type | Description |
| --- | --- | --- |
| [y0] | `number` | The `y` index that begins the selection. |
| [y1] | `number` | The `y` index that ends the selection. |
| [row_header_x] | `number` | The `y` of this header's `row_header`.|
| [row_header] | <code>Array.&lt;object&gt;</code> | The `Array` of headers associated with this selection. |

We'll add them to a collection, say `MOUSE_SELECTED_ROWS`.
```javascript
let MOUSE_SELECTED_ROWS = [];
```
In our `clickListener()`, we'll check if the `headerWasClicked` and if so, we can
update the `MOUSE_SELECTED_ROWS` with the `newRowSelections()`.

If the `ctrlKey` and `metaKey` aren't pressed then our user isn't multi-selecting,
and we should clear the prior selections.

Finally, we'll call `draw()` on the `table` ensuring the new selection shows.

### When creating `newRowSelections()`
If the `metaKey` or `ctrlKey` are pressed, we'll consider the interaction to be
`inMultiSelectMode` and add or remove selections - otherwise, we'll return a new
selection that replaces the entire collection. 

We've also defined a helper function, `targetRowSelection()`, .. with the help of our
`DataListener`, it takes a `MetaData` `object` and generates a `RowSelection` updating
the `y0` to the `meta.y` and the `y1` to the `lastIndexOfRowGroup()` if this selection
represents a group of rows - effectively making it a range selection. We'll save the
implementation of `lastIndexOfRowGroup()` for later.
```javascript
const newRowSelections = (meta, event, dl) => {
    const inMultiSelectMode = event.ctrlKey || event.metaKey;
    const targetSelection = targetRowSelection(meta, dl);

    if (inMultiSelectMode) {
        return newMultiSelectRow(targetSelection, dl);
    } else {
        return newSingleSelectRow(targetSelection, dl);
    }
};

const targetRowSelection = (meta, dl) => {
    const target = {...meta};
    target.y0 = meta.y;

    const isRowGroup = typeof meta.row_header_x !== "undefined" && meta.row_header_x !== meta.row_header.length - 1;
    if (isRowGroup) {
        target.y1 = lastIndexOfRowGroup(dl, meta);
    } else {
        target.y1 = meta.y;
    }

    return target;
};
```
In `newSingleSelectRow()`, we'll need to define three different behaviors -
single selection, deselection and range selection.

Most spreadsheets will allow the end user to select a range of rows, so we'll
consider selections made with the `shiftKey` a range selection.
Without the `shiftKey`, we'll `return` the single row selection or deselect it if
a matching selection already exists by returning empty.
```javascript
const newSingleSelectRow = (targetSelection, dl) => {
    const matches = matchingRowSelections(targetSelection);

    if (matches.length > 0) {
        return [];
    } else {
        if (event.shiftKey) {
            return [createRowRangeSelection(targetSelection, dl)];
        } else {
            return [targetSelection];
        }
    }
};
```
We'll need a couple helper functions, one that returns the `matchingRowSelections()`
by iterating throught the `MOUSE_SELECTED_ROWS` and returning all `RowSelection`s
who's rows intersect...
```javascript
const matchingRowSelections = ({y, y0, y1}) => {
    const _y = y !== undefined ? y : Math.min(y0, y1);
    return MOUSE_SELECTED_ROWS.filter((s) => s.y0 <= _y && _y <= s.y1);
};
```
... and a way to create a `RowSelection` that represents a range selection by
looking at the `lastSelection` in `MOUSE_SELECTED_ROWS`.

If there is a `lastSelection`, we'll update the given `rowSelection` with the
`min()` `y0` and `max` `y1` to ensure the correct range selecting top to bottom
as well as bottom to top. 

`createRowRangeSelection()` will also ensure that the resulting `RowSelection`
represents a range over a uniform level of selections. If one of the selections
is a Group and the other is a Row we should select the appropriate `row_header_x`.
```javascript
const createRowRangeSelection = (rowSelection, dl) => {
    const lastSelection = MOUSE_SELECTED_ROWS[MOUSE_SELECTED_ROWS.length - 1];
    if (lastSelection) {
        const y0 = Math.min(rowSelection.y0, lastSelection.y0, rowSelection.y1, lastSelection.y1);
        const y1 = Math.max(rowSelection.y0, lastSelection.y0, rowSelection.y1, lastSelection.y1);
        const row_header_x = Math.min(rowSelection.row_header_x, lastSelection.row_header_x);
        rowSelection.y0 = y0;
        rowSelection.y1 = y1;
    }
    return rowSelection;
};
```
Our multi-select implementation is slightly more complicated when we find a match.
If the user clicks on an already selected row header `inMultiSelectMode` we want
to simply remove the selection, but if the selection is a range, we'll need to split
the range into two row selections, removing the `targetSelection`.
```javascript
const newMultiSelectRow = (targetSelection, dl) => {
    const matches = matchingRowSelections(targetSelection);

    if (matches.length > 0) {
        let newSelections = rejectMatchingRowSelections(targetSelection);
        return splitRowRangeMatches(newSelections, targetSelection);
    } else {
        if (event.shiftKey) {
            return MOUSE_SELECTED_ROWS.concat(createRowRangeSelection(targetSelection, dl));
        } else {
            return MOUSE_SELECTED_ROWS.concat(targetSelection);
        }
    }
};
```
We can write a complement to our `matchingRowSelections()` that returns all the
`RowSelection`s that don't match the input's row.
```javascript
const rejectMatchingRowSelections = ({y, y0, y1}) => {
    const _y = y ? y : Math.min(y0, y1);
    return MOUSE_SELECTED_ROWS.filter(({y0, y1}) => !(y0 == _y && _y == y1));
};
```
And we'll need a way to split all the matching range `RowSelection`s. This one's
a bit dense, but let's walk through it. 

We iterate through the `selections` and find matches based on the overlap of `y0`s and
`y1`s similar to our `matchingRowSelections()` helper. If it's a matching range
(ie. the `y0` and `y1` aren't equal) then we return potentially two `RowSelections` -
the part of the range up to the `rowSelection` passed in and the part after.

Our use of `flatMap()` ensures that the result is a one-dimensional `Array` of
`RowSelections`.
```javascript
const splitRowRangeMatches = (selections, rowSelection) => {
    return selections.flatMap((s) => {
        const row_header_x = Math.max(rowSelection.row_header_x, s.row_header_x);
        const matchesRangeSelection = s.y0 <= rowSelection.y0 && rowSelection.y1 <= s.y1 && s.y0 !== s.y1;

        if (matchesRangeSelection) {
            const firstSplit = {row_header_x, y0: s.y0, y1: rowSelection.y0 - 1, row_header: s.row_header};
            const secondSplit = {row_header_x, y0: rowSelection.y1 + 1, y1: s.y1, row_header: s.row_header};
            return [firstSplit, secondSplit].filter((s) => s.y0 <= s.y1);
        } else {
            return s;
        }
    });
};
```
### `lastIndexOfRowGroup()`
We need a way to scan the `row_headers` present in the `DataListener` and find the
end, _`y`_, of the group if a group of rows is selected.

We've chosen to chunk our scan preventing a crash in the event that the `DataModel` represents
`two_billion_rows`.
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
```
## Styling
Let's style our `mouse-selected-row` - in this example we'll use a light yellow.
```css
regular-table tbody tr td.mouse-selected-row, regular-table tr th.mouse-selected-row {
    background-color: #ffffbb; /* yellow */
}
```
And we can disable the default `user-select`.
```css
regular-table tbody tr th, regular-table tbody tr td {
    user-select: none;
}
```

## `StyleListener`
As our `<regular-table>` is re-rendered, we will want to ensure that our selection
is styled correctly by reapplying our `MOUSE_SELECTED_ROW_CLASS` class to the correct
`td`s and `th`s.

First we'll `reapplyRowTHSelection()` and have that `return` the selected `y`s, then
we'll use the `y`s to `reapplyRowTDSelection()`.
```javascript
const MOUSE_SELECTED_ROW_CLASS = "mouse-selected-row";

const addRowSelectionStyleListener = (table, dl) => {
    table.addStyleListener(() => {
        const ys = reapplyRowTHSelection(table, dl);

        if (ys.length > 0) {
            reapplyRowTDSelection(table, ys);
        } else {
            reapplyRowSelection(table, dl);
        }
    });
};

const reapplyRowSelection = (table, dl) => {
    const elements = table.querySelectorAll("tbody td");

    if (elements.length > 0) {
        for (const el of elements) {
            const meta = table.getMeta(el);
            const matches = matchingRowSelections(meta);
            if (matches.length > 0) {
                el.classList.add(MOUSE_SELECTED_ROW_CLASS);
            } else {
                el.classList.remove(MOUSE_SELECTED_ROW_CLASS);
            }
        }
    }
};
```
In order to reapply row selection to our `th`s, we'll need to find all of them in
our `table` and iterate over the collection - adding or removing the `MOUSE_SELECTED_ROW_CLASS`
based on whether or not the `th` is selected.

If the `th` is part of the selection, we'll add the class to its `classlist` and
`push()` its `y` into the `selectedYs` returned.

Our `isRowHeaderSelected()` function needs to scan the `visibleRowHeaders` to
select groups and ranges, so as an optimization, we've calculated that once
to reuse for each of the `elements`. It's a collection of the `row_headers` for
the range of the viewport based on the first `MetaData` in the collection mapped
to include an index offset by the `y0` or viewport origin.
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
The implementation of `isRowHeaderSelected()` can be broken down into two checks.

Using our `matchingRowSelections()` helper, we find all of the `matches` and check
for a direct match - when the `row_header_x` values match.

It's a bit more complex to check if the `th` is a member of a group selection.
In `isGroupMatch()`, we'll make use of our `visibleRowHeaders` collection, a 
two-dimensional `Array` of the form `[index, ["Group 0", "Row 0"]]`.
First we'll `filter()` the row headers to those that intersect with the `selection`'s
range, then we'll extract the `row_header` that matches our `selection`'s `row_header_x`.
The resulting `matchingGroupValues` will look something like `["Group 0", "Group 10", ...]`.
Next, we find the indexes of each value that matches our `selection` and compare.
```javascript
const isRowHeaderSelected = (meta, visibleRowHeaders) => {
    const matches = matchingRowSelections(meta);

    const isGroupMatch = () => {
        return MOUSE_SELECTED_ROWS.find((selection) => {
            const matchingGroupValues = visibleRowHeaders.filter(([idx]) => selection.y0 <= idx && idx <= selection.y1).map(([idx, row_headers]) => idx);
            return selection.row_header_x < meta.row_header_x && matchingGroupValues.indexOf(meta.y) !== -1;
        });
    };
    const isDirectMatch = () => !!matches.find((m) => m.row_header_x === meta.row_header_x);

    return isDirectMatch() || isGroupMatch();
};
```
By comparison, reapplying the row `td` selection is simple. We check the `MetaData`
from `getMeta()` and if its `y` is in the `ys` passed in we `add()` the `MOUSE_SELECTED_ROW_CLASS`.
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
## Our `DataListener`
A quick function that makes use of some utilities borrowed from `two_billion_rows`.
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

```
Now to kick off our example on `"load"` by adding an `EvenListener` that will set
our `table`'s `DataListener` from `generateDataListener()`,
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

And we will borrow our data helpers from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
