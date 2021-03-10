# Area Clipboard Interactions

This example adds clipboard edit interactions to the area selection behavior applied to a
[`<regular-table>`](https://github.com/jpmorganchase/regular-table), allowing the user
to select groups of cells then copy, paste and cut.
First we'll add a `<regular-table>` to the page with an `id` accessible on the window
object.

```html
<regular-table id="areaClipboardInteractionsRegularTable"></regular-table>
```

## Extending Area Selection

Now we'll need to make the area selection behavior available by including the `area_mouse_selection` example ...

```html
<script src="/dist/examples/area_mouse_selection.js"></script>
```

and we'll also need a quick helper `function` to `getSelectedAreas()`.

```javascript
function getSelectedAreas() {
    return MOUSE_SELECTED_AREAS;
}
```

## `addAreaClipboardInteractions()`

We'll create a single function to add the clipboard behavior to the `<regular-table>`
passed in as the first argument. Additionally, it will take the `DataListener` and a
`function` to `write` edits to the `DataModel`. Its direct responsibilities include
adding `EventListener`s and the clipboard interaction's `StyleListener`.
Our `EventListener` will dispatch to each of the behaviors for copy, paste and cut
as expected - we'll define those next.

```javascript
const addAreaClipboardInteractions = (table, dl, write) => {
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

    table.addEventListener("keydown", keyListener);
    addAreaClipboardInteractionsStyleListener(table, dl);
    return table;
};
```

For our `areaClipboardCopy()`, we'll need to keep track of the `AREA_CLIPBOARD_COPY_SELECTIONS`.
Each will represent a rectangular selection using familiar attributes `x0` as the upper left and `y1` as the lower right.

```javascript
let AREA_CLIPBOARD_COPY_SELECTIONS = [];
```

We'll also keep track of the data we get from the `DataListener` for the areas selected
mapping over the selections then transposing the collection.

```javascript
let AREA_CLIPBOARD_COPIED_DATA = [];

const areaClipboardCopyData = (dl) => {
    const transpose = (m) => m[0].map((x, i) => m.map((x) => x[i]));
    const data = AREA_CLIPBOARD_COPY_SELECTIONS.map(({x0, x1, y0, y1}) => dl(x0, y0, x1 + 1, y1 + 1).data);
    return data.map(transpose);
};
```

So we'll start our `function` by keeping track of the `AREA_CLIPBOARD_COPY_SELECTIONS`
and `AREA_CLIPBOARD_COPIED_DATA`.
Next, we can generate the corresponding `textSelections` by splitting the lines with `\t`
and selections with `\n`.

Finally, we write our generated text to the `navigator.clipboard` and update the
styling. Don't worry, we'll define `updateAreaClipboardInteractionsStyle()` later.

```javascript
const areaClipboardCopy = async (table, dl) => {
    AREA_CLIPBOARD_COPY_SELECTIONS = getSelectedAreas();
    AREA_CLIPBOARD_COPIED_DATA = areaClipboardCopyData(dl);

    const textSelections = AREA_CLIPBOARD_COPIED_DATA.map((area) => {
        return area.map((row) => row.join("\t")).join("\n");
    });

    try {
        await navigator.clipboard.writeText(textSelections[0]);
        updateAreaClipboardInteractionsStyle(table);
    } catch (e) {
        console.error("Failed to writeText to navigator.clipboard.", e);
    }
};
```

For our `areaClipboardCut()`, we can simply call `areaClipboardCopy()` prior to
overwriting the data in the `DataModel` with `undefined`, clearing the selected region.
Then we call `draw()` to ensure the data in the `table` reflects the cut.

```javascript
const areaClipboardCut = async (table, dl, write) => {
    await areaClipboardCopy(table, dl);
    for (const {x0, x1, y0, y1} of AREA_CLIPBOARD_COPY_SELECTIONS) {
        for (var x = x0; x < x1 + 1; x++) {
            for (var y = y0; y < y1 + 1; y++) {
                write(x, y, undefined);
            }
        }
    }
    table.draw();
};
```

Our implementation of `areaClipboardPaste()` is a bit tricky as we'd like to cover a
couple of use cases.
If the user is copying multiple selections from our `table` and there are multiple
areas selected in our `table` to paste to, then we'd like to paste the first copied
selection to the first paste selection and the second copied selection to the second
paste selection and so on...
In the event that the end user is copying from a different spreadsheet, we'll need
to parse the text on the `clipboard` and attempt to `write` the parsed content to our
`table`.

If the `parsedData` is unusable, we can only try to write the `AREA_CLIPBOARD_COPIED_DATA`.
We'll also `useLocalData` if it matches the what's been parsed from the `clipboard`.
Otherwise, we know that the `data` on the `clipboard` came from outside of
`<regular-table>`, and we should map it to each of the selected areas we're pasting to. 
We'll want to keep track of the `AREA_CLIPBOARD_PASTE_SELECTIONS` to style the areas
we paste to using the same structure as `AREA_CLIPBOARD_COPY_SELECTIONS`.

```javascript
let AREA_CLIPBOARD_PASTE_SELECTIONS = [];
```

We'll then duplicate the `data` collection to ensure we can paste into all of the
currently selected areas and zip the collections - pairing the currently selected areas
with copied data. We can then iterate through the zipped collection writing the data to
for each of the selections and calculating the pasted areas' dimensions.
Finally, we call `draw()` to force the `table` to update the `date` shown.

```javascript
const areaClipboardPaste = async (table, write) => {
    const zip = (arr, ...arrs) => arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));

    const parsedData = await tryParseAreaClipboardText();
    const useLocalData = eqArray(parsedData, AREA_CLIPBOARD_COPIED_DATA[0]);

    let data = [];
    if (!parsedData || useLocalData) {
        data = Array.from(Array(getSelectedAreas().length).keys()).flatMap(() => AREA_CLIPBOARD_COPIED_DATA);
    } else {
        data = Array.from(Array(getSelectedAreas().length).keys()).map(() => parsedData);
    }

    AREA_CLIPBOARD_PASTE_SELECTIONS = zip(getSelectedAreas(), data).map(([{x0, y0}, data]) => {
        data.map((row, ridx) => {
            row.map((value, cidx) => {
                write(x0 + cidx, y0 + ridx, value);
            });
        });

        const x1 = x0 + data[0].length - 1;
        const y1 = y0 + data.length - 1;
        return {x0, y0, x1, y1};
    });

    await table.draw();
};
```

Our implementation of `tryParseAreaClipboardText()` takes the current `clipboard`
text and attempts to map it assuming that it's formatted similar to content copied
from a spreadsheet.

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

We'll also need a quick `function` to compare our `Array`s of data for `areaClipboardPaste()`.

```javascript
function eqArray(a1, a2) {
    if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        const eqArrays = Array.isArray(a1[i]) && Array.isArray(a2[i]) && eqArray(a1[i], a2[i]);
        if (!eqArrays && a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
}
```

## Styling

Similar to other examples like `row_column_area_selection`, we will use a primary
color scheme to show the selected areas and their overlap with areas that are
being copied or have been pasted to.

```css
regular-table tbody tr td.mouse-selected-area {
    background-color: rgb(255, 0, 0, 0.25); /* red */
}
regular-table tbody tr td.clipboard-paste-selected-area {
    background-color: rgb(255, 255, 0, 0.25); /* yellow */
}
regular-table tbody tr td.clipboard-copy-selected-area {
    background-color: rgb(0, 0, 255, 0.15); /* blue */
}
regular-table tbody tr td.mouse-selected-area.clipboard-copy-selected-area {
    background-color: rgb(128, 0, 128, 0.33); /* violet */
}
regular-table tbody tr td.mouse-selected-area.clipboard-paste-selected-area {
    background-color: rgb(255, 165, 0, 0.33); /* orange */
}
regular-table tbody tr td.clipboard-copy-selected-area.clipboard-paste-selected-area {
    background-color: rgb(50, 205, 50, 0.33); /* green */
}
regular-table tbody tr td.mouse-selected-area.clipboard-copy-selected-area.clipboard-paste-selected-area {
    background-color: rgb(183, 65, 14, 0.33); /* rust */
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
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    min-width: 22px;
}
```

## `StyleListener`

We'll need to add a `StyleListener` to `add` or `remove` the classes for copy and paste.

```javascript
const AREA_CLIPBOARD_COPY_SELECTED_CLASS = "clipboard-copy-selected-area";
const AREA_CLIPBOARD_PASTE_SELECTED_CLASS = "clipboard-paste-selected-area";

const addAreaClipboardInteractionsStyleListener = (table) => {
    table.addStyleListener(() => updateAreaClipboardInteractionsStyle(table));
};
```

We'll make the logic for updating the `classList` available via a `function` that
can be called outside of the `StyleListener`, so that we can invoke it without forcing a
`draw()` on the `table`.
Basically, `updateAreaClipboardInteractionsStyle()` iterates through the `td`s on the
screen removing the `AREA_CLIPBOARD_COPY_SELECTED_CLASS` and `AREA_CLIPBOARD_PASTE_SELECTED_CLASS`
from each and then checks to see if the `MetaData` shows that it intersects a copied
or pasted selection, reapplying the classes on a match.

```javascript
const updateAreaClipboardInteractionsStyle = (table) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        const meta = table.getMeta(td);
        td.classList.remove(AREA_CLIPBOARD_COPY_SELECTED_CLASS);
        td.classList.remove(AREA_CLIPBOARD_PASTE_SELECTED_CLASS);

        const copyMatch = AREA_CLIPBOARD_COPY_SELECTIONS.find(({x0, x1, y0, y1}) => x0 <= meta.x && meta.x <= x1 && y0 <= meta.y && meta.y <= y1);

        const pasteMatch = AREA_CLIPBOARD_PASTE_SELECTIONS.find(({x0, x1, y0, y1}) => x0 <= meta.x && meta.x <= x1 && y0 <= meta.y && meta.y <= y1);

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

Our `DataListener` generator uses some borrowed code from `two_billion_rows` and
extends the `return`ed `object` with `allData` - exposed to enable our `write`
`function`.

```javascript
function generateDataListener(num_rows, num_columns) {
    const allData = range(0, num_columns, (x) => range(0, num_rows, (y) => `${x}, ${y}`));
    return function dl(x0, y0, x1, y1) {
        return {
            num_rows,
            num_columns,
            data: allData.slice(x0, x1).map((col) => col.slice(y0, y1)),
            allData,
        };
    };
}
```

## On `"load"`

We will wire it all up on `"load"` by checking that the `table` exists on the `window`
then creating and setting our `DataListener`. We need to make sure that we
`addAreaMouseSelection()` and create a `write()` `function` for use in
`addAreaClipboardInteractions()`, and then we can `addAreaClipboardInteractions()`
and kick off a `draw()`.

```javascript
window.addEventListener("load", () => {
    const table = window.areaClipboardInteractionsRegularTable;
    if (table) {
        const dl = generateDataListener(50, 50);
        table.setDataListener(dl);

        addAreaMouseSelection(table);

        const write = (x, y, value) => {
            dl().allData[x][y] = value;
        };

        addAreaClipboardInteractions(table, dl, write);
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

The `two_billion_rows` example for the its helper `function`s.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
