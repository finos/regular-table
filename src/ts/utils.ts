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

import { FPSRecord } from "./types";

/******************************************************************************
 *
 * Profling
 *
 */

let AVG = 0,
    TOTAL = 0,
    START = performance.now();

export function get_draw_fps(): FPSRecord {
    const now = performance.now();
    const elapsed = now - START;
    const avg = AVG;
    const real_fps = (TOTAL * 1000) / elapsed;
    const virtual_fps = 1000 / avg;
    const num_frames = TOTAL;
    AVG = 0;
    TOTAL = 0;
    START = now;
    return { avg, real_fps, virtual_fps, num_frames, elapsed };
}

export function log_perf(x: number) {
    AVG = (AVG * TOTAL + x) / (TOTAL + 1);
    TOTAL += 1;
}

/******************************************************************************
 *
 * Utils
 *
 */

const TAGS: Map<any, PromiseWithResolvers<undefined>> = new Map();

export async function flush_tag(
    tag: any,
): Promise<PromiseWithResolvers<undefined> | undefined> {
    await new Promise(requestAnimationFrame);
    return await TAGS.get(tag);
}

export async function throttle_tag<T>(
    tag: any,
    f: () => Promise<T>,
): Promise<T | undefined> {
    if (TAGS.has(tag)) {
        await TAGS.get(tag);
        if (TAGS.has(tag)) {
            await TAGS.get(tag);
            return;
        }
    }

    TAGS.set(tag, Promise.withResolvers());
    try {
        return await f();
    } finally {
        const l = TAGS.get(tag);
        TAGS.delete(tag);
        l?.resolve(undefined);
    }
}
