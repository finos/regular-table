# Mouse Column Selection

Mouse column selection shares a similar behavior to mouse row selection. We expect that when we `"click"` on the column header then the column shows as selected. In this example, the columns are grouped as well, and when the group is selected then columns under the group should show as selected too. We'll also allow the user to make multiple selections when holding down the `ctrl` or `metaKey`.

The bulk of the logic belongs in a `"click"` `EventListener`, so our `addColumnMouseSelection()` should take a `table` and add a `clickListener()`.

It will also be responsible for adding the `StyleListener` to ensure the selection shows correctly as the `table` scrolls.

# API

```html
<regular-table id="example_table"></regular-table>
```

On `"load"`, we'll handle wiring our behavior up by generating and setting the `DataListener` and passing it to `addColumnMouseSelection()` along with our `table`. Finally, we'll make the initial `draw()` call.

```html
<script type="module">
    import { addColumnMouseSelection } from "./index.js";
    import { dataListener } from "https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/examples/two_billion_rows.js";

    window.addEventListener("load", () => {
        const dl = dataListener(200, 50);
        example_table.setDataListener(dl);
        addColumnMouseSelection(example_table, dl, {
            selected: [
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
            ],
        });
        example_table.draw();
    });
</script>
```

## `addColumnMouseSelection()`

Similar to `addRowMouseSelection()`, we expect that when we `"click"` on the column header or the grouped column header then the column shows as selected.

```javascript
const PRIVATE = Symbol("Column Mouse Selection");
const MOUSE_SELECTED_COLUMN_CLASS = "mouse-selected-column";

export const addColumnMouseSelection = (
    table,
    dl,
    { className = MOUSE_SELECTED_COLUMN_CLASS, selected = [] } = {}
) => {
    table[PRIVATE] = { selected_columns: selected };

    const clickListener = (event) => {
        let meta = table.getMeta(event.target);

        if (!meta && event.path) {
            const th = event.path.reverse().find((el) => table.getMeta(el));
            meta = table.getMeta(th);
        }

        const headerWasClicked =
            meta && typeof meta.column_header_y !== "undefined";

        if (headerWasClicked) {
            table[PRIVATE] = {
                selected_columns: newColumnHeaderSelections(
                    table,
                    meta,
                    event,
                    dl
                ),
            };
        } else if (!event.ctrlKey && !event.metaKey) {
            table[PRIVATE] = { selected_columns: [] };
        }
        table.draw();
    };

    table.addEventListener("click", clickListener);
    addColumnSelectionStyleListener(table, dl, className);
    return table;
};
```

We will keep a `ColumnSelection` object in our `table` that resembles the `RowSelection` object in `row_mouse_selection`.

| Name | Type | Description |
| ---- | ---- | ----------- |
| [x0] | `number` | The `x` index that begins the selection. |
| [x1] | `number` | The `x` index that ends the selection. |
| [column_header_y] | `number` | The `y` of this header's `row_header`. |
| [column_header] | <code>Array.<object></code> | The header selections. |

The logic of our `"click"` `EventListener` only differs in the `MetaData` attributes we need in order to produce the `newColumnHeaderSelections()`. Throughout this example we'll be focusing on the `x` indexes and `column_header`s in place of the `y` and `row_header`s.

### When creating `newColumnHeaderSelections()`

We will check the `meta` and `ctrlKey` to determine the selection mode, and our method of generating a `targetColumnSelection()` will grab the attributes from the `MetaData` appropriate for generating our `ColumnSelection`.

```javascript
const newColumnHeaderSelections = (table, meta, event, dl) => {
    const inMultiSelectMode = event.ctrlKey || event.metaKey;
    const targetSelection = targetColumnSelection(meta, dl);

    if (inMultiSelectMode) {
        return newMultiSelectColumnHeaders(table, targetSelection, dl);
    } else {
        return newSingleSelectColumnHeaders(table, targetSelection, dl);
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

We'll create a single range selection if the `shiftKey` is pressed otherwise a single column is selected.

```javascript
const newSingleSelectColumnHeaders = (table, targetSelection, dl) => {
    const matches = matchingColumnSelections(table, targetSelection);

    if (matches.length > 0) {
        return [];
    } else {
        if (event.shiftKey) {
            return [createColumnRangeSelection(table, targetSelection, dl)];
        } else {
            return [targetSelection];
        }
    }
};
```

If the selection was already made based on our `matchingColumnSelections()`, we will instead clear the `selected_columns` by returning an empty `Array`.

```javascript
const matchingColumnSelections = (table, { x, x0, x1 }) => {
    const _x = x !== undefined ? x : Math.min(x0, x1);
    return table[PRIVATE].selected_columns.filter(
        (s) => s.x0 <= _x && _x <= s.x1
    );
};
```

Creating a column range selection closely mirrors `createRowRangeSelection()` in our `row_mouse_selection` example.

```javascript
const createColumnRangeSelection = (table, columnSelection, dl) => {
    const selectedColumns = table[PRIVATE].selected_columns;
    const lastSelection = selectedColumns[selectedColumns.length - 1];
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
const newMultiSelectColumnHeaders = (table, targetSelection, dl) => {
    const matches = matchingColumnSelections(table, targetSelection);

    if (matches.length > 0) {
        let newSelections = rejectMatchingColumnSelections(
            table,
            targetSelection
        );
        return splitColumnRangeMatches(newSelections, targetSelection);
    } else {
        if (event.shiftKey) {
            return table[PRIVATE].selected_columns.concat(
                createColumnRangeSelection(table, targetSelection, dl)
            );
        } else {
            return table[PRIVATE].selected_columns.concat(targetSelection);
        }
    }
};

const rejectMatchingColumnSelections = (table, { x, x0, x1 }) => {
    const _x = x ? x : Math.min(x0, x1);
    return table[PRIVATE].selected_columns.filter(
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

## `StyleListener`

We need to use a `StyleListener` to make our selection re-render on `draw()`, so we'll check each `td` and `th` in our `table` and update their `classList`. Our function to update the `th`s will report the `x`s marked as selected for reuse in `reapplyColumnTDSelection()`.

```javascript
const addColumnSelectionStyleListener = (table, dl, className) => {
    table.addStyleListener(() => {
        const xs = reapplyColumnTHSelection(table, dl, className);
        reapplyColumnTDSelection(table, xs, className);
    });
};
```

Our `reapplyColumnTHSelection()` and `reapplyColumnTDSelection()` functions are complicated but symmetric to our `reapplyRowTHSelection()` and `reapplyRowTDSelection()` definitions.

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

            if (isColumnHeaderSelected(table, meta, visibleHeaders)) {
                selectedXs.push(meta.x);
                el.classList.add(className);
            } else {
                el.classList.remove(className);
            }
        }
    }
    return selectedXs;
};

const isColumnHeaderSelected = (table, meta, visibleHeaders) => {
    const matches = matchingColumnSelections(table, meta);

    const isGroupMatch = () => {
        return table[PRIVATE].selected_columns.find((selection) => {
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

### `lastIndexOfColumnGroup()`

We need to scan the `DataListener` to find the final index of a group selection to ensure it's properly styled. For a more in depth explanation, see `lastIndexOfRowGroup()`.

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

## Appendix (Dependencies)

Of course, we'll pull in our libraries.

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css" />
```

```block
license: apache-2.0
```

