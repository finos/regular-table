const PRIVATE = Symbol("Area Mouse Selection");
const MOUSE_SELECTED_AREA_CLASS = "mouse-selected-area";
export const addAreaMouseSelection = (table, {
  className = MOUSE_SELECTED_AREA_CLASS,
  selected = []
} = {}) => {
  table[PRIVATE] = {
    selected_areas: selected
  };
  table.addEventListener("mousedown", getMousedownListener(table));
  table.addEventListener("mouseover", getMouseoverListener(table, className));
  table.addEventListener("mouseup", getMouseupListener(table, className));
  table.addStyleListener(() => applyMouseAreaSelections(table, className));
  return table;
};

const getMousedownListener = table => event => {
  table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = {};
  const meta = table.getMeta(event.target);

  if (meta && meta.x !== undefined && meta.y !== undefined) {
    table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = {
      x: meta.x,
      y: meta.y
    };
  }

  if (!event.ctrlKey && !event.metaKey) {
    table[PRIVATE].selected_areas = [];
  }
};

const getMouseoverListener = (table, className) => event => {
  if (table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES && table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x !== undefined) {
    const meta = table.getMeta(event.target);

    if (meta && meta.x !== undefined && meta.y !== undefined) {
      const potentialSelection = {
        x0: Math.min(meta.x, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x),
        x1: Math.max(meta.x, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x),
        y0: Math.min(meta.y, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y),
        y1: Math.max(meta.y, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y)
      };
      applyMouseAreaSelections(table, className, table[PRIVATE].selected_areas.concat([potentialSelection]));
    }
  }
};

const getMouseupListener = (table, className) => event => {
  const meta = table.getMeta(event.target);

  if (table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES && table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x !== undefined && meta.x !== undefined && meta.y !== undefined) {
    const selection = {
      x0: Math.min(meta.x, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x),
      x1: Math.max(meta.x, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.x),
      y0: Math.min(meta.y, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y),
      y1: Math.max(meta.y, table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES.y)
    };
    table[PRIVATE].selected_areas.push(selection);
    applyMouseAreaSelections(table, className);
  }

  table[PRIVATE].CURRENT_MOUSEDOWN_COORDINATES = {};
};

export const applyMouseAreaSelections = (table, className, selected) => {
  const tds = table.querySelectorAll("tbody td");

  for (const td of tds) {
    td.classList.remove(className);
  }

  selected = selected || table[PRIVATE].selected_areas;

  for (const as of selected) {
    applyMouseAreaSelection(table, as, className);
  }
};

const applyMouseAreaSelection = (table, {
  x0,
  x1,
  y0,
  y1
}, className) => {
  const tds = table.querySelectorAll("tbody td");

  if (x0 !== undefined && y0 !== undefined && x1 !== undefined && y1 !== undefined) {
    for (const td of tds) {
      const meta = table.getMeta(td);

      if (x0 <= meta.x && meta.x <= x1) {
        if (y0 <= meta.y && meta.y <= y1) {
          td.classList.add(className);
        }
      }
    }
  }
};
//# sourceMappingURL=area_mouse_selection.js.map