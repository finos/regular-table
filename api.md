## Classes

<dl>
<dt><a href="#RegularTableElement">RegularTableElement</a> ⇐ <code>HTMLElement</code></dt>
<dd><p>The <code>&lt;regular-table&gt;</code> custom element.</p>
<p>This module has no exports, but importing it has a side effect: the
<code>RegularTableElement</code> class is registered as a custom element, after which
it can be used as a standard DOM element.</p>
<p>The documentation in this module defines the instance structure of a
<code>&lt;regular-table&gt;</code> DOM object instantiated typically, through HTML or any
relevent DOM method e.g. <code>document.createElement(&quot;perspective-viewer&quot;)</code> or
<code>document.getElementsByTagName(&quot;perspective-viewer&quot;)</code>.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Performance">Performance</a> : <code>object</code></dt>
<dd><p>An object with performance statistics about calls to
<code>draw()</code> from some time interval (captured in milliseconds by the
<code>elapsed</code> proprty).</p>
</dd>
<dt><a href="#MetaData">MetaData</a> : <code>object</code></dt>
<dd><p>An object describing virtual rendering metadata about an
<code>HTMLTableCellElement</code>, use this object to map rendered <code>&lt;th&gt;</code> or <code>&lt;td&gt;</code>
elements back to your <code>data</code>, <code>row_headers</code> or <code>column_headers</code> within
listener functions for <code>addStyleListener()</code> and <code>addEventListener()</code>.</p>
</dd>
<dt><a href="#DataResponse">DataResponse</a> : <code>object</code></dt>
<dd><p>The <code>DataResponse</code> object describes a rectangular region of a virtual
data set, and some associated metadata.  <code>&lt;regular-table&gt;</code> will use this
object to render the <code>&lt;table&gt;</code>, though it may make multiple requests for
different regions to achieve a compelte render as it must estimate
certain dimensions.  You must construct a <code>DataResponse</code> object to
implement a <code>DataListener</code>.</p>
</dd>
<dt><a href="#DataListener">DataListener</a> ⇒ <code><a href="#DataResponse">Promise.&lt;DataResponse&gt;</a></code></dt>
<dd><p>The <code>DataListener</code> is similar to a normal event listener function.
Unlike a normal event listener, it takes regular arguments (not an
<code>Event</code>); and returns a <code>Promise</code> for a <code>DataResponse</code> object for this
region (as opposed to returning <code>void</code> as a standard event listener).</p>
</dd>
</dl>

<a name="RegularTableElement"></a>

## RegularTableElement ⇐ <code>HTMLElement</code>
The `<regular-table>` custom element.

This module has no exports, but importing it has a side effect: the
`RegularTableElement` class is registered as a custom element, after which
it can be used as a standard DOM element.

The documentation in this module defines the instance structure of a
`<regular-table>` DOM object instantiated typically, through HTML or any
relevent DOM method e.g. `document.createElement("perspective-viewer")` or
`document.getElementsByTagName("perspective-viewer")`.

**Kind**: global class  
**Extends**: <code>HTMLElement</code>  
**Access**: public  

* [RegularTableElement](#RegularTableElement) ⇐ <code>HTMLElement</code>
    * [.addStyleListener(styleListener)](#RegularTableElement+addStyleListener) ⇒ <code>number</code>
    * [.getMeta(element)](#RegularTableElement+getMeta) ⇒ [<code>MetaData</code>](#MetaData)
    * [.getDrawFPS()](#RegularTableElement+getDrawFPS) ⇒ [<code>Performance</code>](#Performance)
    * [.scrollToCell(x, y, ncols, nrows)](#RegularTableElement+scrollToCell)
    * [.setDataListener(dataListener)](#RegularTableElement+setDataListener)


* * *

<a name="RegularTableElement+addStyleListener"></a>

### regularTableElement.addStyleListener(styleListener) ⇒ <code>number</code>
Adds a style listener callback. The style listeners are called
whenever the <table> is re-rendered, such as through API invocations
of draw() and user-initiated events such as scrolling. Within this
optionally async callback, you can select <td>, <th>, etc. elements
via regular DOM API methods like querySelectorAll().

**Kind**: instance method of [<code>RegularTableElement</code>](#RegularTableElement)  
**Returns**: <code>number</code> - The index of the added listener.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| styleListener | <code>function</code> | A (possibly async) function that styles the inner <table>. |

**Example**  
```js
table.addStyleListener(() => {
    for (const td of table.querySelectorAll("td")) {
        td.setAttribute("contenteditable", true);
    }
});
```

* * *

<a name="RegularTableElement+getMeta"></a>

### regularTableElement.getMeta(element) ⇒ [<code>MetaData</code>](#MetaData)
Returns the `MetaData` object associated with a `<td>` or `<th>`.  When
your `StyleListener` is invoked, use this method to look up additional
`MetaData` about any `HTMLTableCellElement` in the rendered `<table>`.

**Kind**: instance method of [<code>RegularTableElement</code>](#RegularTableElement)  
**Returns**: [<code>MetaData</code>](#MetaData) - The metadata associated with the element.  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| element | <code>HTMLTableCellElement</code> \| [<code>Partial.&lt;MetaData&gt;</code>](#MetaData) | The child element of this `<regular-table>` for which to look up metadata, or a coordinates-like object to refer to metadata by logical position. |

**Example**  
```js
const elems = document.querySelector("td:last-child td:last_child");
const metadata = table.getMeta(elems);
console.log(`Viewport corner is ${metadata.x}, ${metadata.y}`);
```
**Example**  
```js
const header = table.getMeta({row_header_x: 1, y: 3}).row_header;
```

* * *

<a name="RegularTableElement+getDrawFPS"></a>

### regularTableElement.getDrawFPS() ⇒ [<code>Performance</code>](#Performance)
Get performance statistics about this `<regular-table>`.  Calling this
method resets the internal state, which makes it convenient to measure
performance at regular intervals (see example).

**Kind**: instance method of [<code>RegularTableElement</code>](#RegularTableElement)  
**Returns**: [<code>Performance</code>](#Performance) - Performance data aggregated since the last
call to `getDrawFPS()`.  
**Access**: public  
**Example**  
```js
const table = document.getElementById("my_regular_table");
setInterval(() => {
    const {real_fps} = table.getDrawFPS();
    console.log(`Measured ${fps} fps`)
});
```

* * *

<a name="RegularTableElement+scrollToCell"></a>

### regularTableElement.scrollToCell(x, y, ncols, nrows)
Call this method to set the `scrollLeft` and `scrollTop` for this
`<regular-table>` by calculating the position of this `scrollLeft`
and `scrollTop` relative to the underlying widths of its columns
and heights of its rows.

**Kind**: instance method of [<code>RegularTableElement</code>](#RegularTableElement)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | The left most `x` index column to scroll into view. |
| y | <code>number</code> | The top most `y` index row to scroll into view. |
| ncols | <code>number</code> | Total number of columns in the data model. |
| nrows | <code>number</code> | Total number of rows in the data model. |

**Example**  
```js
table.scrollToCell(1, 3, 10, 30);
```

* * *

<a name="RegularTableElement+setDataListener"></a>

### regularTableElement.setDataListener(dataListener)
Call this method to set `DataListener` for this `<regular-table>`,
which will be called whenever a new data slice is needed to render.
Calls to `draw()` will fail if no `DataListener` has been set

**Kind**: instance method of [<code>RegularTableElement</code>](#RegularTableElement)  
**Access**: public  

| Param | Type | Description |
| --- | --- | --- |
| dataListener | [<code>DataListener</code>](#DataListener) | `dataListener` is called by to request a rectangular section of data for a virtual viewport, (x0, y0, x1, y1), and returns a `DataReponse` object. |

**Example**  
```js
table.setDataListener((x0, y0, x1, y1) => {
    return {
        num_rows: num_rows = DATA[0].length,
        num_columns: DATA.length,
        data: DATA.slice(x0, x1).map(col => col.slice(y0, y1))
    };
})
```

* * *

<a name="Performance"></a>

## Performance : <code>object</code>
An object with performance statistics about calls to
`draw()` from some time interval (captured in milliseconds by the
`elapsed` proprty).

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| avg | <code>number</code> | Avergage milliseconds per call. |
| real_fps | <code>number</code> | `num_frames` / `elapsed` |
| virtual_fps | <code>number</code> | `elapsed` / `avg` |
| num_frames | <code>number</code> | Number of frames rendered. |
| elapsed | <code>number</code> | Number of milliseconds since last call to `getDrawFPS()`. |


* * *

<a name="MetaData"></a>

## MetaData : <code>object</code>
An object describing virtual rendering metadata about an
`HTMLTableCellElement`, use this object to map rendered `<th>` or `<td>`
elements back to your `data`, `row_headers` or `column_headers` within
listener functions for `addStyleListener()` and `addEventListener()`.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [x] | <code>number</code> | The `x` index in your virtual data model. property is only generated for `<td>`, `<th>` from `row_headers`. |
| [y] | <code>number</code> | The `y` index in your virtual data model. property is only generated for `<td>`, `<th>` from `row_headers`. |
| [x0] | <code>number</code> | The `x` index of the viewport origin in your data model, e.g. what was passed to `x0` when your `dataListener` was invoked. |
| [y0] | <code>number</code> | The `y` index of the viewport origin in your data model, e.g. what was passed to `y0` when your `dataListener` was invoked. |
| [x1] | <code>number</code> | The `x` index of the viewport corner in your data model, e.g. what was passed to `x1` when your `dataListener` was invoked. |
| [y1] | <code>number</code> | The `y` index of the viewport origin in your data model, e.g. what was passed to `y1` when your `dataListener` was invoked. |
| [dx] | <code>number</code> | The `x` index in `DataResponse.data`, this property is only generated for `<td>`, and `<th>` from `column_headers`. |
| [dy] | <code>number</code> | The `y` index in `DataResponse.data`, this property is only generated for `<td>`, `<th>` from `row_headers`. |
| [column_header_y] | <code>number</code> | The `y` index in `DataResponse.column_headers[x]`, this property is only generated for `<th>` from `column_headers`. |
| [column_header_x] | <code>number</code> | The `x` index in `DataResponse.row_headers[y]`, this property is only generated for `<th>` from `row_headers`. |
| size_key | <code>number</code> | The unique index of this column in a full `<table>`, which is `x` + (Total Row Header Columns). |
| [row_header] | <code>Array.&lt;object&gt;</code> | The `Array` for this `y` in `DataResponse.row_headers`, if it was provided. |
| [column_header] | <code>Array.&lt;object&gt;</code> | The `Array` for this `x` in `DataResponse.column_headers`, if it was provided. |

**Example**  
```js
MetaData                     (x = 0, column_header_y = 0))
                             *-------------------------------------+
                             |                                     |
                             |                                     |
                             +-------------------------------------+
(row_header_x = 0, y = 0)    (x = 0, y = 0)
*------------------------+   *-------------------------------------+
|                        |   |                                     |
|                        |   |      (x0, y0)                       |
|                        |   |      *---------------*              |
|                        |   |      |               |              |
|                        |   |      |     * (x, y)  |              |
|                        |   |      |               |              |
|                        |   |      *---------------* (x1, y1)     |
|                        |   |                                     |
+------------------------+   +-------------------------------------+
```

* * *

<a name="DataResponse"></a>

## DataResponse : <code>object</code>
The `DataResponse` object describes a rectangular region of a virtual
data set, and some associated metadata.  `<regular-table>` will use this
object to render the `<table>`, though it may make multiple requests for
different regions to achieve a compelte render as it must estimate
certain dimensions.  You must construct a `DataResponse` object to
implement a `DataListener`.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| [column_headers] | <code>Array.&lt;Array.&lt;object&gt;&gt;</code> | A two dimensional `Array` of column group headers, in specificity order.  No `<thead>` will be generated if this property is not provided. |
| [row_headers] | <code>Array.&lt;Array.&lt;object&gt;&gt;</code> | A two dimensional `Array` of row group headers, in specificity order.  No `<th>` elements within `<tbody>` will be generated if this property is not provided. |
| data | <code>Array.&lt;Array.&lt;object&gt;&gt;</code> | A two dimensional `Array` representing a rectangular section of the underlying data set from (x0, y0) to (x1, y1), arranged in columnar fashion such that `data[x][y]` returns the `y`th row of the `x`th column of the slice. |
| num_rows | <code>number</code> | Total number of rows in the underlying data set. |
| num_columns | <code>number</code> | Total number of columns in the underlying data set. |

**Example**  
```js
{
    "num_rows": 26,
    "num_columns": 3,
    "data": [
        [0, 1],
        ["A", "B"]
    ],
    "row_headers": [
        ["Rowgroup 1", "Row 1"],
        ["Rowgroup 1", "Row 2"]
    ],
    "column_headers": [
        ["Colgroup 1", "Column 1"],
        ["Colgroup 1", "Column 2"]
    ]
}
```

* * *

<a name="DataListener"></a>

## DataListener ⇒ [<code>Promise.&lt;DataResponse&gt;</code>](#DataResponse)
The `DataListener` is similar to a normal event listener function.
Unlike a normal event listener, it takes regular arguments (not an
`Event`); and returns a `Promise` for a `DataResponse` object for this
region (as opposed to returning `void` as a standard event listener).

**Kind**: global typedef  
**Returns**: [<code>Promise.&lt;DataResponse&gt;</code>](#DataResponse) - The resulting `DataResponse`.  Make sure
to `resolve` or `reject` the `Promise`, or your `<regular-table>` will
never render!  

| Param | Type | Description |
| --- | --- | --- |
| x0 | <code>number</code> | The origin `x` index (column). |
| y0 | <code>number</code> | The origin `y` index (row). |
| x1 | <code>number</code> | The corner `x` index (column). |
| y1 | <code>number</code> | The corner `y` index (row). |


* * *

