let _index = import("./index.js");

function _rebase_class(target, source, depth) {
    if (depth !== 0) {
        _rebase_class(target, source.__proto__, depth - 1);
    }
    const {constructor: _, ...prototypePatch} = Object.getOwnPropertyDescriptors(source);
    Object.defineProperties(target, {...prototypePatch});
}

class RegularTableElement extends HTMLElement {
    async _await_index(f) {
        let mod = await _index;
        _index = mod;
        this._module = true;
        _rebase_class(this, mod.RegularTableElement.prototype, 2);
        this._set_event_model();
        f();
    }

    connectedCallback() {
        this._await_index(() => this.connectedCallback());
    }

    clear() {
        this._await_index(() => this.clear());
    }

    addStyleListener(styleListener) {
        this._await_index(() => this.addStyleListener(styleListener));
    }

    async draw(...args) {
        await this._await_index(() => this.draw(...args));
    }

    async notifyResize(...args) {
        await this._await_index(() => this.notifyResize(...args));
    }

    getMeta() {
        throw new Error("Not async");
    }

    getDrawFPS() {
        throw new Error("Not async");
    }

    async scrollToCell(x, y, ncols, nrows) {
        await this._await_index(() => this.scrollToCell(x, y, ncols, nrows));
    }

    setDataListener(dataListener) {
        this._await_index(() => this.setDataListener(dataListener));
    }
}

if (document.createElement("regular-table").constructor === HTMLElement) {
    window.customElements.define("regular-table", RegularTableElement);
}
