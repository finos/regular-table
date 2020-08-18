# Keyboard Navigation

...

```html
<regular-table id="keyboardNavigationRegularTable"></regular-table>
```
## Styling

...

```css
regular-table tbody tr th {
    user-select: none;
}
regular-table thead tr th {
    user-select: none;
}

regular-table tbody tr td.keyboard-selected-area {
    background-color: rgb(0, 0, 255, 0.15); /* blue */
}

regular-table tbody tr td.single-cell-selected {
    background-color: rgb(255, 0, 0, 0.25); /* red */
}

regular-table tbody tr td.single-cell-selected.keyboard-selected-area {
    background-color: rgb(128, 0, 128, 0.33); /* violet */
}

td {
    outline: none;
    border-right: 1px solid #eee;
    border-bottom: 1px solid #eee;
    min-width: 22px;
}
```
...

```javascript
const SINGLE_CELL_SELECTED_CLASS = "single-cell-selected";
const KEYBOARD_SELECTED_AREA_CLASS = "keyboard-selected-area";

let KEYBOARD_SELECTED_AREA = {};
const SELECTED_POSITION = {x: 0, y: 0};

const reapplyKeyboardArea = (table) => {
    const tds = table.querySelectorAll("td");

    for (const td of tds) {
        const meta = table.getMeta(td);

        if (KEYBOARD_SELECTED_AREA.x0 <= meta.x && meta.x <= KEYBOARD_SELECTED_AREA.x1 && KEYBOARD_SELECTED_AREA.y0 <= meta.y && meta.y <= KEYBOARD_SELECTED_AREA.y1) {
            td.classList.add(KEYBOARD_SELECTED_AREA_CLASS);
        } else {
            td.classList.remove(KEYBOARD_SELECTED_AREA_CLASS);
        }
    }
};

const updateFocus = (table, selectAll) => {
    function selectElementContents(el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    const tds = table.querySelectorAll("td");

    for (const td of tds) {
        td.setAttribute("contenteditable", true);
        const meta = table.getMeta(td);

        if (meta.x === SELECTED_POSITION.x && meta.y === SELECTED_POSITION.y) {
            td.classList.add(SINGLE_CELL_SELECTED_CLASS);
            td.focus();
            if (selectAll) {
                selectElementContents(td);
            }
        } else {
            td.classList.remove(SINGLE_CELL_SELECTED_CLASS);
        }
    }
    reapplyKeyboardArea(table);
};

const getSelection = (table) => {
    return document.activeElement || table.querySelector(`td.${SINGLE_CELL_SELECTED_CLASS}`);
};

const addKeyboardNavigation = (table, dl, write, editable = true) => {
    table.addEventListener("scroll", () => {
        const meta = table.getMeta(document.activeElement);
        if (meta && write) {
            write(meta.x, meta.y, document.activeElement.textContent);
        } else {
        }
    });

    table.addEventListener("focusout", (event) => {
        const meta = table.getMeta(event.target);
        if (meta && write) {
            write(meta.x, meta.y, event.target.textContent);
        } else {
        }
    });

    async function moveSelection(active_cell, dx, dy) {
        const numCols = dl().num_columns;
        const numRows = dl().num_rows;

        const meta = table.getMeta(active_cell);

        const x0 = typeof KEYBOARD_SELECTED_AREA.x0 === "number" ? KEYBOARD_SELECTED_AREA.x0 : SELECTED_POSITION.x;
        const x1 = typeof KEYBOARD_SELECTED_AREA.x1 === "number" ? KEYBOARD_SELECTED_AREA.x1 : SELECTED_POSITION.x;
        const y0 = typeof KEYBOARD_SELECTED_AREA.y0 === "number" ? KEYBOARD_SELECTED_AREA.y0 : SELECTED_POSITION.y;
        const y1 = typeof KEYBOARD_SELECTED_AREA.y1 === "number" ? KEYBOARD_SELECTED_AREA.y1 : SELECTED_POSITION.y;

        const areaSelection = {
            x0,
            x1,
            y0,
            y1,
        };

        if (dx !== 0) {
            if (meta.x + dx < numCols && 0 <= meta.x + dx) {
                const x = meta.x + dx;
                areaSelection.x0 = Math.min(areaSelection.x0, areaSelection.x1, x);
                areaSelection.x1 = Math.max(areaSelection.x0, areaSelection.x1, x);
                SELECTED_POSITION.x = x;
            }
            if (meta.x1 <= SELECTED_POSITION.x + 3) {
                await table.scrollToCell(meta.x0 + 2, meta.y0, numCols, numRows);
            } else if (SELECTED_POSITION.x < meta.x0) {
                if (0 < meta.x0 - 1) {
                    await table.scrollToCell(meta.x0 - 1, meta.y0, numCols, numRows);
                } else {
                    await table.scrollToCell(0, meta.y0, numCols, numRows);
                }
            }
        }

        if (dy !== 0) {
            if (meta.y + dy < numRows && 0 <= meta.y + dy) {
                const y = meta.y + dy;
                areaSelection.y0 = Math.min(areaSelection.y0, areaSelection.y1, y);
                areaSelection.y1 = Math.max(areaSelection.y0, areaSelection.y1, y);
                SELECTED_POSITION.y = y;
            }
            if (meta.y1 <= SELECTED_POSITION.y) {
                await table.scrollToCell(meta.x0, meta.y0 + 1, numCols, numRows);
            } else if (SELECTED_POSITION.y < meta.y0) {
                if (0 < meta.y0 - 1) {
                    await table.scrollToCell(meta.x0, meta.y0 - 1, numCols, numRows);
                } else {
                    await table.scrollToCell(meta.x0, 0, numCols, numRows);
                }
            }
        }
        updateFocus(table, true, editable);
        console.error("KEYBOARD_SELECTED_AREA", KEYBOARD_SELECTED_AREA);
        return areaSelection;
    }

    table.addEventListener("keypress", (event) => {
        const target = getSelection(table);

        if (event.keyCode === 13) {
            event.preventDefault();
            if (event.shiftKey) {
                moveSelection(target, 0, -1);
                event.preventDefault();
                event.stopPropagation();
            } else {
                moveSelection(target, 0, 1);
                event.preventDefault();
                event.stopPropagation();
            }
        }
    });

    table.addEventListener("keydown", async (event) => {
        const target = getSelection(table);

        let area;
        switch (event.keyCode) {
            // tab
            case 9:
                event.preventDefault();
                if (event.shiftKey) {
                    moveSelection(target, -1, 0);
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    moveSelection(target, 1, 0);
                    event.preventDefault();
                    event.stopPropagation();
                }
                break;
            // left arrow
            case 37:
                area = await moveSelection(target, -1, 0);
                event.preventDefault();
                event.stopPropagation();
                break;
            // up arrow
            case 38:
                area = await moveSelection(target, 0, -1);
                event.preventDefault();
                event.stopPropagation();
                break;
            // right arrow
            case 39:
                area = await moveSelection(target, 1, 0);
                event.preventDefault();
                event.stopPropagation();
                break;
            // down arrow
            case 40:
                area = await moveSelection(target, 0, 1);
                event.preventDefault();
                event.stopPropagation();
                break;
        }
        if (event.shiftKey && area) {
            KEYBOARD_SELECTED_AREA = area;
            updateFocus(table, true, editable);
        } else if (!event.metaKey && !event.ctrlKey) {
            if (area) {
                MOUSE_SELECTED_AREAS = [];
                AREA_CLIPBOARD_COPY_SELECTIONS = [];
                AREA_CLIPBOARD_PASTE_SELECTIONS = [];
                AREA_CLIPBOARD_COPIED_DATA = [];
            }

            KEYBOARD_SELECTED_AREA = {};
            reapplyKeyboardArea(table);
        }
    });

    const makeSingleSelect = (event) => {
        const meta = table.getMeta(event.target);
        if (meta) {
            SELECTED_POSITION.x = meta.x;
            SELECTED_POSITION.y = meta.y;
            updateFocus(table, false, editable);
        }
    };

    table.addEventListener("click", makeSingleSelect);
    table.addEventListener("mousedown", makeSingleSelect);

    addKeyboardNavigationStyleListener(table);
    return table;
};

const addKeyboardNavigationStyleListener = (table) => {
    table.addStyleListener(() => {
        updateFocus(table, false, true);
    });
};

function generateDataListener(num_rows, num_columns) {
    function to_column_name(i, letter) {
        return Array(i).fill(letter).join("");
    }

    function generate_column_names() {
        const nums = Array.from(Array(26));
        const alphabet = nums.map((val, i) => String.fromCharCode(i + 65));
        let caps = [],
            i = 1;
        while (caps.length < num_columns) {
            caps = caps.concat(alphabet.map((letter) => to_column_name(i, letter)));
            i++;
        }
        return caps;
    }

    const column_names = generate_column_names();

    const allData = Array(num_columns)
        .fill()
        .map(() => Array(num_rows).fill("jjfjfjfjfjjfjfjjfjjfjfjjfjjfjfj"));

    return function dl(x0 = 0, y0 = 0, x1 = 0, y1 = 0) {
        return {
            num_rows,
            num_columns,
            row_headers: range(y0, y1, group_header.bind(null, "Row")),
            column_headers: range(x0, x1, group_header.bind(null, "Column")),
            data: allData.slice(x0, x1).map((col) => col.slice(y0, y1)),
            allData,
        };
    };
}

window.addEventListener("load", () => {
    const table = window.keyboardNavigationRegularTable;
    if (table) {
        const dl = generateDataListener(50, 50);
        const write = (x, y, value) => {
            dl().allData[x][y] = value;
        };

        addKeyboardNavigation(table, dl, write, true);
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
