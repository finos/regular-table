// # Fixed Column Widths
//
// This example shows how to set up columns with fixed widths in
// [`regular-table`](https://github.com/finos/regular-table) just using Javascript
// and CSS rules.
//
// By default `<regular-table>` sets each column's width based on the content width
// of each of that column's cells. Currently, each column's width will not increase
// past the max width of the column's content, but you can manually shrink the
// column width up to the limit of 10 pixels. Column widths are calculated by the
// library using the max-width css rule meaning that setting the `max-width` from a
// css rule will lead to a fixed width behavior for the cells of that column.
//
// To start, we need a `<regular-table>` with an `id` that will be accessible on
// the window object using
// [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).
//
// ## Adding a `StyleListener` with `fixColumnWidths()`
//
// In our `fixColumnWidths()` function, we apply a `StyleListener` to the
// `<regular-table>` that iterates through each of the visible cells and adding or
// removing the `FIXED_COLUMN_WIDTH_CLASS` based on our `isFixed()` param.
//
// The `isFixed()` parameter supplied should be a predicate function that given a
// the `table` and a `cell` determines if the cell is in a fixed column by
// returning `true` or `false`.

const FIXED_COLUMN_WIDTH_CLASS = "fixed-column-width";
const fixColumnWidths = (table, isFixed) => {
    function clear(cell) {
        cell.classList.remove(FIXED_COLUMN_WIDTH_CLASS);
        cell.style.minWidth = "";
    }

    function styleListener() {
        table.invalidate();
        const ths = table.querySelectorAll("thead th");
        const tds = table.querySelectorAll("tbody td");
        for (const cell of [...ths, ...tds]) {
            clear(cell);
            if (isFixed(table, cell)) {
                cell.classList.add(FIXED_COLUMN_WIDTH_CLASS);
            }
        }
    }

    table.addStyleListener(styleListener);
    return table;
};

// We'll need a predicate to pass in as an argument to `fixColumnWidths()` that
// will determine if the cell passed in `isFixed()`. For the purposes of this
// example, we'll check to see if the given cell's value contains `"Fixed"`, but
// this function could reference the `DataModel` or some other logic to make its
// decision.

function isFixed(table, cell) {
    const value = table.getMeta(cell).value;
    return value.includes("Fixed");
}

// ## DataModel
//
// Our `DataModel` will generate a data set with alternating `"Fixed"` and
// `"Not Set"` values ensuring a mix of columns for testing in our example.

class DataModel {
    constructor(columnCount, cellCount) {
        this._baseColumns = ["Fixed", "Not Set"];
        this._columnCount = columnCount;
        this._cellCount = cellCount;
        this._dataset = this._createDataset();
        this.columns = this._createColumns();
        this._data = this.columns.map(({ key }) => this._dataset[key]);
        this._columnHeaders = this.columns.map(({ value }) => [value]);
        this.dataListener = (x0, y0, x1, y1) => {
            const data = this._data
                .slice(x0, x1)
                .map((col) => col.slice(y0, y1));
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
    _createTextCells(text) {
        return Array.from(Array(this._cellCount).keys()).map(
            (idx) => `${text} ${idx}`,
        );
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
            {},
        );
    }
}

// Within our `init()` we will create a `DataModel` and call `setDataListener()`
// with its `DataListener`, giving our example a reasonable amount of data to test.
//
// Next we'll call our `fixColumnWidths()` function with the
// `#fixedColumnWidthsRegularTable` and our `isFixed()` predicate to decorate
// `<regular-table>` with our `StyleListener` and then invoke `draw()`.
//
// This will all be fired on `"load"`.

function init() {
    const table = window.fixedColumnWidthsRegularTable;
    if (table) {
        const dataModel = new DataModel(20, 1000);
        table.setDataListener(dataModel.dataListener);
        fixColumnWidths(table, isFixed).draw();
    }
}

window.addEventListener("load", () => init());
