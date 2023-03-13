const DATA = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"], Array.from(Array(15).keys()).map(value => value % 2 === 0)];
export function dataListener(x0, y0, x1, y1) {
  return {
    num_rows: DATA[0].length,
    num_columns: DATA.length,
    data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
  };
}
export function init() {
  window.regularTable.setDataListener(dataListener);
  window.regularTable.draw();
}
//# sourceMappingURL=2d_array.js.map