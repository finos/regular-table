# Row Stripes

Adding row stripes to a table, at its most basic, could be accomplished by adding `odd` and `even` css rules to each of the rows in the `<regular-table>`. Given this approach, a user would notice that on `"scroll"` the rows don't alternate, and the stripes remain fixed. The top-most row would always show the darker `background-color`, and the next row would retain its lighter, even `background-color` - repeating for each row and making the striping look inconsistent.

By alternating our css rules based on the oddness or evenness of the first row in the data set, we can ensure that the data and stripes style remain consistent as the user scrolls the table.

# API

```html
<regular-table id="example_table"></regular-table>
```

Lets set up by using `dataListener()` from `two_billion_rows` to create a data set and then call `setDataListener()` with it. Next we'll call our `alternateStripes()` function passing in the `<regular-table>` and then invoke `draw()` - checking that the `#stripedRegularTable` exists first. All of this will be invoked on `"load"`.

```html
<script type="module">
    import { alternateStripes } from "./index.js";
    import { dataListener } from "https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/examples/two_billion_rows.js";

    window.addEventListener("load", () => {
        const dl = dataListener(1000, 50);
        example_table.setDataListener(dl);
        window.removeStripes = alternateStripes(example_table);
        example_table.draw();
    });
</script>
```

## `alternateStripes()`

Adding a `StyleListener` to the `<regular-table>` in our `alternateStripes()` function will ensure that the odd and even styling will alternate depending on the oddness/evenness of the top-most row. We can `getMeta()` from the table and add/remove our `.stipes` and `.reverse-stripes` classes based on the evenness of the `meta.y0` or the `y` index of the viewport origin. We will also make sure to return a function that removes the style listener (using the return value of `addStyleListener()`) and the attached classes for cleanup purposes. Once this function is called, the stripes will be gone and no longer get applied as the user scrolls - this is because the style listener has been removed.

```javascript
const EVEN_STRIPE_CLASS = "stripes";
const ODD_STRIPE_CLASS = "reverse-stripes";

export const alternateStripes = (
    table,
    {
        evenStripeClassName = EVEN_STRIPE_CLASS,
        oddStripeClassName = ODD_STRIPE_CLASS,
    } = {}
) => {
    const removeStyleListener = table.addStyleListener(() => {
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

    return () => {
        removeStyleListener();
        table.classList.remove(evenStripeClassName);
        table.classList.remove(oddStripeClassName);
    };
};
```

## Styling

For some basic stripes, we could simply add a `.stripes` class alternating the style on `tr:nth-child(odd)` and `tr:nth-child(even)`.

```css
.stripes tbody tr:nth-child(odd) td {
    background-color: #eaedef;
}

.stripes tbody tr:nth-child(even) td {
    background-color: white;
}
```

And a `.reverse-stripes` class that swaps the `odd` and `even` styles.

```css
.reverse-stripes tbody tr:nth-child(odd) td {
    background-color: white;
}

.reverse-stripes tbody tr:nth-child(even) td {
    background-color: #eaedef;
}
```

## Appendix (Dependencies)

```html
<script src="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/regular-table@0.5.6/dist/css/material.css" />
```

```block
license: apache-2.0
```

