# A 3D Array Example

This will help you to learn how to implement the concept of `<regular-table>` for 3D arrays.
There is already a step-by-step procedure showing how to display a [2d_array](https://github.com/jpmorganchase/regular-table/blob/master/examples/2d_array.md).

For understanding the visualization of a 3D array, the first thing is to have a sample data with three dimensions. The sample 3D data can created as follows:

```
const DATA = [
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [
      "A1",
      "B1",
      "C1",
      "D1",
      "E1",
      "F1",
      "G1",
      "H1",
      "I1",
      "J1",
      "K1",
      "L1",
      "M1",
      "N1",
      "O1",
    ],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
    Array.from(Array(15).keys()).map((value) => (value + 1) * 2),
    Array.from(Array(15).keys()).map((value) => (value + 1) ** 2),
  ],
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [
      "A2",
      "B2",
      "C2",
      "D2",
      "E2",
      "F2",
      "G2",
      "H2",
      "I2",
      "J2",
      "K2",
      "L2",
      "M2",
      "N2",
      "O2",
    ],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
    Array.from(Array(15).keys()).map((value) => (value + 1) * 2),
    Array.from(Array(15).keys()).map((value) => (value + 1) ** 2),
  ],
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [
      "A3",
      "B3",
      "C3",
      "D3",
      "E3",
      "F3",
      "G3",
      "H3",
      "I3",
      "J3",
      "K3",
      "L3",
      "M3",
      "N3",
      "O3",
    ],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
    Array.from(Array(15).keys()).map((value) => (value + 1) * 2),
    Array.from(Array(15).keys()).map((value) => (value + 1) ** 2),
  ],
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [
      "A4",
      "B4",
      "C4",
      "D4",
      "E4",
      "F4",
      "G4",
      "H4",
      "I4",
      "J4",
      "K4",
      "L4",
      "M4",
      "N4",
      "O4",
    ],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
    Array.from(Array(15).keys()).map((value) => (value + 1) * 2),
    Array.from(Array(15).keys()).map((value) => (value + 1) ** 2),
  ],
  [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
    [
      "A5",
      "B5",
      "C5",
      "D5",
      "E5",
      "F5",
      "G5",
      "H5",
      "I5",
      "J5",
      "K5",
      "L5",
      "M5",
      "N5",
      "O5",
    ],
    Array.from(Array(15).keys()).map((value) => value % 2 === 0),
    Array.from(Array(15).keys()).map((value) => (value + 1) * 2),
    Array.from(Array(15).keys()).map((value) => (value + 1) ** 2),
  ],
];
```

A user defined HTML element or a any other HTML element is created that can be called through the javascript function for a unique identification.

```html
<tables></tables>
```

This tag `tables` can be called using the following javascript statement:

```javascript
const tables = document.getElementsByTagName("tables")[0];
```

A global variable is also declared for tracking the particular table of the dimension, here it is `num_table`.

```
var num_table; //Global variable to track the dimension number

function dataListener(x0, y0, x1, y1) {
  return {
    num_rows: DATA[num_table][0].length,
    num_columns: DATA[num_table].length,
    data: DATA[num_table].slice(x0, x1).map((col) => col.slice(y0, y1)),
  };
}
```

Further, for creating multiple tables for each dimension, the following function is created:

```
function createTables() {
  var num_tables = DATA.length;
  for (var i = 0; i < num_tables; i++) {
    // Dimension or table number
    num_table = i;

    // The <p> tag along with table number is displayed
    var num_table_text = document.createElement("p");
    num_table_text.innerHTML = "Table " + i;
    tables.appendChild(num_table_text);

    // The corresponding <regular-table> element are created
    var regular_table = document.createElement("regular-table");
    regular_table.setAttribute("tabindex", num_table);
    regular_table.style.top = 20 * (num_table + 1) + 250 * num_table + "px";
    regular_table.setAttribute("id", "tableid" + num_table); // Unique ID is given for each element
    tables.appendChild(regular_table);

    var table = document.getElementById("tableid" + num_table); // dataListener is set for each element
    table.setDataListener(dataListener);
    tables.appendChild(document.createElement("br"));
    table.draw();
  }
}
```

After the funciton is successfully created, the tables are needed to be displayed in a continuous manner, one dimension after the other, as shown below:

<tables>
<p>Table 1
<table>
<tbody>
<tr>
<td>0</td>
<td>A1</td>
</tr>
<tr>
<td>1</td>
<td>B1</td>
</tr>
</tbody>
</table>
<p> Table 2
<table>
<tbody>
<tr>
<td>0</td>
<td>A2</td>
</tr>
<tr>
<td>1</td>
<td>B2</td>
</tr>
</tbody>
</table>
<tables>

The CSS style must be changed in order to manipulate the output. One such style is:

```CSS
p {
    display: block;
    margin: 0;
    height: 250px;
    position: static;
}

td {
    color: #1078d1;
}

tbody th:last-of-type,
thead tr:nth-child(2) th:nth-child(2),
thead tr:first-child th:first-child {
    border-right: 1px solid #ddd;
}

regular-table {
    height: 250px;
    display: block;
}

regular-table div {
    position: static;
    height: auto;
}
```
