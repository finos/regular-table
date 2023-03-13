const WIDTH = 1000;
const HEIGHT = 1000;
const NUM_MINES = 130000;
const FLAG_ENUM = 10;
const FLAG_MINE_ENUM = 9;
const HIDDEN_ENUM = 12;
const HIDDEN_MINE_ENUM = 11;
const EXPLODED_ENUM = 13;
const FLAG_ENUMS = new Set([FLAG_ENUM, FLAG_MINE_ENUM]);
const HIDDEN_ENUMS = new Set([HIDDEN_ENUM, HIDDEN_MINE_ENUM]);
const MINE_ENUMS = new Set([HIDDEN_MINE_ENUM, FLAG_MINE_ENUM]);
const HINT_ENUMS = new Set(Array.from(Array(9).keys()));
const VIEW_DATA = Array(WIDTH).fill(0).map(() => Array(HEIGHT).fill(HIDDEN_ENUM));

for (let i = 0; i < NUM_MINES; i++) {
  const x = Math.floor(Math.random() * WIDTH);
  const y = Math.floor(Math.random() * HEIGHT);
  VIEW_DATA[x][y] = HIDDEN_MINE_ENUM;
}

function dataListener(x0, y0, x1, y1) {
  return {
    num_rows: VIEW_DATA[0].length,
    num_columns: VIEW_DATA.length,
    data: VIEW_DATA.slice(x0, x1).map(col => col.slice(y0, y1))
  };
}

function* getNeighbors(x, y, _set) {
  for (let dx = -1; dx < 2; dx++) {
    for (let dy = -1; dy < 2; dy++) {
      if (dx !== 0 || dy !== 0) {
        const x2 = x + dx;
        const y2 = y + dy;

        if (x2 >= 0 && x2 < WIDTH && y2 >= 0 && y2 < HEIGHT) {
          if (_set.has(VIEW_DATA[x2][y2])) {
            yield [x2, y2];
          }
        }
      }
    }
  }
}

function detonate(x, y) {
  if (MINE_ENUMS.has(VIEW_DATA[x][y])) {
    VIEW_DATA[x][y] = EXPLODED_ENUM;
    table.classList.add("game-over");
    return;
  }

  let num_neighbor_mines = 0;

  for (const [] of getNeighbors(x, y, MINE_ENUMS)) {
    num_neighbor_mines++;
  }

  VIEW_DATA[x][y] = num_neighbor_mines;

  if (num_neighbor_mines === 0) {
    for (const [x2, y2] of getNeighbors(x, y, HIDDEN_ENUMS)) {
      detonate(x2, y2);
    }
  }
}

function flag(x, y) {
  const val = VIEW_DATA[x][y];

  if (FLAG_ENUMS.has(val)) {
    VIEW_DATA[x][y] += 2;
  } else if (HIDDEN_ENUMS.has(val)) {
    VIEW_DATA[x][y] -= 2;
  }
}

function check(x, y) {
  const val = VIEW_DATA[x][y];
  let num_neighbor_flags = 0;

  for (const [] of getNeighbors(x, y, FLAG_ENUMS)) {
    num_neighbor_flags++;
  }

  if (num_neighbor_flags === val) {
    for (const [x1, y1] of getNeighbors(x, y, HIDDEN_ENUMS)) {
      detonate(x1, y1);
    }
  }
}

function styleListener() {
  for (const td of table.querySelectorAll("td")) {
    const meta = table.getMeta(td);
    const val = VIEW_DATA[meta.x][meta.y];
    td.className = "";
    td.classList.toggle(`hint-${val}`, HINT_ENUMS.has(val));
    td.classList.toggle("brick", HIDDEN_ENUMS.has(val) || FLAG_ENUMS.has(val));
    td.classList.toggle("flag", FLAG_ENUMS.has(val));
    td.classList.toggle("exploded", val === EXPLODED_ENUM);
  }
}

async function clickEventListener(event) {
  if (event.target.tagName === "TD") {
    const {
      x,
      y
    } = table.getMeta(event.target);
    const val = VIEW_DATA[x][y];

    if (HIDDEN_ENUMS.has(val)) {
      detonate(x, y);
    }

    await table.draw();
  }
}

function contextMenuEventListener(event) {
  event.preventDefault();

  if (event.target.tagName === "TD") {
    const {
      x,
      y
    } = table.getMeta(event.target);
    const val = VIEW_DATA[x][y];

    if (HINT_ENUMS.has(val)) {
      check(x, y);
    } else {
      flag(x, y);
    }

    table.draw();
  }
}

function init() {
  table.setDataListener(dataListener);
  table.addStyleListener(styleListener);
  table.addEventListener("click", clickEventListener);
  table.addEventListener("contextmenu", contextMenuEventListener);
  table.draw();
}

window.addEventListener("load", init);
//# sourceMappingURL=minesweeper.js.map