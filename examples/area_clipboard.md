# Clipboard

...

```html
<regular-table id="clipboardCopyPasteAreaRegularTable"></regular-table>
```
## Styling

...

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
Lets turn off the `user-select` style for this example too.
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

td {
    outline: none;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    min-width: 22px;
}
```
## Adding the Behaviors
```html
<script src="/dist/examples/area_mouse_selection.js"></script>
```

...

```javascript
let AREA_CLIPBOARD_COPY_SELECTIONS = [];
let AREA_CLIPBOARD_PASTE_SELECTIONS = [];
let AREA_CLIPBOARD_COPIED_DATA = [];

const eqArray = (a1, a2) => {
    if (!Array.isArray(a1) || !Array.isArray(a2) || a1.length !== a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        const eqArrays = Array.isArray(a1[i]) && Array.isArray(a2[i]) && eqArray(a1[i], a2[i]);
        if (!eqArrays && a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
};

const zip = (arr, ...arrs) => arr.map((val, i) => arrs.reduce((a, arr) => [...a, arr[i]], [val]));

const transpose = (m) => m[0].map((x, i) => m.map((x) => x[i]));

const addAreaClipboard = (table, dl, write) => {
    const areaClipboardSelectionData = () => {
        const data = AREA_CLIPBOARD_COPY_SELECTIONS.map(({x0, x1, y0, y1}) => dl(x0, y0, x1 + 1, y1 + 1).data);
        return data.map(transpose);
    };

    const setAreaClipboardSelections = () => {
        AREA_CLIPBOARD_COPY_SELECTIONS = MOUSE_SELECTED_AREAS.map(([p1, p2]) => {
            const x0 = Math.min(p1.x, p2.x);
            const x1 = Math.max(p1.x, p2.x);
            const y0 = Math.min(p1.y, p2.y);
            const y1 = Math.max(p1.y, p2.y);

            return {
                x0,
                x1,
                y0,
                y1,
            };
        });
    };

    const copy = async () => {
        setAreaClipboardSelections();
        AREA_CLIPBOARD_COPIED_DATA = areaClipboardSelectionData();
        const textSelections = AREA_CLIPBOARD_COPIED_DATA.map((area) => {
            return area.map((row) => row.join("\t")).join("\n");
        });
        try {
            await navigator.clipboard.writeText(textSelections[0]);
        } catch (e) {
            console.error("failed");
        }
        table.draw();
    };

    const parseClipboardTextExcel = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const rows = text.split(/\r\n|\n|\r/);
            return rows.length > 0 ? rows.map((r) => r.split("\t")) : r;
        } catch (e) {
            console.error("failed");
        }
    };

    const _paste = (data) =>
        zip(MOUSE_SELECTED_AREAS, data).map(([area, data]) => {
            const x0 = Math.min(area[0].x, area[1].x);
            const y0 = Math.min(area[0].y, area[1].y);

            if (data) {
                const x1 = x0 + data[0].length - 1;
                const y1 = y0 + data.length - 1;

                data.map((row, ridx) => {
                    row.map((value, cidx) => {
                        write(x0 + cidx, y0 + ridx, value);
                    });
                });
                AREA_CLIPBOARD_PASTE_SELECTIONS.push({x0, y0, x1, y1});
            }
        });

    const paste = async () => {
        AREA_CLIPBOARD_PASTE_SELECTIONS = [];
        const parsedData = await parseClipboardTextExcel();
        const useLocalData = eqArray(parsedData, AREA_CLIPBOARD_COPIED_DATA[0]);

        if (!parsedData || useLocalData) {
            const data = Array.from(Array(MOUSE_SELECTED_AREAS.length).keys()).flatMap(() => AREA_CLIPBOARD_COPIED_DATA);
            _paste(data);
        } else {
            const data = Array.from(Array(MOUSE_SELECTED_AREAS.length).keys()).map(() => parsedData);
            _paste(data);
        }
        await table.draw();
    };

    const cut = async () => {
        await copy();
        for (const {x0, x1, y0, y1} of AREA_CLIPBOARD_COPY_SELECTIONS) {
            for (var x = x0; x < x1 + 1; x++) {
                for (var y = y0; y < y1 + 1; y++) {
                    write(x, y, undefined);
                }
            }
        }
        table.draw();
    };

    const keyListener = (event) => {
        const meta = table.getMeta(event.target);
        switch (event.keyCode) {
            // C
            case 67:
                if (event.metaKey || event.ctrlKey) {
                    copy();
                }
                break;
            // V
            case 86:
                if (event.metaKey || event.ctrlKey) {
                    paste();
                }
                break;
            // X
            case 88:
                if (event.metaKey || event.ctrlKey) {
                    cut();
                }
                break;
        }
    };

    table.addEventListener("keydown", keyListener);
    addAreaClipboardSelectionStyleListener(table, dl);
    return table;
};

const AREA_CLIPBOARD_COPY_SELECTED_CLASS = "clipboard-copy-selected-area";
const AREA_CLIPBOARD_PASTE_SELECTED_CLASS = "clipboard-paste-selected-area";

const addAreaClipboardSelectionStyleListener = (table) => {
    table.addStyleListener(() => {
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
    });
};

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

window.addEventListener("load", () => {
    const table = window.clipboardCopyPasteAreaRegularTable;
    if (table) {
        const dl = generateDataListener(50, 50);

        const write = (x, y, value) => {
            dl().allData[x][y] = value;
        };

        addAreaMouseSelection(table);
        addAreaClipboard(table, dl, write);
        table.setDataListener(dl);
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
