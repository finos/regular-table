import { dataListener } from "/dist/examples/two_billion_rows.js";

function setRegularTable(table) {
  table.setDataListener(dataListener(1000, 50));
  table.draw();
}

window.addEventListener("load", () => {
  const element = window.React.createElement("regular-table", {
    ref: setRegularTable
  });
  window.ReactDOM.render(element, window.root);
});
//# sourceMappingURL=react.js.map