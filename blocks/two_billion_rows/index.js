const NUM_ROWS = 2000000000;
const NUM_COLUMNS = 1000;
export function dataListener(num_rows, num_columns) {
  return (x0, y0, x1, y1) => ({
    num_rows,
    num_columns,
    row_headers: range(y0, y1, group_header.bind(null, "Row")),
    column_headers: range(x0, x1, group_header.bind(null, "Column")),
    data: range(x0, x1, x => range(y0, y1, y => formatter.format(x + y)))
  });
}

function range(x0, x1, f) {
  return Array.from(Array(x1 - x0).keys()).map(x => f(x + x0));
}

function group_header(name, i) {
  const group = clamp(i, 10);
  return [`Group ${group}`, `${name} ${formatter.format(i)}`];
}

const clamp = (x, y) => formatter.format(Math.floor(x / y) * y);

export function init() {
  const table = document.getElementsByTagName("regular-table")[0];
  const dl = dataListener(NUM_ROWS, NUM_COLUMNS);
  table.setDataListener(dl);
  table.draw();
}
const formatter = new Intl.NumberFormat("en-us");
//# sourceMappingURL=two_billion_rows.js.map