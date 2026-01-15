// ## Canvas Data Model
//
// An example of using a `<canvas>` element as a data model for
// [`regular-table`](https://github.com/finos/regular-table). As you `mouseover`
// the image, a cursor tooltip `<regular-table>` shows a zoom-in via a virtual data
// model which defers to
// [`context.getImageData()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getImageData).
//
// Alternative large format images
//
// - https://upload.wikimedia.org/wikipedia/commons/d/d6/STS120LaunchHiRes-edit1.jpg
// - https://upload.wikimedia.org/wikipedia/commons/7/7a/Cassius_Marcellus_Coolidge_-_Poker_Game_%281894%29.png
// - https://upload.wikimedia.org/wikipedia/commons/1/13/Un_bar_aux_Folies-Berg%C3%A8re_d%27E._Manet_%28Fondation_Vuitton%2C_Paris%29_%2833539037428%29.jpg

import "/dist/esm/regular-table.js";

const ref_image = document.getElementById("ref_image");
const table = document.getElementsByTagName("regular-table")[0];
const canvas = document.createElement("canvas");
const scroll_container = window.scroll_container;
const reticle = window.reticle;

const formatter = new Intl.NumberFormat("en-us");
const clamp = (x, y) => formatter.format(Math.floor(x / y) * y);

ref_image.onload = async function () {
    canvas.width = ref_image.width;
    canvas.height = ref_image.height;
    const context = canvas.getContext("2d");
    context.drawImage(ref_image, 0, 0, ref_image.width, ref_image.height);
    scroll_container.removeChild(ref_image);
    scroll_container.appendChild(canvas);

    table.addStyleListener(() => {
        const tds = table.querySelectorAll("td");
        for (const td of tds) {
            td.style.backgroundColor = td.textContent;
            td.innerHTML = " ";
        }
    });

    const column_names = Array.from(Array(canvas.width).keys());

    table.setDataListener((x0, y0, x1, y1) => {
        const data = [];
        for (let i = x0; i < x1; i++) {
            const column = [];
            data.push(column);
            for (let j = y0; j < y1; j++) {
                const [r, g, b] = context.getImageData(i, j, 1, 1).data;
                column.push(`rgb(${r},${g},${b})`);
            }
        }
        return {
            data,
            row_headers:
                y1 - y0 === 0
                    ? []
                    : Array.from(Array(Math.floor(y1 - y0)).keys()).map((z) => [
                          clamp(y0 + z, 10),
                          (y0 + z) % 10,
                      ]),
            column_headers: column_names
                .slice(x0, x1)
                .map((x) => [clamp(x, 10), x % 10]),
            num_rows: canvas.height,
            num_columns: column_names.length,
        };
    });

    await table.draw();
};

if (ref_image.complete || ref_image.naturalWidth > 0) {
    ref_image.onload();
}

window.addEventListener("mousemove", (event) => {
    const x = event.clientX + scroll_container.scrollLeft;
    const y = event.clientY + scroll_container.scrollTop;
    reticle.style.top = `${y}px`;
    reticle.style.left = `${x}px`;
    const top_scroll_limit =
        scroll_container.scrollTop + window.innerHeight - 424;
    const left_scroll_limit =
        scroll_container.scrollLeft + window.innerWidth - 424;
    if (top_scroll_limit < y + 20 && left_scroll_limit < x + 20) {
        if (y - top_scroll_limit < x - left_scroll_limit) {
            table.style.top = `${top_scroll_limit}px`;
            table.style.left = `${x - 424}px`;
        } else {
            table.style.top = `${y - 424}px`;
            table.style.left = `${left_scroll_limit}px`;
        }
    } else {
        table.style.top = `${Math.min(top_scroll_limit, y + 20)}px`;
        table.style.left = `${Math.min(left_scroll_limit, x + 20)}px`;
    }
    table.scrollToCell(x, y, canvas.width, canvas.height);
});
