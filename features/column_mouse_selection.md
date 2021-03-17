# Column Selection using the Mouse

This example adds column selection to a
[`<regular-table>`](https://github.com/jpmorganchase/regular-table), allowing
the user to select columns via mouse clicks. **_Quick Note:_** The
implementation of this behavior is mostly symmetric to the `row_mouse_selection`
example. There's actually so much overlap that we will comment sparingly -
mainly focusing on the differences. First off, we need the `<regular-table>`
with an `id` that will be accessible on the window object using
[`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="columnMouseSelectionRegularTable"></regular-table>
```

## `addColumnMouseSelection()`

Similar to `addRowMouseSelection()`, we expect that when we `"click"` on the
column header or the grouped column header then the column shows as selected.

```javascript
const MOUSE_SELECTED_COLUMN_CLASS = "mouse-selected-column";

export const addColumnMouseSelection = (
    table,
    dl,
    { className = MOUSE_SELECTED_COLUMN_CLASS } = {}
) => {
    const clickListener = (event) => {
        const meta = table.getMeta(event.target);
        const headerWasClicked =
            meta && typeof meta.column_header_y !== "undefined";
        if (headerWasClicked) {
            MOUSE_SELECTED_COLUMN_HEADERS = newColumnHeaderSelections(
                meta,
                event,
                dl
            );
        } else if (!event.ctrlKey && !event.metaKey) {
            MOUSE_SELECTED_COLUMN_HEADERS = [];
        }
        table.draw();
    };

    table.addEventListener("click", clickListener);
    addColumnSelectionStyleListener(table, dl, className);
    return table;
};
```

We will keep a `ColumnSelection` object in our `MOUSE_SELECTED_COLUMN_HEADERS`
that resembles the `RowSelection` object in `row_mouse_selection`. | Name | Type
| Description | | --- | --- | --- | | [x0] | `number` | The `x` index that
begins the selection. | | [x1] | `number` | The `x` index that ends the
selection. | | [column_header_y] | `number` | The `y` of this header's
`row_header`.| | [column_header] | <code>Array.&lt;object&gt;</code> | The
`Array` of headers associated with this selection. |

```javascript
let MOUSE_SELECTED_COLUMN_HEADERS = [];
```

The logic of our `"click"` `EventListener` only differs in the `MetaData`
attributes we need in order to produce the `newColumnHeaderSelections()`.
Throughout this example we'll be focusing on the `x` indexes and
`column_header`s in place of the `y` and `row_header`s.

### When creating `newColumnHeaderSelections()`

We will check the `meta` and `ctrlKey` to determine the selection mode, and our
method of generating a `targetColumnSelection()` will grab the attributes from
the `MetaData` appropriate for generating our `ColumnSelection`.

```javascript
const newColumnHeaderSelections = (meta, event, dl) => {
    const inMultiSelectMode = event.ctrlKey || event.metaKey;
    const targetSelection = targetColumnSelection(meta, dl);

    if (inMultiSelectMode) {
        return newMultiSelectColumnHeaders(targetSelection, dl);
    } else {
        return newSingleSelectColumnHeaders(targetSelection, dl);
    }
};

const targetColumnSelection = (meta, dl) => {
    const target = { ...meta };
    target.x0 = meta.x;

    const isColumnGroup =
        meta.column_header_y !== meta.column_header.length - 1 &&
        meta.x !== undefined;
    if (isColumnGroup) {
        target.x1 = lastIndexOfColumnGroup(dl, meta);
    } else {
        target.x1 = meta.x;
    }

    return target;
};
```

We'll create a single range selection if the `shiftKey` is pressed otherwise a
single column is selected.

```javascript
const newSingleSelectColumnHeaders = (targetSelection, dl) => {
    const matches = matchingColumnSelections(targetSelection);

    if (matches.length > 0) {
        return [];
    } else {
        if (event.shiftKey) {
            return [createColumnRangeSelection(targetSelection, dl)];
        } else {
            return [targetSelection];
        }
    }
};
```

If the selection was already made based on our `matchingColumnSelections()`, we
will instead clear the `MOUSE_SELECTED_COLUMN_HEADERS` by returning an empty
`Array`.

```javascript
const matchingColumnSelections = ({ x, x0, x1 }) => {
    const _x = x !== undefined ? x : Math.min(x0, x1);
    return MOUSE_SELECTED_COLUMN_HEADERS.filter(
        (s) => s.x0 <= _x && _x <= s.x1
    );
};
```

Creating a column range selection closely mirrors `createRowRangeSelection()` in
our `row_mouse_selection` example.

```javascript
const createColumnRangeSelection = (columnSelection, dl) => {
    const lastSelection =
        MOUSE_SELECTED_COLUMN_HEADERS[MOUSE_SELECTED_COLUMN_HEADERS.length - 1];
    if (lastSelection) {
        const x0 = Math.min(
            columnSelection.x0,
            lastSelection.x0,
            columnSelection.x1,
            lastSelection.x1
        );
        const x1 = Math.max(
            columnSelection.x0,
            lastSelection.x0,
            columnSelection.x1,
            lastSelection.x1
        );
        const column_header_y = Math.min(
            columnSelection.column_header_y,
            lastSelection.column_header_y
        );
        columnSelection.x0 = x0;
        columnSelection.x1 = x1;
    }
    return columnSelection;
};
```

... as does our logic for multi-select.

```javascript
const newMultiSelectColumnHeaders = (targetSelection, dl) => {
    const matches = matchingColumnSelections(targetSelection);

    if (matches.length > 0) {
        let newSelections = rejectMatchingColumnSelections(targetSelection);
        return splitColumnRangeMatches(newSelections, targetSelection);
    } else {
        if (event.shiftKey) {
            return MOUSE_SELECTED_COLUMN_HEADERS.concat(
                createColumnRangeSelection(targetSelection, dl)
            );
        } else {
            return MOUSE_SELECTED_COLUMN_HEADERS.concat(targetSelection);
        }
    }
};

const rejectMatchingColumnSelections = ({ x, x0, x1 }) => {
    const _x = x ? x : Math.min(x0, x1);
    return MOUSE_SELECTED_COLUMN_HEADERS.filter(
        ({ x0, x1 }) => !(x0 == _x && _x == x1)
    );
};

const splitColumnRangeMatches = (selections, columnSelection) => {
    return selections.flatMap((s) => {
        const column_header_y = Math.max(
            columnSelection.column_header_y,
            s.column_header_y
        );
        const matchesRangeSelection =
            s.x0 <= columnSelection.x0 &&
            columnSelection.x1 <= s.x1 &&
            s.x0 !== s.x1;

        if (matchesRangeSelection) {
            const firstSplit = {
                column_header_y,
                x0: s.x0,
                x1: columnSelection.x0 - 1,
                column_header: s.column_header,
            };
            const secondSplit = {
                column_header_y,
                x0: columnSelection.x1 + 1,
                x1: s.x1,
                column_header: s.column_header,
            };
            return [firstSplit, secondSplit].filter((s) => s.x0 <= s.x1);
        } else {
            return s;
        }
    });
};
```

## Styling

Our `mouse-selected-column` will need some style to make it visually distinct.

```css
regular-table tbody tr td.mouse-selected-column,
regular-table tr th.mouse-selected-column {
    background-color: #2771a8;
    color: white;
}
```

And we similarly disable the default `user-select` here.

```css
regular-table thead tr th,
regular-table tbody tr td {
    user-select: none;
}
```

## `StyleListener`

We need to use a `StyleListener` to make our selection re-render on `draw()`, so
we'll check each `td` and `th` in our `table` and update their `classList`. Our
function to update the `th`s will report the `x`s marked as selected for reuse
in `reapplyColumnTDSelection()`.

```javascript
const addColumnSelectionStyleListener = (table, dl, className) => {
    table.addStyleListener(() => {
        const xs = reapplyColumnTHSelection(table, dl, className);
        reapplyColumnTDSelection(table, xs, className);
    });
};
```

Our `reapplyColumnTHSelection()` and `reapplyColumnTDSelection()` functions are
complicated but symmetric to our `reapplyRowTHSelection()` and
`reapplyRowTDSelection()` definitions.

```javascript
const reapplyColumnTHSelection = (table, dl, className) => {
    const elements = table.querySelectorAll("thead th");
    let selectedXs = [];

    if (elements.length > 0) {
        const tds = table.querySelectorAll("tbody td");
        const tdMeta1 = table.getMeta(tds[0]);
        const meta0 = table.getMeta(elements[0]);

        const visibleHeaders = dl(
            tdMeta1.x0,
            0,
            tdMeta1.x1 + 1,
            0
        ).column_headers.map((h, idx) => [meta0.x0 + idx, h]);
        for (const el of elements) {
            const meta = table.getMeta(el);

            if (isColumnHeaderSelected(meta, visibleHeaders)) {
                selectedXs.push(meta.x);
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        }
    }
    return selectedXs;
};

const isColumnHeaderSelected = (meta, visibleHeaders) => {
    const matches = matchingColumnSelections(meta);

    const isGroupMatch = () => {
        return MOUSE_SELECTED_COLUMN_HEADERS.find((selection) => {
            const matchingGroupValues = visibleHeaders
                .filter(([idx]) => selection.x0 <= idx && idx <= selection.x1)
                .map(([idx, column_headers]) => idx);
            return (
                selection.column_header_y < meta.column_header_y &&
                matchingGroupValues.indexOf(meta.x) !== -1
            );
        });
    };
    const isDirectMatch = () =>
        !!matches.find((m) => m.column_header_y === meta.column_header_y);

    return isDirectMatch() || isGroupMatch();
};

const reapplyColumnTDSelection = (table, xs, className) => {
    const elements = table.querySelectorAll("tbody td");

    for (const el of elements) {
        const meta = table.getMeta(el);

        if (xs.indexOf(meta.x) !== -1) {
            el.classList.add(className);
        } else {
            el.classList.remove(className);
        }
    }
};
```

## Our `DataListener`

Here's a quick `DataListener` generator using some borrowed code, thanks again
`two_billion_rows`.

```javascript
export function generateDataListener(num_rows, num_columns) {
    return function dl(x0, y0, x1, y1) {
        return {
            num_rows,
            num_columns,
            row_headers: range(y0, y1, group_header.bind(null, "Row")),
            column_headers: range(x0, x1, group_header.bind(null, "Column")),
            data: range(x0, x1, (x) =>
                range(y0, y1, (y) => formatter.format(x + y))
            ),
        };
    };
}
```

### `lastIndexOfColumnGroup()`

We need to scan the `DataListener` to find the final index of a group selection
to ensure it's properly styled. For a more in depth explanation, see
`lastIndexOfRowGroup()`.

```javascript
const lastIndexOfColumnGroup = (dl, { column_header_y, value, x }) => {
    const { num_columns } = dl(0, 0, 1, 1);
    let idx;
    const chunk = 100;
    let x0 = x;
    let x1 = Math.min(x + chunk, num_columns);
    do {
        const columnHeaderSlice = dl(
            x0,
            0,
            x1,
            0
        ).column_headers.map((h, idx) => [x + idx, h]);
        const result = columnHeaderSlice.find(
            ([_, column_headers]) => column_headers[column_header_y] !== value
        );
        if (result) {
            [idx] = result;
        } else {
            x0 = Math.min(x0 + chunk, num_columns);
            x1 = Math.min(x1 + chunk, num_columns);
        }
    } while (idx === undefined && x1 < num_columns);
    return idx === undefined ? num_columns : idx - 1;
};
```

On `"load"`, we'll handle wiring our behavior up by generating and setting the
`DataListener` and passing it to `addColumnMouseSelection()` along with our
`table`. Finally, we'll make the initial `draw()` call.

```html
<script type="module">
    import {
        generateDataListener,
        addColumnMouseSelection,
    } from "./column_mouse_selection.js";
    function defaultColumnSelection() {
        MOUSE_SELECTED_COLUMN_HEADERS = [
            {
                column_header: ["Group 0", "Column 6"],
                column_header_y: 1,
                x0: 6,
                x1: 6,
            },
            {
                column_header: ["Group 0", "Column 8"],
                column_header_y: 1,
                x0: 8,
                x1: 8,
            },
            {
                column_header: ["Group 0", "Column 9"],
                column_header_y: 1,
                x0: 8,
                x1: 9,
            },
        ];
    }

    window.addEventListener("load", () => {
        const table = window.columnMouseSelectionRegularTable;
        if (table) {
            const dl = generateDataListener(200, 50);
            table.setDataListener(dl);
            addColumnMouseSelection(table, dl);
            defaultColumnSelection();
            table.draw();
        }
    });
</script>
```

## Appendix (Dependencies)

Of course, we'll pull in our libraries.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="/dist/css/material.css" />
```

.. and our data utils from `two_billion_rows`.

```html
<script type="module" src="/dist/examples/two_billion_rows.js"></script>
```

```block
license: apache-2.0
```
