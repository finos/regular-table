# Cell Selection

This example adds cell selection to a [`<regular-table>`](https://github.com/jpmorganchase/regular-table),
allowing the user to select groups of cells using the mouse.

... adding a `<regular-table>` to the page with an `id` that will be 
accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="cellSelectionRegularTable"></regular-table>
```

## Adding the behavior and  `StyleListener` with `addCellSelection()`

Lets start by making the cell selection behavior available via a single function,
`addCellSelection()`, that takes a `<regular-table>` and applies our behavior.

Mouse cell selection is a complex feature composed of a few events interacting
with some shared state. As users, we expect to left click a cell, hold the mouse
button down, move the mouse to another cell and then release, resulting in a table
showing the selected region.

In order to record the selected region, we will need the location of the cell when
the `mousedown` event is triggered and the location of the cell on `mouseup` which
we will add as a coordinate pair to a collection of `CELL_SELECTIONS`.
By holding the `ctrlKey` or `metaKey` while making selections, 
our users can make multiple `CELL_SELECTIONS` show at once.

Lets also add a `mouseover` `EventListener` to paint the selection as the user
moves the mouse - showing the region that would be selected on `mouseup`.

Finally, we'll need to ensure that the selection paints correctly as it scrolls
in and out of the visible table using a `StyleListener` that we will define later.

```javascript
let CELL_SELECTIONS = [];

const addCellSelection = (table) => {
    table.addEventListener("mousedown", getMousedownListener(table));
    table.addEventListener("mouseover", getMouseoverListener(table));
    table.addEventListener("mouseup", getMouseupListener(table));
    addCellSelectionStyleListener(table);
    return table;
};
```
## Listening to Mouse Events

We will need to share the `CURRENT_MOUSEDOWN_COORDINATES` to do some checks in each mouse `EventListener`.

```javascript
let CURRENT_MOUSEDOWN_COORDINATES = {};
```

Now for each of our mouse listeners, we'll need the `table` passed in from `addCellSelection()`,
so we will define each as a higher-order function creating a closure and keeping
the `table` argument available.

First we can create a `mousedown` `EventListener` by calling `getMousedownListener()` with the table. The listener function `return`ed will look up the coordinates of the `event.target` using `getMeta()` and update the `CURRENT_MOUSEDOWN_COORDINATES`.

It's also responsible for clearing the previous `CELL_SELECTIONS` if the user isn't holding the `ctrl` or `metaKey`.

```javascript
const getMousedownListener = (table) => (event) => {
    CURRENT_MOUSEDOWN_COORDINATES = {};
    const meta = table.getMeta(event.target);
    if (meta && meta.x !== undefined && meta.y !== undefined) {
        CURRENT_MOUSEDOWN_COORDINATES = {x: meta.x, y: meta.y};
    }
    if (!event.ctrlKey && !event.metaKey) {
        CELL_SELECTIONS = [];
    }
};
```
The `EventListener` returned for `mouseover` first checks that a valid `CURRENT_MOUSEDOWN_COORDINATES`
is set and then reapplies the cell selection with the `event.target`'s coordinates
 as the final coordinate pair - rendering the current potential selection.
```javascript
const getMouseoverListener = (table) => (event) => {
    if (CURRENT_MOUSEDOWN_COORDINATES.x !== undefined) {
        const meta = table.getMeta(event.target);
        if (meta && meta.x !== undefined && meta.y !== undefined) {
            const overCoord = {x: meta.x, y: meta.y};
            const potentialSelection = [CURRENT_MOUSEDOWN_COORDINATES, overCoord];
            reapplyCellSelections(table, CELL_SELECTIONS.concat([potentialSelection]));
        }
    }
};
```
Similarly, on `mouseup` we will need to capture the coordinates of the `event.target` and `push()` this new selection into `CELL_SELECTIONS`.

With our `CELL_SELECTIONS` up to date, we will reapply the cell selection then clear the `CURRENT_MOUSEDOWN_COORDINATES`.
```javascript
const getMouseupListener = (table) => (event) => {
    const meta = table.getMeta(event.target);
    if (CURRENT_MOUSEDOWN_COORDINATES.x !== undefined && meta.x !== undefined && meta.y !== undefined) {
        const upCoord = {x: meta.x, y: meta.y};
        CELL_SELECTIONS.push([CURRENT_MOUSEDOWN_COORDINATES, upCoord]);
        reapplyCellSelections(table);
    }
    CURRENT_MOUSEDOWN_COORDINATES = {};
};
```
Our `reapplyCellSelections()` will simply `remove()` the `CELL_SELECTED_CLASS` from all `td`s in the `table` and then iterate over the `cellSelections` reapplying the `CELL_SELECTED_CLASS`.
```javascript
const CELL_SELECTED_CLASS = "cell-selected";

const reapplyCellSelections = (table, cellSelections = CELL_SELECTIONS) => {
    const tds = table.querySelectorAll("tbody td");
    for (const td of tds) {
        td.classList.remove(CELL_SELECTED_CLASS);
    }

    for (const cs of cellSelections) {
        applyCellSelection(table, cs[0], cs[1]);
    }
};
```
Much like our `MetaData` `object`, we will use `x0` and `y0` to describe the upper
left corner and `x1` and `y1` for the lower right corner in the body of `applyCellSelection()`.
We need to select the `min()` `.x` between both up and down coordinates for our `x0` in 
case the user made their selection in reverse - applying similar logic for defining
`x1`, `y0` and `y1`. Then we can iterate through the `td`s in the `table` adding 
the `CELL_SELECTED_CLASS` if the `td`'s metadata falls within the rectangular region
defined by those coordinates.
```javascript

const applyCellSelection = (table, mousedownCoord, mouseupCoord) => {
    const tds = table.querySelectorAll("tbody td");
    if (mousedownCoord.x !== undefined && mousedownCoord.y !== undefined && mouseupCoord.x !== undefined && mouseupCoord.y !== undefined) {
        const x0 = Math.min(mousedownCoord.x, mouseupCoord.x);
        const x1 = Math.max(mousedownCoord.x, mouseupCoord.x);
        const y0 = Math.min(mousedownCoord.y, mouseupCoord.y);
        const y1 = Math.max(mousedownCoord.y, mouseupCoord.y);

        for (const td of tds) {
            const meta = table.getMeta(td);
            if (x0 <= meta.x && meta.x <= x1) {
                if (y0 <= meta.y && meta.y <= y1) {
                    td.classList.add(CELL_SELECTED_CLASS);
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
regular-table tbody tr td.cell-selected {
    background-color: #ffbbbb; /* red */
}
```
## `StyleListener`
And we can't forget about our `StyleListener` to ensure that the `table` reapplies
the selection as we scroll the grid - otherwise the selection will follow us around.
```javascript
const addCellSelectionStyleListener = (table) => {
    table.addStyleListener(() => reapplyCellSelections(table));
};
```
## `init()`
We can add an `init()` to this example to wire up the `DataListener` borrowed from `two_billion_rows` and then we simply addCellSelection() to the `table` and `draw()`.

All of this will be invoked on `"load"`.
```javascript
function init() {
    const table = window.cellSelectionRegularTable;
    if (table) {
        table.setDataListener(window.dataListener);
        addCellSelection(table).draw();
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
