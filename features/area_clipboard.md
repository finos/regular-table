# Area Clipboard

Area Clipboard interactions allow the end user the ability to copy, paste and
cut selections in the grid. There is some complexity to this behavior when the
data on the `clipboard` has a different shape than the cells selected in the
grid. For instance, if the user has copied two cells of data and has selected
three distinct areas as a target to `"paste"` the data - what's the desired
behavior. In this example, we will repeat the selection to fill all targets upon
`"paste"`. This feature adds clipboard edit interactions to the area selection
behavior defined in `area_mouse_selection` by listening for the
`regular-table-area-selected"`event.

# API

```html
<regular-table id="example_table"></regular-table>
```

We will wire it all up on `"load"` by creating and setting our `DataListener`
and then making sure that we `addAreaMouseSelection()` and create a `write()`
`function` for use in `addAreaClipboard()`, and then we can `addAreaClipboard()`
and kick off a `draw()`.

```html
<script type="module">
    import {
        addAreaClipboard,
        generateDataListener,
    } from "./area_clipboard.js";

    import { addAreaMouseSelection } from "/dist/features/area_mouse_selection.js";

    window.addEventListener("load", () => {
        const dl = generateDataListener(1000, 50);
        example_table.setDataListener(dl);

        const write = (x, y, value) => {
            dl().allData[x][y] = value;
        };

        addAreaClipboard(example_table, dl, write);

        addAreaMouseSelection(example_table, {
            selected: [
                { x0: 5, x1: 7, y0: 7, y1: 11 },
                { x0: 1, x1: 3, y0: 16, y1: 22 },
                { x0: 7, x1: 8, y0: 15, y1: 18 },
            ],
        });

        example_table.draw();
    });
</script>
```

## `addAreaClipboard()`

We'll create a single function to add the clipboard behavior to the
`<regular-table>` passed in as the first argument. Additionally, it will take
the `DataListener` and a `function` to `write` edits to the `DataModel`. Its
direct responsibilities include adding `EventListener`s and the clipboard
interaction's `StyleListener`. Our `EventListener` will dispatch to each of the
behaviors for copy, paste and cut as expected - we'll define those next.

```javascript
const PRIVATE = Symbol("Area Clipboard");

export const addAreaClipboard = (table, dl, write) => {
    const keyListener = (event) => {
        const meta = table.getMeta(event.target);
        switch (event.keyCode) {
            // C
            case 67:
                if (event.metaKey || event.ctrlKey) {
                    areaClipboardCopy(table, dl);
                    break;
                }
            // V
            case 86:
                if (event.metaKey || event.ctrlKey) {
                    areaClipboardPaste(table, write);
                    break;
                }
            // X
            case 88:
                if (event.metaKey || event.ctrlKey) {
                    areaClipboardCut(table, dl, write);
                    break;
                }
        }
    };

    initAreaClipboardData(table);

    table.addEventListener("keydown", keyListener);
    table.addEventListener(
        "regular-table-area-selected",
        ({ detail: { selected_areas } }) => {
            table[PRIVATE].selected_areas = selected_areas;
        }
    );

    addAreaClipboardStyleListener(table, dl);
    return table;
};
```

For our `areaClipboardCopy()`, we'll need to keep track of the
`AREA_CLIPBOARD_COPY_SELECTIONS`. Each will represent a rectangular selection
using familiar attributes `x0` as the upper left and `y1` as the lower right.
We'll also keep track of the data we get from the `DataListener` for the areas
selected mapping over the selections then transposing the collection. We will
also track `AREA_CLIPBOARD_PASTE_SELECTIONS` and the `selected_areas` from
`area_mouse_selection`.

```javascript
const initAreaClipboardData = (table) => {
    table[PRIVATE] = {
        AREA_CLIPBOARD_COPIED_DATA: [],
        AREA_CLIPBOARD_COPY_SELECTIONS: [],
        AREA_CLIPBOARD_PASTE_SELECTIONS: [],
        selected_areas: [],
    };
};
```

So we'll start our `function` by recording the `AREA_CLIPBOARD_COPY_SELECTIONS`
and `AREA_CLIPBOARD_COPIED_DATA`. Next, we can generate the corresponding
`textSelections` by splitting the lines with `\t` and selections with `\n`.
Finally, we write our generated text to the `navigator.clipboard` and update the
styling. Don't worry, we'll define `updateAreaClipboardStyle()` later.

```javascript
const getSelectedAreas = (table) => {
    return table[PRIVATE].selected_areas;
};

const areaClipboardCopy = async (table, dl) => {
    table[PRIVATE].AREA_CLIPBOARD_COPY_SELECTIONS = getSelectedAreas(table);
    table[PRIVATE].AREA_CLIPBOARD_COPIED_DATA = areaClipboardCopyData(
        table,
        dl
    );

    const textSelections = table[PRIVATE].AREA_CLIPBOARD_COPIED_DATA.map(
        (area) => {
            return area.map((row) => row.join("\t")).join("\n");
        }
    );

    try {
        await navigator.clipboard.writeText(textSelections[0]);
        updateAreaClipboardStyle(table);
    } catch (e) {
        console.error("Failed to writeText to navigator.clipboard.", e);
    }
};

const areaClipboardCopyData = (table, dl) => {
    const transpose = (m) => m[0].map((x, i) => m.map((x) => x[i]));
    const data = table[PRIVATE].AREA_CLIPBOARD_COPY_SELECTIONS.map(
        ({ x0, x1, y0, y1 }) => dl(x0, y0, x1 + 1, y1 + 1).data
    );
    return data.map(transpose);
};
```

For our `areaClipboardCut()`, we can simply call `areaClipboardCopy()` prior to
overwriting the data in the `DataModel` with `undefined`, clearing the selected
region. Then we call `draw()` to ensure the data in the `table` reflects the
cut.

```javascript
const areaClipboardCut = async (table, dl, write) => {
    await areaClipboardCopy(table, dl);
    for (const { x0, x1, y0, y1 } of table[PRIVATE]
        .AREA_CLIPBOARD_COPY_SELECTIONS) {
        for (var x = x0; x < x1 + 1; x++) {
            for (var y = y0; y < y1 + 1; y++) {
                write(x, y, undefined);
            }
        }
    }
    table.draw();
};
```

Our implementation of `areaClipboardPaste()` is a bit tricky as we'd like to
cover a couple of use cases. If the user is copying multiple selections from our
`table` and there are multiple areas selected in our `table` to paste to, then
we'd like to paste the first copied selection to the first paste selection and
the second copied selection to the second paste selection and so on... In the
event that the end user is copying from a different spreadsheet, we'll need to
parse the text on the `clipboard` and attempt to `write` the parsed content to
our `table`.

If the `parsedData` is unusable, we can only try to write the
`AREA_CLIPBOARD_COPIED_DATA`. We'll also `useLocalData` if it matches the what's
been parsed from the `clipboard`. Otherwise, we know that the `data` on the
`clipboard` came from outside of `<regular-table>`, and we should map it to each
of the selected areas we're pasting to. We'll want to keep track of the
`AREA_CLIPBOARD_PASTE_SELECTIONS` to style the areas we paste to using the same
structure as `AREA_CLIPBOARD_COPY_SELECTIONS`.

We'll then duplicate the `data` collection to ensure we can paste into all of
the currently selected areas and zip the collections - pairing the currently
selected areas with copied data. We can then iterate through the zipped
collection writing the data to for each of the selections and calculating the
pasted areas' dimensions. Finally, we call `draw()` to force the `table` to
update the `date` shown.

```javascript
const areaClipboardPaste = async (table, write) => {
    const zip = (arr, ...arrs) =>
        arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));

    const parsedData = await tryParseAreaClipboardText();
    const useLocalData = eqArray(
        parsedData,
        table[PRIVATE].AREA_CLIPBOARD_COPIED_DATA[0]
    );

    let data = [];
    if (!parsedData || useLocalData) {
        data = Array.from(Array(getSelectedAreas(table).length).keys()).flatMap(
            () => table[PRIVATE].AREA_CLIPBOARD_COPIED_DATA
        );
    } else {
        data = Array.from(Array(getSelectedAreas(table).length).keys()).map(
            () => parsedData
        );
    }

    table[PRIVATE].AREA_CLIPBOARD_PASTE_SELECTIONS = zip(
        getSelectedAreas(table),
        data
    ).map(([{ x0, y0 }, data]) => {
        data.map((row, ridx) => {
            row.map((value, cidx) => {
                write(x0 + cidx, y0 + ridx, value);
            });
        });

        const x1 = x0 + data[0].length - 1;
        const y1 = y0 + data.length - 1;
        return { x0, y0, x1, y1 };
    });

    await table.draw();
};
```

Our implementation of `tryParseAreaClipboardText()` takes the current
`clipboard` text and attempts to map it assuming that it's formatted similar to
content copied from a spreadsheet.

```javascript
async function tryParseAreaClipboardText() {
    try {
        const text = await navigator.clipboard.readText();
        const rows = text.split(/\r\n|\n|\r/);
        return rows.length > 0 ? rows.map((r) => r.split("\t")) : r;
    } catch (e) {
        console.error("Failed to readText from navigator.clipboard.", e);
    }
}
```

We'll also need a quick `function` to compare our `Array`s of data for
`areaClipboardPaste()`.

```javascript
function eqArray(a1, a2) {
    if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length)
        return false;
    for (var i = 0; i < a1.length; i++) {
        const eqArrays =
            Array.isArray(a1[i]) &&
            Array.isArray(a2[i]) &&
            eqArray(a1[i], a2[i]);
        if (!eqArrays && a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
}
```

## `StyleListener`

We'll need to add a `StyleListener` to `add` or `remove` the classes for copy
and paste.

```javascript
const AREA_CLIPBOARD_COPY_SELECTED_CLASS = "clipboard-copy-selected-area";
const AREA_CLIPBOARD_PASTE_SELECTED_CLASS = "clipboard-paste-selected-area";

const addAreaClipboardStyleListener = (table) => {
    table.addStyleListener(() => updateAreaClipboardStyle(table));
};
```

We'll make the logic for updating the `classList` available via a `function`
that can be called outside of the `StyleListener`, so that we can invoke it
without forcing a `draw()` on the `table`. Basically,
`updateAreaClipboardStyle()` iterates through the `td`s on the screen removing
the `AREA_CLIPBOARD_COPY_SELECTED_CLASS` and
`AREA_CLIPBOARD_PASTE_SELECTED_CLASS` from each and then checks to see if the
`MetaData` shows that it intersects a copied or pasted selection, reapplying the
classes on a match.

```javascript
const updateAreaClipboardStyle = (table) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        const meta = table.getMeta(td);
        td.classList.remove(AREA_CLIPBOARD_COPY_SELECTED_CLASS);
        td.classList.remove(AREA_CLIPBOARD_PASTE_SELECTED_CLASS);

        const copyMatch = table[PRIVATE].AREA_CLIPBOARD_COPY_SELECTIONS.find(
            ({ x0, x1, y0, y1 }) =>
                x0 <= meta.x && meta.x <= x1 && y0 <= meta.y && meta.y <= y1
        );

        const pasteMatch = table[PRIVATE].AREA_CLIPBOARD_PASTE_SELECTIONS.find(
            ({ x0, x1, y0, y1 }) =>
                x0 <= meta.x && meta.x <= x1 && y0 <= meta.y && meta.y <= y1
        );

        if (!!copyMatch) {
            td.classList.add(AREA_CLIPBOARD_COPY_SELECTED_CLASS);
        }
        if (!!pasteMatch) {
            td.classList.add(AREA_CLIPBOARD_PASTE_SELECTED_CLASS);
        }
    }
};
```

## Our `DataListener`

Our `DataListener` generator is similar to the `dataListener` defined in
`two_billion_rows`, but extends the `return`ed `object` with `allData` - exposed
to enable our `write` `function`.

```javascript
function range(x0, x1, f) {
    return Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));
}

export const generateDataListener = (num_rows, num_columns) => {
    const allData = range(0, num_columns, (x) =>
        range(0, num_rows, (y) => `${x}, ${y}`)
    );
    return function dl(x0, y0, x1, y1) {
        return {
            num_rows,
            num_columns,
            data: allData.slice(x0, x1).map((col) => col.slice(y0, y1)),
            allData,
        };
    };
};
```

## Styling

Similar to other examples like `row_column_area_selection`, we will use a
primary color scheme to show the selected areas and their overlap with areas
that are being copied or have been pasted to.

```css
regular-table tbody tr:hover td {
    background-color: #a4d5f4 !important;
    border: 1px solid #a4d5f4 !important;
    color: black !important;
}

regular-table tbody tr td.mouse-selected-area {
    background-color: #2771a8;
    border: 1px solid #2771a8;
    color: white;
}

regular-table tbody tr td.clipboard-paste-selected-area {
    background-color: #64b1e4;
    border: 1px solid #64b1e4;
    color: black;
}

regular-table tbody tr td.clipboard-copy-selected-area {
    background-color: #a4d5f4;
    border: 1px solid #a4d5f4;
    color: black;
}

regular-table tbody tr td.mouse-selected-area.clipboard-copy-selected-area {
    background-color: #2771a8;
    border: 1px solid #2771a8;
    color: white;
}

regular-table tbody tr td.mouse-selected-area.clipboard-paste-selected-area {
    background-color: #2771a8;
    border: 1px solid #2771a8;
    color: white;
}

regular-table
    tbody
    tr
    td.clipboard-copy-selected-area.clipboard-paste-selected-area {
    background-color: #2771a8;
    border: 1px solid #2771a8;
    color: black;
}

regular-table
    tbody
    tr
    td.mouse-selected-area.clipboard-copy-selected-area.clipboard-paste-selected-area {
    background-color: #2771a8;
    border: 1px solid #2771a8;
    color: black;
}
```

Lets turn off the `user-select` style for this example too

```css
regular-table tbody tr td {
    user-select: none;
}

regular-table tbody tr th {
    user-select: none;
}

regular-table thead tr th {
    user-select: none;
}
```

And outline the `td`s.

```css
td {
    outline: none;
    box-sizing: border-box;

    border-left: 1px solid transparent;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    border-top: 1px solid transparent;

    min-width: 22px;
}
```

## Appendix (Dependencies)

Our Libraries.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="/dist/css/material.css" />
```

```block
license: apache-2.0
```
