// # React
//
// An example of using [`regular-table`](https://github.com/finos/regular-table)
// with React, which is incredibly easy because `<regular-table>` is a Web
// Component. There is a `#root` element:
//
// ... and a simple `render()` which uses a `Ref` to capture the `<regular-table>`
// and call `setDataListener()`. `regular-table` is not particualrly expensive to
// initialize, but it does retain some state between calls that makes it even more
// performant, so it is worth trying to prevente React from re-rendering it.

import "/dist/esm/regular-table.js";
import { dataListener } from "/examples/two_billion_rows/two_billion_rows.js";

import "/node_modules/react/dist/react.js";
import "/node_modules/react-dom/dist/react-dom.js";

function setRegularTable(table) {
    table.setDataListener(dataListener(1000, 50));
    table.draw();
}

window.addEventListener("load", () => {
    const element = window.React.createElement("regular-table", {
        ref: setRegularTable,
    });

    window.ReactDOM.render(element, window.root);
});
