# Fixed Column Widths

This example shows how to set up columns with fixed widths in
[`regular-table`](https://github.com/jpmorganchase/regular-table) just using
Javascript and CSS rules.

The default behaviour that regular-table implements for this feature includes:
* The default width of the cells corresponding to a column is calculated
taking into account the size of the content of the visible cells for that column.
* It is only possible to increase the width of a cell up to the size of the
content currently visible for that column.
* It is possible to manually shrink the column width up to the limit of 10 pixels.
* Column widths are calculated by the library using the max-width css rule. Which
means that settings the max-width from a css rule will lead to a fixed width
behavior for the cells of that column.

We need a `<regular-table>` with an `id` that will be accessible on the window
object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="fixedColumnWidthsRegularTable"></regular-table>
```

## Styling

description here

```css
.fixed {
    min-width: 100px !important;
    max-width: 100px !important;
}

thead tr th {
    user-select: none;
}

tr th, tr td {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
```

## Data Model

description here

``` javascript
class CreateDataModel {
    constructor(baseColumns, columnCount, cellCount) {
        this._baseColumns = baseColumns;
        this._columnCount = columnCount;
        this._cellCount = cellCount;
        this._dataset = this._createDataset();
        this.columns = this._createColumns();
        this._data = this.columns.map(({key}) => this._dataset[key]);
        this._columnHeaders = this.columns.map(({value}) => [value]);
    }

    _createTextCells(text) {
        return Array.from(Array(this._cellCount).keys()).map((idx) => `${text} ${idx}`);
    }

    _createColumns() {
        return Array.from(Array(this._columnCount)).map((_, idx) => {
            const key = this._baseColumns[idx % this._baseColumns.length];
            return {
                key,
                value: `${key} Column ${idx}`,
            };
        });
    }

    _createDataset() {
        return this._baseColumns.reduce(
            (prev, curr) => ({
                ...prev,
                [curr]: this._createTextCells(curr),
            }),
            {}
        );
    }

    dataListener = (x0, y0, x1, y1) => {
        const data = this._data.slice(x0, x1).map((col) => col.slice(y0, y1));
        const column_headers = this._columnHeaders.slice(x0, x1);
        const num_columns = this._data.length;
        const num_rows = this._data[0].length;
        return {
            num_rows,
            num_columns,
            column_headers,
            data,
        };
    };
}

const baseColumns = ["Fixed", "Not Set"];
const columnCount = 20;
const cellCount = 1000;

const dataModel = new CreateDataModel(baseColumns, columnCount, cellCount);
```

## Behavior

description here

``` javascript
const FIXED_CLASS = "fixed";

// Clear previous cell manipulations done by this api.
function clear(cellElement) {
    cellElement.classList.remove(FIXED_CLASS);
    cellElement.style.minWidth = "";
}

function getColumnName(index) {
    return dataModel.columns[index].key;
}

// Check if cell should apply fixed min-width.
function isFixed(cellElement) {
    // Use regular-table api to get cell metadata.
    const metadata = window.fixedColumnWidthsRegularTable.getMeta(cellElement);
    const name = getColumnName(metadata.x);
    return name.includes("Fixed");
}

// Add "fixed" class to cell element.
function setFixedClass(cellElement) {
    cellElement.classList.add(FIXED_CLASS);
}

// Set fixed min-width to cells when appropiate.
function styleListener() {
    const ths = window.fixedColumnWidthsRegularTable.querySelectorAll("thead th");
    const tds = window.fixedColumnWidthsRegularTable.querySelectorAll("tbody td");
    // Iterate over all rendered cells.
    for (const cellElement of [...ths, ...tds]) {
        clear(cellElement);
        if (isFixed(cellElement)) setFixedClass(cellElement);
    }
}

```

With our `init()` we will call `generateDataListener()` to create a `DataListener`
and call `setDataListener()` with it giving our example a reasonable amount of
data to test.

Next we'll call our .... `#fixedColumnWidthsRegularTable`
and then invoke `draw()` - checking that the `#fixedColumnWidthsRegularTable`
exists first.

This will all be fired on `"load"`.

```javascript
function init() {
    if (window.fixedColumnWidthsRegularTable) {
        window.fixedColumnWidthsRegularTable.setDataListener(dataModel.dataListener);
        window.fixedColumnWidthsRegularTable.addStyleListener(styleListener);
        window.fixedColumnWidthsRegularTable.draw();
    }
}

window.addEventListener("load", () => init());
```

## Appendix (Dependencies)

And of course we'll need the libraries.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```
