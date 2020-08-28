# Area Selection using the Mouse

This example adds area selection to a [`<regular-table>`](https://github.com/jpmorganchase/regular-table),
allowing the user to select groups of cells using the mouse.

... adding a `<regular-table>` to the page with an `id` that will be 
accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="areaMouseSelectionRegularTable"></regular-table>
```

## `addAreaMouseSelection()`

Lets start by making the area selection behavior available via a single function,
`addAreaMouseSelection()`, that takes a `<regular-table>` and applies our behavior.

Mouse area selection is a complex feature composed of a few events interacting
with some shared state. As users, we expect to left click a cell, hold the mouse
button down, move the mouse to another cell and then release, resulting in a table
showing the selected region.

In order to record the selected area, we will need the location of the cell when
the `"mousedown"` event is triggered and the location of the cell on `"mouseup"` which
we will add as a coordinate pair to a collection of `MOUSE_SELECTED_AREAS`.
By holding the `ctrlKey` or `metaKey` while making selections, 
our users can make multiple selections show at once.

Lets also add a `"mouseover"` `EventListener` to paint the selection as the user
moves the mouse - showing the region that would be selected on `"mouseup"`.

Finally, we'll need to ensure that the selection paints correctly as it scrolls
in and out of the visible table using a `StyleListener` that we will define later.

```javascript
let MOUSE_SELECTED_AREAS = [];

const addAreaMouseSelection = (table) => {
    table.addEventListener("mousedown", getMousedownListener(table));
    table.addEventListener("mouseover", getMouseoverListener(table));
    table.addEventListener("mouseup", getMouseupListener(table));
    addAreaMouseSelectionStyleListener(table);
    return table;
};
```
## Listening to Mouse Events

We will need to share the `CURRENT_MOUSEDOWN_COORDINATES` to do some checks in each mouse `EventListener`.

```javascript
let CURRENT_MOUSEDOWN_COORDINATES = {};
```

Now for each of our mouse listeners, we'll need the `table` passed in from `addAreaMouseSelection()`,
so we will define each as a higher-order function creating a closure and keeping
the `table` argument available.

First we can create a `"mousedown"` `EventListener` by calling `getMousedownListener()` with the table. The listener function `return`ed will look up the coordinates of the `event.target` using `getMeta()` and update the `CURRENT_MOUSEDOWN_COORDINATES`.

It's also responsible for clearing the previous `MOUSE_SELECTED_AREAS` if the user isn't holding the `ctrl` or `metaKey`.

```javascript
const getMousedownListener = (table) => (event) => {
    CURRENT_MOUSEDOWN_COORDINATES = {};
    const meta = table.getMeta(event.target);
    if (meta && meta.x !== undefined && meta.y !== undefined) {
        CURRENT_MOUSEDOWN_COORDINATES = {x: meta.x, y: meta.y};
    }
    if (!event.ctrlKey && !event.metaKey) {
        MOUSE_SELECTED_AREAS = [];
    }
};
```
The `EventListener` returned for `"mouseover"` first checks that a valid `CURRENT_MOUSEDOWN_COORDINATES`
is set and then reapplies the cell selection with the `event.target`'s coordinates
 used to calculate the `potentialSelection`.
```javascript
const getMouseoverListener = (table) => (event) => {
    if (CURRENT_MOUSEDOWN_COORDINATES && CURRENT_MOUSEDOWN_COORDINATES.x !== undefined) {
        const meta = table.getMeta(event.target);
        if (meta && meta.x !== undefined && meta.y !== undefined) {
            const potentialSelection = {
                x0: Math.min(meta.x, CURRENT_MOUSEDOWN_COORDINATES.x),
                x1: Math.max(meta.x, CURRENT_MOUSEDOWN_COORDINATES.x),
                y0: Math.min(meta.y, CURRENT_MOUSEDOWN_COORDINATES.y),
                y1: Math.max(meta.y, CURRENT_MOUSEDOWN_COORDINATES.y),
            };
            reapplyMouseAreaSelections(table, MOUSE_SELECTED_AREAS.concat([potentialSelection]));
        }
    }
};
```
Similarly, on `"mouseup"` we will need to capture the coordinates of the `event.target` and `push()` this new selection into `MOUSE_SELECTED_AREAS`.

With our `MOUSE_SELECTED_AREAS` up to date, we will reapply the selection then clear the `CURRENT_MOUSEDOWN_COORDINATES`.
```javascript
const getMouseupListener = (table) => (event) => {
    const meta = table.getMeta(event.target);
    if (CURRENT_MOUSEDOWN_COORDINATES && CURRENT_MOUSEDOWN_COORDINATES.x !== undefined && meta.x !== undefined && meta.y !== undefined) {
        const selection = {
            x0: Math.min(meta.x, CURRENT_MOUSEDOWN_COORDINATES.x),
            x1: Math.max(meta.x, CURRENT_MOUSEDOWN_COORDINATES.x),
            y0: Math.min(meta.y, CURRENT_MOUSEDOWN_COORDINATES.y),
            y1: Math.max(meta.y, CURRENT_MOUSEDOWN_COORDINATES.y),
        };
        MOUSE_SELECTED_AREAS.push(selection);
        reapplyMouseAreaSelections(table);
    }
    CURRENT_MOUSEDOWN_COORDINATES = {};
};
```
Our `reapplyMouseAreaSelections()` will simply `remove()` the `MOUSE_SELECTED_AREA_CLASS`
from all `td`s in the `table` and then iterate over the `areaSelections` reapplying the
`MOUSE_SELECTED_AREA_CLASS`.
```javascript
const MOUSE_SELECTED_AREA_CLASS = "mouse-selected-area";

const reapplyMouseAreaSelections = (table, areaSelections = MOUSE_SELECTED_AREAS) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        td.classList.remove(MOUSE_SELECTED_AREA_CLASS);
    }

    for (const as of areaSelections) {
        applyMouseAreaSelection(table, as);
    }
};
```
Much like our `MetaData` `object`, we will use `x0` and `y0` to describe the upper
left corner and `x1` and `y1` for the lower right corner in the body of `applyMouseAreaSelection()`.
We can iterate through the `td`s in the `table` adding the `MOUSE_SELECTED_AREA_CLASS`
if the `td`'s metadata falls within the rectangular region defined by those coordinates.
```javascript
const applyMouseAreaSelection = (table, {x0, x1, y0, y1}) => {
    const tds = table.querySelectorAll("tbody td");
    if (x0 !== undefined && y0 !== undefined && x1 !== undefined && y1 !== undefined) {
        for (const td of tds) {
            const meta = table.getMeta(td);
            if (x0 <= meta.x && meta.x <= x1) {
                if (y0 <= meta.y && meta.y <= y1) {
                    td.classList.add(MOUSE_SELECTED_AREA_CLASS);
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
    background-color: #ffbbbb; /* red */
}
```
## `StyleListener`
And we can't forget about our `StyleListener` to ensure that the `table` reapplies
the selection as we scroll the grid - otherwise the selection will follow us around.
```javascript
const addAreaMouseSelectionStyleListener = (table) => {
    table.addStyleListener(() => reapplyMouseAreaSelections(table));
};
```
## `init()`
We can add an `init()` to this example to wire up the `DataListener` borrowed from
`two_billion_rows` and then we simply addAreaMouseSelection() to the `table` and `draw()`.

All of this will be invoked on `"load"`.
```javascript
function init() {
    const table = window.areaMouseSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addAreaMouseSelection(table).draw();
    }
}

window.addEventListener("load", () => init());
```

## Appendix (Dependencies)

Always...

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

Borrow a data model from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
