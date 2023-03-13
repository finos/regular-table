const NUM_COLUMNS = 200;
const NUM_ROWS = 1000;
const DATA = Array(NUM_COLUMNS).fill().map(() => Array(NUM_ROWS).fill());
const DATA_COLUMN_NAMES = generate_column_names();

function generate_column_names() {
  const nums = Array.from(Array(26));
  const alphabet = nums.map((val, i) => String.fromCharCode(i + 65));
  let caps = [],
      i = 1;

  while (caps.length < NUM_COLUMNS) {
    caps = caps.concat(alphabet.map(letter => to_column_name(i, letter)));
    i++;
  }

  return caps;
}

function to_column_name(i, letter) {
  return Array(i).fill(letter).join("");
}

function dataListener(x0, y0, x1, y1) {
  return {
    num_rows: DATA[0].length,
    num_columns: DATA.length,
    row_headers: Array.from(Array(Math.ceil(y1) - y0).keys()).map(y => [`${y + y0}`]),
    column_headers: DATA_COLUMN_NAMES.slice(x0, x1).map(x => [x]),
    data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
  };
}

const table = document.getElementsByTagName("regular-table")[0];
table.setDataListener(dataListener);

function sum(arr) {
  return flat(arr).reduce((x, y) => parseInt(x) + parseInt(y));
}

function avg(arr) {
  const x = flat(arr);
  return x.reduce((x, y) => parseInt(x) + parseInt(y)) / x.length;
}

function stringify(x, y) {
  let txt = DATA[x][y];
  let num = parseInt(txt);

  if (isNaN(num)) {
    num = txt;
  }

  return `${num}`;
}

function slice(x0, y0, x1, y1) {
  return DATA.slice(x0, parseInt(x1) + 1).map(z => z.slice(y0, parseInt(y1) + 1));
}

function col2Idx(x) {
  return DATA_COLUMN_NAMES.indexOf(x);
}

function flat(arr) {
  return arr.flat(1).map(x => parseInt(x)).filter(x => !isNaN(x));
}

const RANGE_PATTERN = "([A-Z]+)([0-9]+)\\.\\.([A-Z]+)([0-9]+)";
const CELL_PATTERN = "([A-Z]+)([0-9]+)";

function compile(input) {
  const output = input.slice(1).replace(new RegExp(RANGE_PATTERN, "g"), (_, x0, y0, x1, y1) => `slice(${col2Idx(x0)}, ${y0}, ${col2Idx(x1)}, ${y1})`).replace(new RegExp(CELL_PATTERN, "g"), (_, x, y) => `stringify(${col2Idx(x)}, ${y})`);
  console.log(`Compiled '${input}' to '${output}'`);
  return eval(output);
}

const SELECTED_POSITION = {
  x: 0,
  y: 0
};

const updateFocus = () => {
  const tds = table.querySelectorAll("td");

  for (const td of tds) {
    const meta = table.getMeta(td);

    if (meta.x === SELECTED_POSITION.x && meta.y === SELECTED_POSITION.y) {
      td.focus();
    }
  }
};

table.addEventListener("click", event => {
  const meta = table.getMeta(event.target);
  SELECTED_POSITION.x = meta.x;
  SELECTED_POSITION.y = meta.y;
  updateFocus();
});
table.addStyleListener(() => {
  for (const td of table.querySelectorAll("td")) {
    td.setAttribute("contenteditable", true);
  }
});
table.addStyleListener(updateFocus);
table.draw();

function write(active_cell) {
  const meta = table.getMeta(active_cell);

  if (meta) {
    let text = active_cell.textContent;

    if (text[0] === "=") {
      text = compile(text);
    }

    DATA[meta.x][meta.y] = text;
    active_cell.blur();
    clear_highlight();
    table.draw();
  }
}

table.addEventListener("keypress", event => {
  const target = document.activeElement;

  if (event.keyCode === 13) {
    event.preventDefault();

    if (event.shiftKey) {
      moveSelection(target, 0, -1);
    } else {
      moveSelection(target, 0, 1);
    }
  }
});
table.addEventListener("keyup", event => {
  const target = document.activeElement;

  if (event.keyCode !== 13) {
    highlight(target);
  }
});
table.addEventListener("keydown", event => {
  const target = document.activeElement;

  switch (event.keyCode) {
    // tab
    case 9:
      event.preventDefault();

      if (event.shiftKey) {
        moveSelection(target, -1, 0);
      } else {
        moveSelection(target, 1, 0);
      }

      break;
    // left arrow

    case 37:
      moveSelection(target, -1, 0);
      break;
    // up arrow

    case 38:
      moveSelection(target, 0, -1);
      break;
    // right arrow

    case 39:
      moveSelection(target, 1, 0);
      break;
    // down arrow

    case 40:
      moveSelection(target, 0, 1);
      break;
  }
});
const SCROLL_AHEAD = 4;

async function moveSelection(active_cell, dx, dy) {
  const meta = table.getMeta(active_cell);

  if (dx !== 0) {
    if (meta.x + dx < NUM_COLUMNS && 0 <= meta.x + dx) {
      SELECTED_POSITION.x = meta.x + dx;
    }

    if (meta.x1 <= SELECTED_POSITION.x + SCROLL_AHEAD) {
      await table.scrollToCell(meta.x0 + 2, meta.y0, NUM_COLUMNS, NUM_ROWS);
    } else if (SELECTED_POSITION.x - SCROLL_AHEAD < meta.x0) {
      if (0 < meta.x0 - 1) {
        await table.scrollToCell(meta.x0 - 1, meta.y0, NUM_COLUMNS, NUM_ROWS);
      } else {
        await table.scrollToCell(0, meta.y0, NUM_COLUMNS, NUM_ROWS);
      }
    }
  }

  if (dy !== 0) {
    if (meta.y + dy < NUM_ROWS && 0 <= meta.y + dy) {
      SELECTED_POSITION.y = meta.y + dy;
    }

    if (meta.y1 <= SELECTED_POSITION.y + SCROLL_AHEAD) {
      await table.scrollToCell(meta.x0, meta.y0 + 1, NUM_COLUMNS, NUM_ROWS);
    } else if (SELECTED_POSITION.y - SCROLL_AHEAD + 2 < meta.y0) {
      if (0 < meta.y0 - 1) {
        await table.scrollToCell(meta.x0, meta.y0 - 1, NUM_COLUMNS, NUM_ROWS);
      } else {
        await table.scrollToCell(meta.x0, 0, NUM_COLUMNS, NUM_ROWS);
      }
    }
  }

  updateFocus();
}

table.addEventListener("scroll", () => {
  write(document.activeElement);
});
table.addEventListener("focusout", event => {
  write(event.target);
});

async function highlight(active_cell) {
  clear_highlight();
  const text = active_cell.textContent;
  const meta = table.getMeta(active_cell);

  for (const [x, y] of cell_iter(CELL_PATTERN, text)) {
    paint_highlight(x + 1, y, meta);
  }

  for (const [x0, y0, x1, y1] of cell_iter(RANGE_PATTERN, text)) {
    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        paint_highlight(i + 1, j, meta);
      }
    }
  }
}

function clear_highlight() {
  for (const td of table.querySelectorAll("td.highlight")) {
    td.classList.remove("highlight");
  }
}

function* cell_iter(patt, text) {
  let match;
  let regex = new RegExp(patt, "g");

  while ((match = regex.exec(text)) !== null) {
    yield match.slice(1).map((x, i) => i % 2 === 0 ? col2Idx(x) : parseInt(x));
  }
}

function paint_highlight(x, y, meta) {
  const tr = table.querySelector("tbody").children[y - meta.y0];
  const td = tr.children[x - meta.x0];
  td.classList.add("highlight");
}
//# sourceMappingURL=spreadsheet.js.map