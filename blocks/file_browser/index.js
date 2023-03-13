function new_path(n, name) {
  return Array(n).fill("").concat([name]);
}

const COLUMNS = [["size"], ["kind"], ["modified"], ["writable"]];
const DATA = Array.from(generateDirContents());

function new_row(type) {
  const scale = Math.random() > 0.5 ? "kb" : "mb";
  const size = numberFormat(Math.pow(Math.random(), 2) * 1000);
  const date = dateFormat(new Date());
  return [`${size} ${scale}`, type, date, true];
}

function* generateDirContents(n = 0) {
  for (let i = 0; i < 5; i++) {
    yield {
      path: new_path(n, `Dir_${i}`),
      row: new_row("directory"),
      is_open: false
    };
  }

  for (let i = 0; i < 5; i++) {
    yield {
      path: new_path(n, `File_${i}`),
      row: new_row("file")
    };
  }
}

function closeDir(y) {
  const path = DATA[y].path;

  while (y + 2 < DATA.length && DATA[y + 1].path.length > path.length) {
    DATA.splice(y + 1, 1);
  }
}

function openDir(y) {
  const new_contents = generateDirContents(DATA[y].path.length);
  DATA.splice(y + 1, 0, ...Array.from(new_contents));
}

function toggleDir(y) {
  const {
    is_open
  } = DATA[y];

  if (is_open) {
    closeDir(y);
  } else {
    openDir(y);
  }

  DATA[y].is_open = !is_open;
}

function transpose(m) {
  return m.length === 0 ? [] : m[0].map((x, i) => m.map(x => x[i]));
}

function dataListener(x0, y0, x1, y1) {
  return {
    num_rows: DATA.length,
    num_columns: DATA[0].row.length,
    row_headers: DATA.slice(y0, y1).map(z => z.path.slice()),
    column_headers: COLUMNS.slice(x0, x1),
    data: transpose(DATA.slice(y0, y1).map(({
      row
    }) => row.slice(x0, x1)))
  };
}

function styleListener() {
  for (const td of window.regularTable.querySelectorAll("tbody th")) {
    const {
      y,
      value
    } = window.regularTable.getMeta(td);
    const {
      row,
      is_open
    } = DATA[y];
    const [, type] = row;
    td.classList.toggle("fb-directory", !!value && type === "directory");
    td.classList.toggle("fb-file", !!value && type === "file");
    td.classList.toggle("fb-open", !!value && is_open);
  }
} // TODO `resetAutoSize()` is not documented - this is currently required to
// prevent the column size scroll memoize functionality from pinning the sizes
// of the 'blank' cells, as these columns may be re-purposed as the user expands
// or collapses the tree.  But auto-sizing is not well formalized feature yet
// and this API is just a stand-in.


function mousedownListener() {
  if (event.target.tagName === "TH") {
    const meta = regularTable.getMeta(event.target);

    if (DATA[meta.y].row[1] === "directory") {
      toggleDir(meta.y);

      regularTable._resetAutoSize();

      regularTable.draw();
    }
  }
}

export function init() {
  regularTable.setDataListener(dataListener);
  regularTable.addStyleListener(styleListener);
  regularTable.addEventListener("mousedown", mousedownListener);
  regularTable.addEventListener("scroll", () => {
    regularTable._resetAutoSize();
  });
  regularTable.draw();
}

function numberFormat(x) {
  const formatter = new Intl.NumberFormat("en-us", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return formatter.format(x);
}

function dateFormat(x) {
  const formatter = new Intl.DateTimeFormat("en-us", {
    week: "numeric",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric"
  });
  return formatter.format(x);
}
//# sourceMappingURL=file_browser.js.map