# Rectangular Area Selection

Mouse area selection is a complex feature composed of a few events interacting with some shared state. As users, we expect to left click a cell, hold the mouse button down, move the mouse to another cell and then release, resulting in a table showing the selected region. In order to record the selected area, we will need the location of the cell when the `"mousedown"` event is triggered and the location of the cell on `"mouseup"` which we will add as a coordinate pair.

By holding the `ctrlKey` or `metaKey` while making selections, our users can make multiple selections show at once. Lets also add a `"mouseover"` `EventListener` to paint the selection as the user moves the mouse - showing the region that would be selected on `"mouseup"`. Finally, we'll need to ensure that the selection paints correctly as it scrolls in and out of the visible table using a `StyleListener` that we will define later.

# API

```html
<regular-table id="example_table"></regular-table>
```

We can load default selections to this example and wire up the `DataListener` borrowed from `two_billion_rows`, and then we simply `addAreaMouseSelection()` to the `table` and `draw()`.

```html
<script type="module">
    import { addAreaMouseSelection } from "./index.js";
    import { dataListener } from "https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/examples/two_billion_rows.js";

    window.addEventListener("load", () => {
        example_table.setDataListener(dataListener(1000, 50));
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

## `addAreaMouseSelection()`

Lets start by making the area selection behavior available via a single function, `addAreaMouseSelection()`, that takes a `<regular-table>` and applies our behavior.

```javascript
const PRIVATE = Symbol("Area Mouse Selection");
const MOUSE_SELECTED_AREA_CLASS = "mouse-selected-area";

export const addAreaMouseSelection = (
    table,
    { className = MOUSE_SELECTED_AREA_CLASS, selected = [] } = {}
) => {
    table[PRIVATE] = { selected_areas: selected };
    table.addEventListener("mousedown", getMousedownListener(table));
    table.addEventListener("mouseover", getMouseoverListener(table, className));
    table.addEventListener("mouseup", getMouseupListener(table, className));
    table.addStyleListener(() => applyMouseAreaSelections(table, className));
    return table;
};
```

## Listening to Mouse Events

For each of our mouse listeners, we'll need the `table` passed in from `addAreaMouseSelection()`, so we will define each as a higher-order function creating a closure and keeping the `table` argument available. First we can create a `"mousedown"` `EventListener` by calling `getMousedownListener()` with the table. The listener function `return`ed will look up the coordinates of the `event.target` using `getMeta()` and update the `CURRENT_MOUSEDOWN_COORDINATES`. It's also responsible for clearing the previous `selected_areas` if the user isn't holding the `ctrl` or `metaKey`.

```javascript
const getMousedownListener = (table) => (event) => {
    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = {};
    const meta = table.getMeta(event.target);
    if (meta && meta.x !== undefined && meta.y !== undefined) {
        table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = { x: meta.x, y: meta.y };
    }

    if (!event.ctrlKey && !event.metaKey) {
        table[PRIVATE].selected_areas = [];
    }
};
```

The `EventListener` returned for `"mouseover"` first checks that a valid `CURRENT_MOUSEDOWN_COORDINATES` is set and then reapplies the cell selection with the `event.target`'s coordinates used to calculate the `potentialSelection`.

```javascript
const getMouseoverListener = (table, className) => (event) => {
    if (
        table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES &&
        table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x !== undefined
    ) {
        const meta = table.getMeta(event.target);
        if (meta && meta.x !== undefined && meta.y !== undefined) {
            const potentialSelection = {
                x0: Math.min(
                    meta.x,
                    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x
                ),
                x1: Math.max(
                    meta.x,
                    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x
                ),
                y0: Math.min(
                    meta.y,
                    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y
                ),
                y1: Math.max(
                    meta.y,
                    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y
                ),
            };
            applyMouseAreaSelections(
                table,
                className,
                table[PRIVATE].selected_areas.concat([potentialSelection])
            );
        }
    }
};
```

Similarly, on `"mouseup"` we will need to capture the coordinates of the `event.target` and `push()` this new selection into `selected_areas`. With our `selected_areas` up to date, we will reapply the selection then clear the `CURRENT_MOUSEDOWN_COORDINATES`.

```javascript
const getMouseupListener = (table, className) => (event) => {
    const meta = table.getMeta(event.target);
    if (
        table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES &&
        table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x !== undefined &&
        meta.x !== undefined &&
        meta.y !== undefined
    ) {
        const selection = {
            x0: Math.min(
                meta.x,
                table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x
            ),
            x1: Math.max(
                meta.x,
                table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x
            ),
            y0: Math.min(
                meta.y,
                table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y
            ),
            y1: Math.max(
                meta.y,
                table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y
            ),
        };
        table[PRIVATE].selected_areas.push(selection);
        applyMouseAreaSelections(table, className);
    }
    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = {};
};
```

Our `applyMouseAreaSelections()` will simply `remove()` the `className` from all `td`s in the `table` and then iterate over the `areaSelections` reapplying the `className`.

```javascript
export const applyMouseAreaSelections = (table, className, selected) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        td.classList.remove(className);
    }
    selected = selected || table[PRIVATE].selected_areas;
    for (const as of selected) {
        applyMouseAreaSelection(table, as, className);
    }
};
```

Much like our `MetaData` `object`, we will use `x0` and `y0` to describe the upper left corner and `x1` and `y1` for the lower right corner in the body of `applyMouseAreaSelection()`. We can iterate through the `td`s in the `table` adding the `className` if the `td`'s metadata falls within the rectangular region defined by those coordinates.

```javascript
const applyMouseAreaSelection = (table, { x0, x1, y0, y1 }, className) => {
    const tds = table.querySelectorAll("tbody td");
    if (
        x0 !== undefined &&
        y0 !== undefined &&
        x1 !== undefined &&
        y1 !== undefined
    ) {
        for (const td of tds) {
            const meta = table.getMeta(td);
            if (x0 <= meta.x && meta.x <= x1) {
                if (y0 <= meta.y && meta.y <= y1) {
                    td.classList.add(className);
                }
            }
        }
    }
};
```

## Styling

By default the `user-select` style is applied, lets get rid of it for our `td`s.

```css
regular-table tbody tr td {
    user-select: none;
}
```

And we'll need to style the selection to make it look nice for the end user.

```css
regular-table tbody tr td.mouse-selected-area {
    background-color: #2771a8;
    color: white;
}
```

## Appendix (Dependencies)

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css" />
```

```block
license: apache-2.0
```

