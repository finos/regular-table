# Striped

An example of adding stripes to a [`regular-table`](https://github.com/jpmorganchase/regular-table)
by setting the each `tr`s `background-color`.

Lets start by adding a `<regular-table>` to the page with an `id` that will
be accessible on the window object using [`window.${id}`](https://stackoverflow.com/questions/18713272/why-do-dom-elements-exist-as-properties-on-the-window-object).

```html
<regular-table id="stripedRegularTable"></regular-table>
```

## Styling

For some basic stripes, we could simply add a `.stripes` class alternating
the style on `tr:nth-child(odd)` and `tr:nth-child(even)`.

```css
.stripes tbody tr:nth-child(odd) td { 
    background-color: #ddd;
}

.stripes tbody tr:nth-child(even) td {
    background-color: #eee;
}
```

However by simply adding stripes to the rows, the top-most row will always show
with the darker `background-color: #ddd`, and the next row will retain its
even, `background-color: #eee`, style as the user scrolls - repeating for each
row and making the striping look inconsistent.

We're going to add the `.reverse-stripes` class for use in our 
`alternateStripes()` function that applies a `StyleListener`.

```css
.reverse-stripes tbody tr:nth-child(odd) td {
    background-color: #eee;
}

.reverse-stripes tbody tr:nth-child(even) td {
    background-color: #ddd;
}
```

## Adding a `StyleListener` with `alternateStripes()`

Adding a `StyleListener` to the `<regular-table>` in our `alternateStripes()`
function will ensure that the odd and even styling will alternate depending
on the oddness/evenness of the top-most row.

We can `getMeta()` from the table and add/remove our `.stipes` and 
`.reverse-stripes` classes based on the evenness of the `meta.y0` or the `y` 
index of the viewport origin.

```javascript

const STRIPES_CLASS = "stripes";
const REVERSE_STRIPES_CLASS = "reverse-stripes";

const alternateStripes = (table) => {
    table.addStyleListener(() => {
        const tds = table.querySelectorAll("tbody td");
        const meta = table.getMeta(tds[0]);

        if (meta) {
            if (meta.y0 % 2 === 0) {
                table.classList.remove(REVERSE_STRIPES_CLASS);
                table.classList.add(STRIPES_CLASS);
            } else {
                table.classList.remove(STRIPES_CLASS);
                table.classList.add(REVERSE_STRIPES_CLASS);
            }
        }
    });
    return table;
};

```

Lets set up an `init()` to use the `dataListener` from 
`two_billion_rows` 
to `setDataListener()`, call our `alternateStripes()` function and then invoke 
`draw()`. We'll check that the `#stripedRegularTable` exists first.

```javascript
function init() {
    if (window.stripedRegularTable) {
        window.stripedRegularTable.setDataListener(window.dataListener);
        alternateStripes(window.stripedRegularTable);
        window.stripedRegularTable.draw();
    }
}

window.addEventListener("load", () => init());
```

## Appendix (Dependencies)

The usual suspects.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

Borrow utility functions from the `two_billion_rows` example.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```
