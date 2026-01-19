// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ░░░░░░░░░░▄▀░█▀▄░█▀▀░█▀▀░█░█░█░░░█▀█░█▀▄░░░░░▀█▀░█▀█░█▀▄░█░░░█▀▀░▀▄░░░░░░░░░░
// ░░░░░░░░░▀▄░░█▀▄░█▀▀░█░█░█░█░█░░░█▀█░█▀▄░▀▀▀░░█░░█▀█░█▀▄░█░░░█▀▀░░▄▀░░░░░░░░░
// ░░░░░░░░░░░▀░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀░▀░░░░░░▀░░▀░▀░▀▀░░▀▀▀░▀▀▀░▀░░░░░░░░░░░
// ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃  *  Copyright (c) 2020, the Regular Table Authors. This file is part   *  ┃
// ┃  *  of the Regular Table library, distributed under the terms of the   *  ┃
// ┃  *  [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). *  ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

import { METADATA_MAP } from "./constants";
import { CellMetadata, ColumnSizes } from "./types";

/******************************************************************************
 *
 * View Model
 *
 */

class ElemFactory {
    private _name: string;
    private _elements: HTMLElement[];
    private _index: number;
    constructor(name: string) {
        this._name = name;
        this._elements = [];
        this._index = 0;
    }

    reset() {
        this._index = 0;
    }

    get() {
        if (!this._elements[this._index]) {
            this._elements[this._index] = document.createElement(this._name);
        }

        const elem = this._elements[this._index];
        this._index += 1;
        return elem;
    }
}

export class ViewModel {
    protected _column_sizes: ColumnSizes;
    protected _container: HTMLElement;
    public _span_factory: ElemFactory;
    public table: HTMLElement;
    public cells: (HTMLTableCellElement | undefined)[][];
    public rows: HTMLTableRowElement[];

    constructor(
        column_sizes: ColumnSizes,
        container: HTMLElement,
        table: HTMLElement,
    ) {
        this._column_sizes = column_sizes;
        this._container = container;
        this._span_factory = new ElemFactory("span");
        this.table = table;
        this.cells = [];
        this.rows = [];
    }

    num_columns(): number {
        return this._get_row(Math.max(0, this.rows.length - 1)).row_container
            .length;
    }

    num_rows(): number {
        return this.cells.length;
    }

    _set_metadata(td: HTMLTableCellElement, metadata: CellMetadata): void {
        METADATA_MAP.set(td, metadata);
    }

    _get_or_create_metadata(
        td: HTMLTableCellElement | undefined,
    ): CellMetadata {
        if (!td) {
            return { value: undefined };
        }
        let metadata = METADATA_MAP.get(td);
        if (!metadata) {
            metadata = { value: undefined };
            METADATA_MAP.set(td, metadata);
        }
        return metadata;
    }

    _replace_cell(
        ridx: number,
        cidx: number,
    ): HTMLTableCellElement | undefined {
        const { tr, row_container } = this._get_row(ridx);
        let td = row_container[cidx];
        if (td) {
            tr.removeChild(td);
            row_container.splice(cidx, 1, undefined);
        }
        return td;
    }

    _fetch_cell(ridx: number, cidx: number): HTMLTableCellElement | undefined {
        if (ridx < 0 || cidx < 0) {
            return;
        }

        return this.cells[ridx]?.[cidx];
    }

    _get_row(ridx: number): {
        tr: HTMLTableRowElement;
        row_container: (HTMLTableCellElement | undefined)[];
    } {
        let tr = this.rows[ridx];
        if (!tr) {
            tr = this.rows[ridx] = document.createElement("tr");
            this.table.appendChild(tr);
        }

        let row_container = this.cells[ridx];
        if (!row_container) {
            row_container = this.cells[ridx] = [];
        }

        return { tr, row_container };
    }

    _get_cell(tag = "TD", ridx: number, cidx: number): HTMLTableCellElement {
        const { tr, row_container } = this._get_row(ridx);
        let td = row_container[cidx];
        if (!td) {
            if (cidx < row_container.length) {
                td = row_container[cidx] = document.createElement(
                    tag,
                ) as HTMLTableCellElement;
                const nextCell = row_container.slice(cidx + 1).find((x) => x);
                tr.insertBefore(td, nextCell || null);
            } else {
                td = row_container[cidx] = document.createElement(
                    tag,
                ) as HTMLTableCellElement;
                tr.appendChild(td);
            }
        }

        if (td.tagName !== tag) {
            const new_td = document.createElement(tag) as HTMLTableCellElement;
            tr.replaceChild(new_td, td);
            this.cells[ridx].splice(cidx, 1, new_td);
            td = new_td;
        }

        return td;
    }

    _clean_columns(cidx: number | number[]): void {
        for (let i = 0; i < this.rows.length; i++) {
            const tr = this.rows[i];
            const row_container = this.cells[i];
            row_container.length = (Array.isArray(cidx) ? cidx[i] : cidx) || 0;
            const idx = this.cells[i].filter((x) => x !== undefined).length;
            const toRemove: Element[] = [];
            for (let j = idx; j < tr.children.length; j++) {
                toRemove.push(tr.children[j]);
            }

            for (const node of toRemove) {
                node.remove();
            }
        }
    }

    _clean_rows(ridx: number): void {
        // Batch collect rows to remove, then remove all at once
        const toRemove: Element[] = [];
        for (let i = ridx; i < this.table.children.length; i++) {
            toRemove.push(this.table.children[i]);
        }

        for (const node of toRemove) {
            node.remove();
        }

        this.rows.length = ridx;
        this.cells.length = ridx;
    }
}
