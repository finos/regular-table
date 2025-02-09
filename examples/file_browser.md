## File Browser Example

A simple file browser example built with
[`regular-table`](https://github.com/finos/regular-table). Also a great
introduction to `row_headers`, and how to use them to achieve group-like and
tree-like behavior. For this example, we'll want the latter.

```html
<regular-table id="regularTable"></regular-table>
```

## Tree-like `row_headers`

`regular-table` will merge consecutive `<th>` defined in `row_headers` with the
same content, but it will prefer `rowspan` to `colspan`, inserting empty `<th>`
when necessary to fill-in gaps, since `table-cell` elements cannot overlap.
Knowing this, it is easy to fine-tune header structure and behavior with empty
cells. In this case, we want to modify the basic _group-like_ `row_headers`
layout to support _tree-like_ asymmetric groups. Typically, when representing
groups of rows via `row_headers`, for example a file structure like so:

- Dir_1
    - Dir_2
        - File_1
    - File_2

... one may think to implement a `regular-table` Virtual Data Model using a
`row_headers` parameter like this:

```json
[
    ["Dir_1"],
    ["Dir_1", "Dir_2"],
    ["Dir_1", "Dir_2", "File_1"],
    ["Dir_1", "File_2"]
]
```

This will render _group-like_ row headers, with the consecutive `"Dir_1"` and
`"Dir_2"` elements merged via `rowspan`. The resulting headers visually indicate
all content on the right-hand side belong to the directory. This is exactly what
column headers do, but it is not very like a file-tree; each directory "level"
will determine its respective column's minimum width, and deeply assymmetric
trees will yield wide row headers.

<table>
<tbody>
<tr><th rowspan="4">Dir_1</th><th colspan="2">-</th></tr>
<tr><th rowspan="2">Dir_2</th><th>-</th></tr>
<tr><th>File_1</th></tr>
<tr><th colspan="2">File_2</th></tr>
</tbody>
</table>

Group-like row headers are nice for always keeping the entire directory path in
view regardless of scroll position, but for a more tree-like like experience, we
can instead replace the consecutive duplicates with `""`.

```json
[["Dir_1"], ["", "Dir_2"], ["", "", "File_1"], ["", "File_2"]]
```

The new consecutive `""` will still merge via `rowspan`, excluding the first
row, but `regular-table` will detect that a `<th>` lacks a `rowspan`, and
instead merge trailing `undefined`/empty values via `colspan` to produce one
long `<th>` for each row header group, as in the HTML below. In this tree-like
layout, no content will exclusively occupy any but the last column of
`row_headers`, and these empty columns can then be sized via CSS to create trees
of any geometry, where e.g. "directory" group rows overlap the columns of their
children as-in a conventional file tree.

<table>
<tbody>
<tr><th colspan="3">Dir_1</th></tr>
<tr><th rowspan="3">-</th><th colspan="2">Dir_2</th></tr>
<tr><th>-</th><th>File_1</th></tr>
<tr><th colspan="2">File_2</th></tr>
</tbody>
</table>

Despite this long-winded explanation, the implementation in Javascript is fairly
straightforward, and for our purposes, we only need create one such path for
`row_headers` at a time.

```javascript
function new_path(n, name) {
    return Array(n).fill("").concat([name]);
}
```

## File System

We can use a regular 2D Array, row oriented, for the file system listing state
itself, including file metadata like `size` and the open/closed state of
directory rows.

```javascript
const COLUMNS = [["size"], ["kind"], ["modified"], ["writable"]];
const DATA = Array.from(generateDirContents());
```

These file-metadata rows are fake, but for the purposes of an example, they are
worth putting "B Movie"-level effort into making look like a "real" file system.

```javascript
function new_row(type) {
    const scale = Math.random() > 0.5 ? "kb" : "mb";
    const size = numberFormat(Math.pow(Math.random(), 2) * 1000);
    const date = dateFormat(new Date());
    return [`${size} ${scale}`, type, date, true];
}
```

For the fake file system contents themselves, we will generate directory
contents on the fly as directories are opened and closed by the user.

```javascript
function* generateDirContents(n = 0) {
    for (let i = 0; i < 5; i++) {
        yield {
            path: new_path(n, `Dir_${i}`),
            row: new_row("directory"),
            is_open: false,
        };
    }
    for (let i = 0; i < 5; i++) {
        yield {
            path: new_path(n, `File_${i}`),
            row: new_row("file"),
        };
    }
}
```

Open and close directory operations are applied via `DATA.splice()`, mutating
the `Array` reference directly and inserting or stripping elements as needed.

```javascript
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
    const { is_open } = DATA[y];
    if (is_open) {
        closeDir(y);
    } else {
        openDir(y);
    }

    DATA[y].is_open = !is_open;
}
```

## Virtual Data Model

`DATA` needs to be _transposed_ before we can return slices of it from our
`dataListener()` function, because it is row-oriented and `regular-table`
expects column-oriented data.

```javascript
function transpose(m) {
    return m.length === 0 ? [] : m[0].map((x, i) => m.map((x) => x[i]));
}
```

Otherwise, this `dataListener()` is very similar to `2d_array.md`.

```javascript
function dataListener(x0, y0, x1, y1) {
    return {
        num_rows: DATA.length,
        num_columns: DATA[0].row.length,
        row_headers: DATA.slice(y0, y1).map((z) => z.path.slice()),
        column_headers: COLUMNS.slice(x0, x1),
        data: transpose(DATA.slice(y0, y1).map(({ row }) => row.slice(x0, x1))),
    };
}
```

## Custom Style

Directory and file icon styles applied as classes, using `getMeta()`, every `td`
is mapped back to it's row in `DATA`.

```javascript
function styleListener() {
    for (const td of window.regularTable.querySelectorAll("tbody th")) {
        const { y, value } = window.regularTable.getMeta(td);
        const { row, is_open } = DATA[y];
        const [, type] = row;
        td.classList.toggle("fb-directory", !!value && type === "directory");
        td.classList.toggle("fb-file", !!value && type === "file");
        td.classList.toggle("fb-open", !!value && is_open);
    }
}
```

## UI

When directory rows are clicked, generate new directory contents at the `td`
metadata's `y` coordinate in `DATA` and redraw.

```javascript
// TODO `resetAutoSize()` is not documented - this is currently required to
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
```

## Main

```javascript
export function init() {
    regularTable.setDataListener(dataListener);
    regularTable.addStyleListener(styleListener);
    regularTable.addEventListener("mousedown", mousedownListener);
    regularTable.addEventListener("scroll", () => {
        regularTable._resetAutoSize();
    });
    regularTable.draw();
}
```

```html
<script type="module">
    import { init } from "/dist/examples/file_browser.js";
    window.addEventListener("load", () => init());
</script>
```

## CSS

Icons

```css
tbody th.fb-directory:before {
    font-family: "Material Icons";
    content: "folder ";
}
tbody th.fb-directory.fb-open:before {
    content: "folder_open ";
}
tbody th.fb-file:before {
    font-family: "Material Icons";
    content: "text_snippet ";
}
```

Basic theme

```css
table thead,
table tbody {
    user-select: none;
}
td:first-of-type,
head th {
    text-align: right;
}
```

Set dimensions of "tree" structure.

```css
tbody th:empty {
    min-width: 20px;
    max-width: 20px;
}
```

## Appendix (Utilities)

```javascript
function numberFormat(x) {
    const formatter = new Intl.NumberFormat("en-us", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
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
        second: "numeric",
    });
    return formatter.format(x);
}
```

## Appendix (Dependencies)

```html
<script src="/dist/esm/regular-table.js"></script>
<link rel="stylesheet" href="/dist/css/material.css" />
```

```block
license: apache-2.0
```
