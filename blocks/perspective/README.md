## Perspective

An example of a multi-dimensional pivot table using [`regular-table`](https://github.com/finos/regular-table) and [`perspective`](https://perspective.finos.org/).

```html
<regular-table></regular-table>
```

## `addStyleListener()` Styles

Column header styles, including styling for sort indicators.  A Column, in Perspctive vocabulary, refers to the last level of `column_headers`, and Perspective's `to_columns()` method will always generate these, even if no column Pivots were defined in the construction of the rendered `View()`.

```javascript
function columnHeaderStyleListener(regularTable) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    for (const td of regularTable.querySelectorAll("thead tr:last-child th")) {
        const metadata = regularTable.getMeta(td);
        const sort = this._config.sort.find(
            (x) =>
                x[0] ===
                metadata.column_header[metadata.column_header.length - 1]
        );
        let needs_border = metadata.row_header_x === header_depth;
        needs_border =
            needs_border ||
            (metadata.x + 1) % this._config.columns.length === 0;
        td.classList.toggle("psp-header-border", needs_border);
        td.classList.toggle("psp-header-group", false);
        td.classList.toggle("psp-header-leaf", true);
        td.classList.toggle(
            "psp-header-corner",
            typeof metadata.x === "undefined"
        );
        td.classList.toggle("psp-header-sort-asc", !!sort && sort[1] === "asc");
        td.classList.toggle(
            "psp-header-sort-desc",
            !!sort && sort[1] === "desc"
        );
        td.classList.toggle(
            "psp-header-sort-col-asc",
            !!sort && sort[1] === "col asc"
        );
        td.classList.toggle(
            "psp-header-sort-col-desc",
            !!sort && sort[1] === "col desc"
        );
    }
}
```

Accompanying CSS:

```css
.psp-header-border {
    border-right: 1px solid #ddd;
}
.psp-header-border:last-child {
    border-right-width: 0px;
}
.psp-header-sort-desc:after {
    font-family: "Material Icons";
    font-size: 10px;
    content: "arrow_downward"
}
.psp-header-sort-asc:after {
    font-family: "Material Icons";
    font-size: 10px;
    content: "arrow_upward"
}
.psp-header-sort-col-desc:after {
    font-family: "Material Icons";
    font-size: 10px;
    content: "arrow_back"
}
.psp-header-sort-col-asc:after {
    font-family: "Material Icons";
    font-size: 10px;
    content: "arrow_forward"
}
```

Group headers, e.g. `column_headers` 0 - (N - 1).

```javascript
function groupHeaderStyleListener(regularTable) {
    const header_depth = regularTable._view_cache.config.row_pivots.length - 1;
    for (const td of regularTable.querySelectorAll(
        "thead tr:not(:last-child) th"
    )) {
        const metadata = regularTable.getMeta(td);
        let needs_border =
            metadata.row_header_x === header_depth || metadata.x >= 0;
        td.classList.toggle("psp-header-group", true);
        td.classList.toggle("psp-header-leaf", false);
        td.classList.toggle("psp-header-border", needs_border);
    }
}
```

_Tree-like_ renderer for `row_headers`, which also draws expand/collapse buttons.

```javascript
function treeStyleListener(regularTable) {
    for (const td of regularTable.querySelectorAll("tbody th")) {
        const metadata = regularTable.getMeta(td);
        const is_not_empty =
            !!metadata.value && metadata.value.toString().trim().length > 0;
        const is_leaf = metadata.row_header_x >= this._config.row_pivots.length;
        const next = regularTable.getMeta({
            dx: 0,
            dy: metadata.y - metadata.y0 + 1,
        });
        const is_collapse =
            next &&
            next.row_header &&
            typeof next.row_header[metadata.row_header_x + 1] !== "undefined";
        td.classList.toggle("psp-tree-label", is_not_empty && !is_leaf);
        td.classList.toggle(
            "psp-tree-label-expand",
            is_not_empty && !is_leaf && !is_collapse
        );
        td.classList.toggle(
            "psp-tree-label-collapse",
            is_not_empty && !is_leaf && is_collapse
        );
        td.classList.toggle("psp-tree-leaf", is_not_empty && is_leaf);
    }
}
```

CSS:

```css
tbody th:last-of-type {
    border-right: 1px solid #ddd;
    overflow: hidden;
    text-overflow: ellipsis;
}
tbody th:empty {
    background-image: linear-gradient(to right, transparent 9px, #eee 10px, transparent 11px);
    background-repeat: no-repeat;
    min-width: 20px;
    max-width: 20px;
    pointer-events: none;
}
.psp-tree-label {
    max-width: 0px;
    min-width: 0px;
}
.psp-tree-label:before {
    color: #ccc;
    font-family: "Material Icons";
    padding-right: 11px;
    vertical-align: -1px;
}
.psp-tree-label-expand:before {
    content: "add"
}
.psp-tree-label-collapse:before {
    content: "remove"
}
.psp-tree-label:hover:before {
    color: #1078d1;
    text-shadow: 0px 0px 5px #1078d1;
}
tr:hover th.psp-tree-leaf, tr:hover th.psp-tree-label  {
    background: #eee;
}
.psp-tree-leaf {
    padding-left: 24px;
}
```

Type-specific styles, +/- color and alignment.

```javascript
function get_psp_type(metadata) {
    if (metadata.x >= 0) {
        const column_path = this._column_paths[metadata.x];
        const column_path_parts = column_path.split("|");
        return this._schema[column_path_parts[column_path_parts.length - 1]];
    } else {
        const column_path = this._config.row_pivots[metadata.row_header_x - 1];
        return this._table_schema[column_path];
    }
}

function typeStyleListener(regularTable) {
    for (const td of regularTable.querySelectorAll(
        "td, tbody th, thead tr:last-child th"
    )) {
        const metadata = regularTable.getMeta(td);
        let type = get_psp_type.call(this, metadata);
        const is_numeric = type === "integer" || type === "float";
        const float_val = is_numeric && parseFloat(metadata.value);
        td.classList.toggle("psp-align-right", is_numeric);
        td.classList.toggle("psp-align-left", !is_numeric);
        td.classList.toggle("psp-positive", float_val > 0);
        td.classList.toggle("psp-negative", float_val < 0);
    }
}
```

CSS:

```css
.psp-align-right {
    text-align: right;
}
.psp-align-left {
    text-align: left;
}
.psp-positive:not(:focus) {
    color: #1078d1;
}
.psp-negative:not(:focus) {
    color: #de3838;
}
```

## Sort Interaction

When the sort handler is invoked, a new `perspective.View` must be created with the specified `sort` property.  However, we don't want to mutate this property within the sort handler, since the original view will be specifie as a constructor paramater to the `model` object in `createModel()`;  instead we can emit the event `"regular-table-psp-sort"` which we can then handle in the same scope that declares this `regular-table`.

```javascript
async function sortHandler(regularTable, event, target) {
    const meta = regularTable.getMeta(target);
    const column_name = meta.column_header[meta.column_header.length - 1];
    const sort_method = event.shiftKey ? append_sort : override_sort;
    const sort = sort_method.call(this, column_name);
    regularTable.dispatchEvent(
        new CustomEvent("regular-table-psp-sort", {detail: {sort}})
    );
}
```

```javascript
function append_sort(column_name) {
    const sort = [];
    let found = false;
    for (const sort_term of this._config.sort) {
        const [_column_name, _sort_dir] = sort_term;
        if (_column_name === column_name) {
            found = true;
            const term = create_sort.call(this, column_name, _sort_dir);
            if (term) {
                sort.push(term);
            }
        } else {
            sort.push(sort_term);
        }
    }
    if (!found) {
        sort.push([column_name, "desc"]);
    }
    return sort;
}

function override_sort(column_name) {
    for (const [_column_name, _sort_dir] of this._config.sort) {
        if (_column_name === column_name) {
            const sort = create_sort.call(this, column_name, _sort_dir);
            return sort ? [sort] : [];
        }
    }
    return [[column_name, "desc"]];
}

function create_sort(column_name, sort_dir) {
    const is_col_sortable = this._config.column_pivots.length > 0;
    const order = is_col_sortable ? ROW_COL_SORT_ORDER : ROW_SORT_ORDER;
    const inc_sort_dir = sort_dir ? order[sort_dir] : "desc";
    if (inc_sort_dir) {
        return [column_name, inc_sort_dir];
    }
}

const ROW_SORT_ORDER = {desc: "asc", asc: undefined};
const ROW_COL_SORT_ORDER = {
    desc: "asc",
    asc: "col desc",
    "col desc": "col asc",
    "col asc": undefined,
};
```

## Expand/Collapse Interaction

```javascript
async function expandCollapseHandler(regularTable, event, target) {
    const meta = regularTable.getMeta(target);
    const is_collapse = target.classList.contains("psp-tree-label-collapse");
    if (event.shiftKey && is_collapse) {
        this._view.set_depth(
            meta.row_header.filter((x) => x !== undefined).length - 2
        );
    } else if (event.shiftKey) {
        this._view.set_depth(
            meta.row_header.filter((x) => x !== undefined).length - 1
        );
    } else if (is_collapse) {
        this._view.collapse(meta.y);
    } else {
        this._view.expand(meta.y);
    }
    this._num_rows = await this._view.num_rows();
    this._num_columns = await this._view.num_columns();
    regularTable.draw();
}

function mousedownListener(regularTable, event) {
    let target = event.target;
    while (target.tagName !== "TD" && target.tagName !== "TH") {
        target = target.parentElement;
        if (!regularTable.contains(target)) {
            return;
        }
    }

    if (target.classList.contains("psp-tree-label") && event.offsetX < 26) {
        expandCollapseHandler.call(this, regularTable, event, target);
        event.handled = true;
    } else if (
        target.classList.contains("psp-header-leaf") &&
        !target.classList.contains("psp-header-corner")
    ) {
        sortHandler.call(this, regularTable, event, target);
        event.handled = true;
    }
}
```

## Virtual Data Model

Type specific formatters.

```javascript
const FORMATTERS = {
    datetime: Intl.DateTimeFormat("en-us", {
        week: "numeric",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
    }),
    date: Intl.DateTimeFormat("en-us"),
    integer: Intl.NumberFormat("en-us"),
    float: new Intl.NumberFormat("en-us", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }),
};

export const formatters = FORMATTERS;

function _format(parts, val, use_table_schema = false) {
    if (val === null) {
        return "-";
    }
    const title = parts[parts.length - 1];
    const type =
        (use_table_schema && this._table_schema[title]) ||
        this._schema[title] ||
        "string";
    return FORMATTERS[type] ? FORMATTERS[type].format(val) : val;
}

function formatStyleListener(regularTable) {
    regularTable.invalidate();
    for (const td of regularTable.querySelectorAll("table tbody td")) {
        const metadata = regularTable.getMeta(td);
        let type = get_psp_type.call(this, metadata);
        td.innerHTML = FORMATTERS[type]
            ? FORMATTERS[type].format(metadata.value)
            : td.textContent;
    }
}
```

Wraps Perspective's default `__ROW_PATH__` format to output a _tree-like_ `row_headers`.

```javascript
function* _tree_header(paths = [], row_headers) {
    for (let path of paths) {
        path = ["TOTAL", ...path];
        const last = path[path.length - 1];
        path = path.slice(0, path.length - 1).fill("");
        const formatted = _format.call(
            this,
            [row_headers[path.length - 1]],
            last,
            true
        );
        path = path.concat({toString: () => formatted});
        path.length = row_headers.length + 1;
        yield path;
    }
}
```

The Virtual Data Model - this should really become a method of Perspective, like `to_slice()`?

```javascript
async function dataListener(x0, y0, x1, y1) {
    let columns = {};
    if (x1 - x0 > 0 && y1 - y0 > 0) {
        columns = await this._view.to_columns({
            start_row: y0,
            start_col: x0,
            end_row: y1,
            end_col: x1,
            id: true,
        });
        this._ids = columns.__ID__;
    }

    const data = [];
    const column_headers = [];
    for (const path of this._column_paths.slice(x0, x1)) {
        const path_parts = path.split("|");
        const column = columns[path] || new Array(y1 - y0).fill(null);
        data.push(column);
        column_headers.push(path_parts);
    }

    return {
        num_rows: this._num_rows,
        num_columns: this._column_paths.length,
        row_headers: Array.from(
            _tree_header.call(
                this,
                columns.__ROW_PATH__,
                this._config.row_pivots
            )
        ),
        column_headers,
        data,
    };
}
```

Create a model state object.  This object will memoize everything that a `regular-table` will need in one place, minimizing recalculation later when a re-render is requested.  Because some operations like _sorting_ can actually instantiate a view (and this call `createModel()` themselves), we must memoize both the `Table` and `View` objects.

```javascript
export async function createModel(regular, table, view, extend = {}) {
    const config = await view.get_config();
    const [
        table_schema,
        table_computed_schema,
        num_rows,
        schema,
        computed_schema,
        column_paths,
    ] = await Promise.all([
        table.schema(),
        table.computed_schema(config.computed_columns),
        view.num_rows(),
        view.schema(),
        view.computed_schema(),
        view.column_paths(),
    ]);

    const model = Object.assign(extend, {
        _view: view,
        _table: table,
        _table_schema: {...table_schema, ...table_computed_schema},
        _config: config,
        _num_rows: num_rows,
        _schema: {...schema, ...computed_schema},
        _ids: [],
        _column_paths: column_paths.filter((path) => {
            return path !== "__ROW_PATH__" && path !== "__ID__";
        }),
    });

    regular.setDataListener(dataListener.bind(model));
    return model;
}
```

```javascript
export async function configureRegularTable(regular, model) {
    regular.addStyleListener(formatStyleListener.bind(model, regular));
    regular.addStyleListener(typeStyleListener.bind(model, regular));
    regular.addStyleListener(treeStyleListener.bind(model, regular));
    regular.addStyleListener(groupHeaderStyleListener.bind(model, regular));
    regular.addStyleListener(columnHeaderStyleListener.bind(model, regular));
    regular.addEventListener(
        "mousedown",
        mousedownListener.bind(model, regular)
    );
    await regular.draw();
}
```

## Perspective

```html
<script type="module">
    import {createModel, configureRegularTable} from "https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/examples/perspective.js";
    const URL = "https://cdn.jsdelivr.net/npm/superstore-arrow/superstore.arrow";

    const datasource = async () => {
        const request = fetch(URL);
        const worker = window.perspective.worker();
        const response = await request;
        const buffer = await response.arrayBuffer();
        return worker.table(buffer);
    };

    window.addEventListener("load", async function () {
        const table = await datasource();
        const view = table.view({
            row_pivots: ["Region", "State", "City"],
            column_pivots: ["Category", "Sub-Category"],
            columns: ["Sales", "Profit"],
        });

        const regular = document.getElementsByTagName("regular-table")[0];
        const model = await createModel(regular, table, view);
        await configureRegularTable(regular, model);

        regular.addEventListener("regular-table-psp-sort", async (event) => {
            model._view.delete();
            const view = model._table.view({...model._config, sort: event.detail.sort});
            await createModel(regular, model._table, view, model);
            await regular.draw();
        });
    });
</script>
```

## CSS

```css
html,
body {
    overflow: hidden;
}

regular-table table {
    user-select: none;
}
```

## Appendix (Dependencies)

```html
<script src="https://cdn.jsdelivr.net/npm/@finos/perspectivehttps://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/perspective.js"></script>
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css">
```

