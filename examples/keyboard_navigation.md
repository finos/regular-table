# Clipboard

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

regular-table tbody tr td.single-cell-selected {
    background-color: rgb(255, 0, 0, 0.25); /* red */
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

const updateFocus = (table, selectAll, editable = true) => {
    function selectElementContents(el) {
        var range = document.createRange();
        range.selectNodeContents(el);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    const tds = table.querySelectorAll("td");

    for (const td of tds) {
        td.setAttribute("contenteditable", editable);
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
    return table.querySelector(`td.${SINGLE_CELL_SELECTED_CLASS}`);
};

const addKeyboardNavigation = (table, write, editable = true) => {
    table.addEventListener("scroll", () => {
        const meta = table.getMeta(document.activeElement);
        if (meta) {
            write(meta.x, meta.y, document.activeElement.textContent);
        } else {
            console.error("no meta for ", document.activeElement.textContent);
        }
    });

    table.addEventListener("focusout", (event) => {
        const meta = table.getMeta(event.target);
        if (meta) {
            write(meta.x, meta.y, event.target.textContent);
        } else {
            console.error("no meta for ", event.target);
        }
    });

    const SCROLL_AHEAD = 4;

    function moveSelection(active_cell, dx, dy) {
        const meta = table.getMeta(active_cell);
        const areaSelection = {
            x0: KEYBOARD_SELECTED_AREA.x0 || SELECTED_POSITION.x,
            x1: KEYBOARD_SELECTED_AREA.x1 || SELECTED_POSITION.x,
            y0: KEYBOARD_SELECTED_AREA.y0 || SELECTED_POSITION.y,
            y1: KEYBOARD_SELECTED_AREA.y1 || SELECTED_POSITION.y,
        };

        if (dx !== 0) {
            if (meta.x + dx < NUM_COLUMNS && 0 <= meta.x + dx) {
                const x = meta.x + dx;
                areaSelection.x0 = Math.min(areaSelection.x0, areaSelection.x1, x);
                areaSelection.x1 = Math.max(areaSelection.x0, areaSelection.x1, x);
                SELECTED_POSITION.x = x;
            }
            if (meta.x1 <= SELECTED_POSITION.x + SCROLL_AHEAD) {
                table.scrollToCell(meta.x0 + 2, meta.y0, NUM_COLUMNS, NUM_ROWS);
            } else if (SELECTED_POSITION.x - SCROLL_AHEAD < meta.x0) {
                if (0 < meta.x0 - 1) {
                    table.scrollToCell(meta.x0 - 1, meta.y0, NUM_COLUMNS, NUM_ROWS);
                } else {
                    table.scrollToCell(0, meta.y0, NUM_COLUMNS, NUM_ROWS);
                }
            }
        }

        if (dy !== 0) {
            if (meta.y + dy < NUM_ROWS && 0 <= meta.y + dy) {
                const y = meta.y + dy;
                areaSelection.y0 = Math.min(areaSelection.y0, areaSelection.y1, y);
                areaSelection.y1 = Math.max(areaSelection.y0, areaSelection.y1, y);
                SELECTED_POSITION.y = y;
            }
            if (meta.y1 <= SELECTED_POSITION.y + SCROLL_AHEAD) {
                table.scrollToCell(meta.x0, meta.y0 + 1, NUM_COLUMNS, NUM_ROWS);
            } else if (SELECTED_POSITION.y - SCROLL_AHEAD + 2 < meta.y0) {
                if (0 < meta.y0 - 1) {
                    table.scrollToCell(meta.x0, meta.y0 - 1, NUM_COLUMNS, NUM_ROWS);
                } else {
                    table.scrollToCell(meta.x0, 0, NUM_COLUMNS, NUM_ROWS);
                }
            }
        }
        updateFocus(table, true, editable);
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

    table.addEventListener("keydown", (event) => {
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
                area = moveSelection(target, -1, 0);
                event.preventDefault();
                event.stopPropagation();
                break;
            // up arrow
            case 38:
                area = moveSelection(target, 0, -1);
                event.preventDefault();
                event.stopPropagation();
                break;
            // right arrow
            case 39:
                area = moveSelection(target, 1, 0);
                event.preventDefault();
                event.stopPropagation();
                break;
            // down arrow
            case 40:
                area = moveSelection(target, 0, 1);
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
                table.draw();
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
        updateFocus(table, false, false);
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
    const table = window.keyboardNavigationRegularTable;
    if (table) {
        const dl = generateDataListener(50, 50);

        addKeyboardNavigation(table);
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
