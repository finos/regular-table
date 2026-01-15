// ## Minesweeper
//
// A clone of the classic game Minesweeper with 1,000,000 cells, built with
// [`regular-table`](https://github.com/finos/regular-table).

import "/dist/esm/regular-table.js";

// # Game State and Virtual Data Model
//
// The basic game dimensions.

const WIDTH = 1000;
const HEIGHT = 1000;
const NUM_MINES = 130000;

// We are going to encode teh game state in a single two dimensional array of
// integer cell state Enums. 0-8 will be "hints", cells with a number representing
// the total neighboring mines, and we'll want to encode a few additional special
// states.

const FLAG_ENUM = 10;
const FLAG_MINE_ENUM = 9;
const HIDDEN_ENUM = 12;
const HIDDEN_MINE_ENUM = 11;
const EXPLODED_ENUM = 13;

// Because the Player's view does not reveal all information about the game state,
// we will need to calculate some sets out of groups of enums. For example, both an
// empty and mine-containing cell, when un-revealed, will be drawn as a `.brick`
// cell using `HIDDEN_ENUMS`.

const FLAG_ENUMS = new Set([FLAG_ENUM, FLAG_MINE_ENUM]);
const HIDDEN_ENUMS = new Set([HIDDEN_ENUM, HIDDEN_MINE_ENUM]);
const MINE_ENUMS = new Set([HIDDEN_MINE_ENUM, FLAG_MINE_ENUM]);
const HINT_ENUMS = new Set(Array.from(Array(9).keys()));

// The game board begins hidden, with mines randomly distributed throughout. Little
// effort is made in this example to create a competition-approved distribution, so
// be sure to avoid using this particular implementation in any Leagues,
// Tournaments or Grand Championships.

const VIEW_DATA = Array(WIDTH)
    .fill(0)
    .map(() => Array(HEIGHT).fill(HIDDEN_ENUM));

for (let i = 0; i < NUM_MINES; i++) {
    const x = Math.floor(Math.random() * WIDTH);
    const y = Math.floor(Math.random() * HEIGHT);
    VIEW_DATA[x][y] = HIDDEN_MINE_ENUM;
}

// Virtual Data Model.

function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: VIEW_DATA[0].length,
        num_columns: VIEW_DATA.length,
        data: VIEW_DATA.slice(x0, x1).map((col) => col.slice(y0, y1)),
    };
}

// # Game Logic
//
// The basic unit of calculating player moves is `getNeighbors()`, a generator
// function which yields the coordinates of all neighboring cells which are members
// of a `Set()`. We'll use this to implement a breadth-first search which respects
// the game rules, board edges, etc.

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

// There are three "actions" the player can make in Minesweeper `detonate()`,
// `flag()` and `check()`. The `detonate()` action, applied to a blank cell, will
// fill the cell with a number 0-8, the number of neighboring mines. If this number
// is 0, the neighboring cells will be recursively `detonate()`-ed as well.

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

// The second player action, `flag()` marks a blank cell as a suspected mine, and
// prevents it from being `detonate()`-ed. When applied to an already `flag()`-ed
// cell, it reset the cell to its original blank state.

function flag(x, y) {
    const val = VIEW_DATA[x][y];
    if (FLAG_ENUMS.has(val)) {
        VIEW_DATA[x][y] += 2;
    } else if (HIDDEN_ENUMS.has(val)) {
        VIEW_DATA[x][y] -= 2;
    }
}

// The last, `check()`, is applied to an already `detonate()`-ed cell with a number
// revealed. If this cell has this same number of neighboring cells `flag()`-ed,
// then all remaining neighbor cells will be `detonate()`-ed.

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

// # AAA Graphics
//
// We could easily reflect each cell's value to a table cell attribute, ala
// `<td data-value="3">3<td>`, and implement the rest of our game's graphics as CSS
// selectors - but for the sake of readability, we'll group these as classes.

function styleListener() {
    for (const td of table.querySelectorAll("td")) {
        const meta = table.getMeta(td);
        const val = VIEW_DATA[meta.x][meta.y];
        td.className = "";
        td.classList.toggle(`hint-${val}`, HINT_ENUMS.has(val));
        td.classList.toggle(
            "brick",
            HIDDEN_ENUMS.has(val) || FLAG_ENUMS.has(val),
        );
        td.classList.toggle("flag", FLAG_ENUMS.has(val));
        td.classList.toggle("exploded", val === EXPLODED_ENUM);
    }
}

// # Player Controls
//
// Left clicks are `detonate()` actions.

async function clickEventListener(event) {
    if (event.target.tagName === "TD") {
        const { x, y } = table.getMeta(event.target);
        const val = VIEW_DATA[x][y];
        if (HIDDEN_ENUMS.has(val)) {
            detonate(x, y);
        }
        await table.draw();
    }
}

// Right clicks are `flag()` actions on `.brick` cells, and `check()` actions on
// `detonate()`-ed cells.

function contextMenuEventListener(event) {
    event.preventDefault();
    if (event.target.tagName === "TD") {
        const { x, y } = table.getMeta(event.target);
        const val = VIEW_DATA[x][y];
        if (HINT_ENUMS.has(val)) {
            check(x, y);
        } else {
            flag(x, y);
        }
        table.draw();
    }
}

// # Main

table.setDataListener(dataListener);
table.addStyleListener(styleListener);
table.addEventListener("click", clickEventListener);
table.addEventListener("contextmenu", contextMenuEventListener);
table.draw();
