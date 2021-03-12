# Row Stripes

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
    background-color: #EAEDEF;
}

.stripes tbody tr:nth-child(even) td {
    background-color: white;
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
    background-color: white;
}

.reverse-stripes tbody tr:nth-child(even) td {
    background-color: #EAEDEF;
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
const EVEN_STRIPE_CLASS = "stripes";
const ODD_STRIPE_CLASS = "reverse-stripes";

const alternateStripes = (table, {evenStripeClassName = EVEN_STRIPE_CLASS, oddStripeClassName = ODD_STRIPE_CLASS} = {}) => {
    table.addStyleListener(() => {
        const tds = table.querySelectorAll("tbody tr:nth-of-type(1) td");
        const meta = table.getMeta(tds[0]);

        if (meta) {
            if (meta.y0 % 2 === 0) {
                table.classList.remove(oddStripeClassName);
                table.classList.add(evenStripeClassName);
            } else {
                table.classList.remove(evenStripeClassName);
                table.classList.add(oddStripeClassName);
            }
        }
    });
    return table;
};
```

## Virtual Data Model

To see the stripes scroll and test out our example, we'll need a large
enough data set. The `generateDataListener()` function takes a
`num_rows` and `num_columns` and generates a test `DataListener` making use of
the `range()` and `formatter()` utility functions from `two_billion_rows`
example included in the dependencies below.

```javascript
function generateDataListener(num_rows, num_columns) {
    return function dataListener(x0, y0, x1, y1) {
        return {
            num_rows,
            num_columns,
            row_headers: range(y0, y1, group_header.bind(null, "Row")),
            column_headers: range(x0, x1, group_header.bind(null, "Column")),
            data: range(x0, x1, (x) => range(y0, y1, (y) => formatter.format(x + y))),
        };
    };
}
```

Lets set up by using `generateDataListener()` to create a 10k row data set and
call `setDataListener()` with it.
Next we'll call our `alternateStripes()` function passing in the `#stripedRegularTable`
and then invoke `draw()` - checking that the `#stripedRegularTable` exists first.
All of this will be invoked on `"load"`.

```html
<script>
window.addEventListener("load", () => {
    if (window.stripedRegularTable) {
        const dataListener = generateDataListener(10000, 50);
        window.stripedRegularTable.setDataListener(dataListener);
        alternateStripes(window.stripedRegularTable);
        window.stripedRegularTable.draw();
    }
});
</script>
```

## Appendix (Exports)

This is the public function you can use.

```javascript
exports.alternateStripes = alternateStripes;
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

```block
license: apache-2.0
```