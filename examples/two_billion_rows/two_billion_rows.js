// # Two Billion Rows
//
// An example of a [`regular-table`](https://github.com/finos/regular-table) data
// model which generates data on-the-fly to simulate a 2,000,000,000 row `<table>`.

import "/dist/esm/regular-table.js";

// ## Virtual Data Model
//
// To simulate a _really big_ data set, this model will take advantage of the
// `regular-table` Virtual Data Model to generate data only for the window
// currently visible on screen. This is how _really big_:

const NUM_ROWS = 2000000000;
const NUM_COLUMNS = 1000;

// The `dataListener` function for this virtual data set is simple, and returns the
// static dimensions directly:

export function dataListener(num_rows, num_columns) {
    return (x0, y0, x1, y1) => ({
        num_rows,
        num_columns,
        row_headers: range(y0, y1, group_header.bind(null, "Row")),
        column_headers: range(x0, x1, group_header.bind(null, "Column")),
        data: range(x0, x1, (x) =>
            range(y0, y1, (y) => formatter.format(x + y)),
        ),
    });
}

// It makes copious use of the `range()` function, which generates a sequence from
// [`x0` .. `x1`], mapped by the function argument `f()`.

function range(x0, x1, f) {
    return Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));
}

// Generated row and column headers, as well as header groups for every group of
// 10, are also done on demand via `group_header()`, this time using the `clamp()`
// function.

function group_header(name, i) {
    const group = clamp(i, 10);
    return [`Group ${group}`, `${name} ${formatter.format(i)}`];
}

// `clamp()` formats a number `x` to it's nearest `y`

const clamp = (x, y) => formatter.format(Math.floor(x / y) * y);

// ## `regular-table` Initialization
//
// With these, all that's left is to register the `dataListener` and draw the
// `<table>`.

export function load() {
    const table = document.getElementsByTagName("regular-table")[0];
    const dl = dataListener(NUM_ROWS, NUM_COLUMNS);
    table.setDataListener(dl);
    table.draw();
}

// ## Appendix (Utilities)
//
// A formatter for Numbers:

const formatter = new Intl.NumberFormat("en-us");
