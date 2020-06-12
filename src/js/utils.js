/******************************************************************************
 *
 * Copyright (c) 2020, the Regular Table Authors.
 *
 * This file is part of the Regular Table library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */

/******************************************************************************
 *
 * Profling
 *
 */

let AVG = 0,
    TOTAL = 0,
    START = performance.now();

export function get_draw_fps() {
    const now = performance.now();
    const elapsed = now - START;
    const avg = AVG;
    const real_fps = (TOTAL * 1000) / elapsed;
    const virtual_fps = 1000 / avg;
    const num_frames = TOTAL;
    AVG = 0;
    TOTAL = 0;
    START = now;
    return {avg, real_fps, virtual_fps, num_frames, elapsed};
}

export function log_perf(x) {
    AVG = (AVG * TOTAL + x) / (TOTAL + 1);
    TOTAL += 1;
}

/******************************************************************************
 *
 * Utils
 *
 */

/**
 * A class method decorate for memoizing method results.  Only works on one
 * arg.
 */
export function memoize(_target, _property, descriptor) {
    const cache = new Map();
    const func = descriptor.value;
    descriptor.value = new_func;
    return descriptor;
    function new_func(arg) {
        if (cache.has(arg)) {
            return cache.get(arg);
        } else {
            const res = func.call(this, arg);
            cache.set(arg, res);
            return res;
        }
    }
}

/**
 * Identical to a non-tagger template literal, this is only used to indicate to
 * babel that this string should be HTML-minified on production builds.
 */
export const html = (strings, ...args) =>
    strings
        .map((str, i) => [str, args[i]])
        .flat()
        .filter((a) => !!a)
        .join("");

const invertPromise = () => {
    let _resolve;
    const promise = new Promise((resolve) => {
        _resolve = resolve;
    });
    promise.resolve = _resolve;
    return promise;
};

export function throttlePromise(target, property, descriptor) {
    const lock = Symbol("private lock");
    const f = descriptor.value;
    descriptor.value = async function (...args) {
        if (this[lock]) {
            await this[lock];
            if (this[lock]) {
                await this[lock];
                return;
            }
        }
        this[lock] = invertPromise();
        let result;
        try {
            result = await f.call(this, ...args);
        } catch (e) {
            console.error(e);
        } finally {
            const l = this[lock];
            this[lock] = undefined;
            l.resolve();
            return result;
        }
    };
    return descriptor;
}
