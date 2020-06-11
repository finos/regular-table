# React 

An example of using [`regular-table`](https://github.com/jpmorganchase/regular-table)
with React, which is incredibly easy because `<regular-table>` is a Web
Component.  There is a `#root` element:

```html
<div id="root"></div>
```

... and a simple `render()` which uses a `Ref` to capture the `<regular-table>`
and call `setDataListener()`.  `regular-table` is not particualrly expensive to
initialize, but it does retain some state between calls that makes it even more
performant, so it is worth trying to prevente React from re-rendering it.

```javascript
function setRegularTable(table) {
    table.setDataListener(window.dataListener);
    table.draw();
}

window.addEventListener("load", () => {
    const element = window.React.createElement("regular-table", {ref: setRegularTable});
    window.ReactDOM.render(element, window.root);
});
```

## Styling

Grey is drab.

```css
td {
    color: #1078d1;
}
```

## Appendix (Dependencies)

The usual suspects.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

This example also requires React.

```html
<script src="/node_modules/react/dist/react.js"></script>
<script src="/node_modules/react-dom/dist/react-dom.js"></script>
```

Borrow a data model from `two_billion_rows`.

```html
<script src="/dist/examples/two_billion_rows.js"></script>
```