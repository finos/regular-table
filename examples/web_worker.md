
# Web Worker

```html
<script src="/dist/umd/regular-table.js"></script>
<link rel='stylesheet' href="/dist/css/material.css">
```

```css
td {
    color: #1078d1;
}
```

```html
<regular-table></regular-table>
```

```html
<script id="two_billion_worker" type="javascript/worker">

    const NUM_ROWS = 2000000000;
    const NUM_COLUMNS = 1000;

    const formatter = new Intl.NumberFormat("en-us");
    const range = (x0, x1, f) => Array.from(Array(x1 - x0).keys()).map((x) => f(x + x0));

    function dataListener(x0, y0, x1, y1) {
        return {
            num_rows: NUM_ROWS,
            num_columns: NUM_COLUMNS,
            column_headers: range(x0, x1, (i) => [`Column ${i}`]),
            data: range(x0, x1, (x) => range(y0, y1, (y) => formatter.format(x + y))),
        };
    }

    self.addEventListener("message", async (event) => {
        const response = await dataListener.apply(null, event.data);
        self.postMessage(response);
    });

</script>
```

```javascript
const blob = new Blob([document.querySelector("#two_billion_worker").textContent]);
const worker = new Worker(window.URL.createObjectURL(blob, {type: "text/javascript"}));
const regularTable = document.getElementsByTagName("regular-table")[0];

let callback;

worker.addEventListener("message", (event) => {
    callback(event.data);
});

regularTable.setDataListener((...viewport) => {
    return new Promise(function (resolve) {
        callback = resolve;
        worker.postMessage(viewport);
    });
});

regularTable.draw();
```