// # Simple Example

import "/dist/esm/regular-table.js";

// Let's start with with a simple data model, a two dimensional `Array`. This one
// is very small at 3 columns x 26 rows, but even for very small data sets,
// `regular-table` won't read your entire dataset at once. Instead, we'll need to
// write a simple _virtual_ data model to access `DATA` and `COLUMN_NAMES`
// indirectly.

const DATA = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
];

// When clipped by the scrollable viewport, you may end up with a `<table>` of just
// a rectangular region of `DATA`, rather than the entire set. A simple viewport
// 2x2 may yield this `<table>`:
//
// ```html
// <table>
//      <tbody>
//          <tr>
//              <td>0</td>
//              <td>A</td>
//          </tr>
//          <tr>
//              <td>1</td>
//              <td>B</td>
//          </tr>
//      </tbody>
// </table>
// ```
//
// ```json
// {
//     "num_rows": 15,
//     "num_columns": 3,
//     "data": [
//         [0, 1],
//         ["A", "B"]
//     ]
// }
// ```

export function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: DATA[0].length,
        num_columns: DATA.length,
        data: DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
}

window.regularTable.setDataListener(dataListener);
window.regularTable.draw();
