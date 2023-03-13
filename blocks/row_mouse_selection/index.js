const PRIVATE = Symbol("Row Mouse Selection");
const MOUSE_SELECTED_ROW_CLASS = "mouse-selected-row";
export const addRowMouseSelection = (table, dl, {
  cellSelectionEnabled = true,
  className = MOUSE_SELECTED_ROW_CLASS,
  selected = []
} = {}) => {
  table[PRIVATE] = {
    selected_rows: selected
  };

  const clickListener = event => {
    const meta = table.getMeta(event.target);
    const headerWasClicked = meta && typeof meta.row_header_x !== "undefined" && meta.row_header;
    const cellWasClicked = meta && typeof meta.y !== "undefined" && !meta.column_header_y;

    if (headerWasClicked) {
      table[PRIVATE] = {
        selected_rows: newRowSelections(table, meta, event, dl)
      };
    } else if (cellWasClicked && cellSelectionEnabled) {
      table[PRIVATE] = {
        selected_rows: newRowSelections(table, meta, event, dl)
      };
    } else if (!event.ctrlKey && !event.metaKey) {
      table[PRIVATE] = {
        selected_rows: []
      };
    }

    table.draw();
  };

  table.addEventListener("click", clickListener);
  addRowSelectionStyleListener(table, dl, className);
  return table;
};

const newRowSelections = (table, meta, event, dl) => {
  const inMultiSelectMode = event.ctrlKey || event.metaKey;
  const targetSelection = targetRowSelection(meta, dl);

  if (inMultiSelectMode) {
    return newMultiSelectRow(table, targetSelection, dl);
  } else {
    return newSingleSelectRow(table, targetSelection, dl);
  }
};

const targetRowSelection = (meta, dl) => {
  const target = { ...meta
  };
  target.y0 = meta.y;
  const isRowGroup = typeof meta.row_header_x !== "undefined" && meta.row_header_x !== meta.row_header.length - 1;

  if (isRowGroup) {
    target.y1 = lastIndexOfRowGroup(dl, meta);
  } else {
    target.y1 = meta.y;
  }

  return target;
};

const newSingleSelectRow = (table, targetSelection, dl) => {
  const matches = matchingRowSelections(table, targetSelection);

  if (matches.length > 0) {
    return [];
  } else {
    if (event.shiftKey) {
      return [createRowRangeSelection(table, targetSelection, dl)];
    } else {
      return [targetSelection];
    }
  }
};

const matchingRowSelections = (table, {
  y,
  y0,
  y1
}) => {
  const _y = y !== undefined ? y : Math.min(y0, y1);

  return table[PRIVATE].selected_rows.filter(s => s.y0 <= _y && _y <= s.y1);
};

const createRowRangeSelection = (table, rowSelection, dl) => {
  const selectedRows = table[PRIVATE].selected_rows;
  const lastSelection = selectedRows[selectedRows.length - 1];

  if (lastSelection) {
    const y0 = Math.min(rowSelection.y0, lastSelection.y0, rowSelection.y1, lastSelection.y1);
    const y1 = Math.max(rowSelection.y0, lastSelection.y0, rowSelection.y1, lastSelection.y1);
    const row_header_x = Math.min(rowSelection.row_header_x, lastSelection.row_header_x);
    rowSelection.y0 = y0;
    rowSelection.y1 = y1;
  }

  return rowSelection;
};

const newMultiSelectRow = (table, targetSelection, dl) => {
  const matches = matchingRowSelections(table, targetSelection);

  if (matches.length > 0) {
    let newSelections = rejectMatchingRowSelections(table, targetSelection);
    return splitRowRangeMatches(newSelections, targetSelection);
  } else {
    if (event.shiftKey) {
      return table[PRIVATE].selected_rows.concat(createRowRangeSelection(table, targetSelection, dl));
    } else {
      return table[PRIVATE].selected_rows.concat(targetSelection);
    }
  }
};

const rejectMatchingRowSelections = (table, {
  y,
  y0,
  y1
}) => {
  const _y = y ? y : Math.min(y0, y1);

  return table[PRIVATE].selected_rows.filter(({
    y0,
    y1
  }) => !(y0 == _y && _y == y1));
};

const splitRowRangeMatches = (selections, rowSelection) => {
  return selections.flatMap(s => {
    const row_header_x = Math.max(rowSelection.row_header_x, s.row_header_x);
    const matchesRangeSelection = s.y0 <= rowSelection.y0 && rowSelection.y1 <= s.y1 && s.y0 !== s.y1;

    if (matchesRangeSelection) {
      const firstSplit = {
        row_header_x,
        y0: s.y0,
        y1: rowSelection.y0 - 1,
        row_header: s.row_header
      };
      const secondSplit = {
        row_header_x,
        y0: rowSelection.y1 + 1,
        y1: s.y1,
        row_header: s.row_header
      };
      return [firstSplit, secondSplit].filter(s => s.y0 <= s.y1);
    } else {
      return s;
    }
  });
};

const lastIndexOfRowGroup = (dl, {
  row_header_x,
  value,
  y
}) => {
  const {
    num_rows
  } = dl(0, 0, 1, 1);
  let idx;
  const chunk = 100;
  let y0 = y;
  let y1 = Math.min(y + chunk, num_rows);

  do {
    const rowHeaderSlice = dl(0, y0, 0, y1).row_headers.map((h, idx) => [y + idx, h]);
    const result = rowHeaderSlice.find(([_, row_headers]) => row_headers[row_header_x] !== value);

    if (result) {
      [idx] = result;
    } else {
      y0 = Math.min(y0 + chunk, num_rows);
      y1 = Math.min(y1 + chunk, num_rows);
    }
  } while (idx === undefined && y1 < num_rows);

  return idx === undefined ? num_rows : idx - 1;
};

const addRowSelectionStyleListener = (table, dl, className) => {
  table.addStyleListener(() => {
    const ys = reapplyRowTHSelection(table, dl, className);

    if (ys.length > 0) {
      reapplyRowTDSelection(table, ys, className);
    } else {
      reapplyRowSelection(table, dl, className);
    }
  });
};

const reapplyRowSelection = (table, dl, className) => {
  const elements = table.querySelectorAll("tbody td");

  if (elements.length > 0) {
    for (const el of elements) {
      const meta = table.getMeta(el);
      const matches = matchingRowSelections(table, meta);

      if (matches.length > 0) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    }
  }
};

const reapplyRowTHSelection = (table, dl, className) => {
  const elements = table.querySelectorAll("tbody th");
  let selectedYs = [];

  if (elements.length > 0) {
    const meta0 = table.getMeta(elements[0]);
    const visibleRowHeaders = dl(0, meta0.y0, 0, meta0.y1 + 1).row_headers.map((h, idx) => [meta0.y0 + idx, h]);

    for (const el of elements) {
      const meta = table.getMeta(el);

      if (isRowHeaderSelected(table, meta, visibleRowHeaders)) {
        selectedYs.push(meta.y);
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    }
  }

  return selectedYs;
};

const isRowHeaderSelected = (table, meta, visibleRowHeaders) => {
  const matches = matchingRowSelections(table, meta);

  const isGroupMatch = () => {
    return table[PRIVATE].selected_rows.find(selection => {
      const matchingGroupValues = visibleRowHeaders.filter(([idx]) => selection.y0 <= idx && idx <= selection.y1).map(([idx, row_headers]) => idx);
      return selection.row_header_x < meta.row_header_x && matchingGroupValues.indexOf(meta.y) !== -1;
    });
  };

  const isDirectMatch = () => !!matches.find(m => m.row_header_x === meta.row_header_x);

  return isDirectMatch() || isGroupMatch();
};

const reapplyRowTDSelection = (table, ys, className) => {
  const elements = table.querySelectorAll("tbody td");

  for (const el of elements) {
    const meta = table.getMeta(el);

    if (ys.indexOf(meta.y) !== -1) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }
};
//# sourceMappingURL=row_mouse_selection.js.map