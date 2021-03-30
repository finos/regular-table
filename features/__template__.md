## Title

Short, plain English description of the feature goes here. This should explain
how the UX of the feature works, not be a cookie-cutter description e.g. "An
example of _feature\_\_", "This examples implements \_feature_". Avoid
discussing the implementation, this is what the rest of the file is for!

Be sure to run `yarn fix` to apply prettier formatting as lint is an error now.

### API

The main `<script>` entrypoint which describes the API usage, followed by the
literate code for the public functions, e.g. those that are `export` qualified.
`<script>` tags can import modules from the relative path, or the
project-relative path for modules from _other_ examples or features.

```html
<script type="module">
    import { style } from "./title.js";
    import { dataListener } from "/dist/examples/two_billion_rows.js";
    const table = document.querySelector("regular-table");
    table.addStyleListener(style());
    table.addDataListener(dataListener);
</script>
```

Describe the exported functions and their API here. Section is followed by an
`<hr/>`

```javascript
export function style(options) {
    return _style(options);
}
```

<hr/>

### ** Other code sections go here **

The literate implementation prose and code for private functions.

```javascript
function _style(options) {
    console.log("Not Implemented");
}
```

### Stylin

Style sections may also be intermixed in the code sections as needed, but
attempt to prefer a separate styling section for

```css
regular-table {
    background-color: "red";
}
```

### Appendix (Utilities)

You can put _small_ unrealted dependency functions here.

```javascript
function add(x, y) {
    return x + y;
}
```

### Appendix (Dependencies)

HTML dependencies for `bl.ocks` go here and don't need prose.

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel="stylesheet" href="/dist/css/material.css" />
```

### Appendix (Metadata)

`block` section is always last and does not require prose.

```block
license: apache-2.0
```
