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
// Tracks the most recent `f` for a tag that arrived while a call for that tag was already
// running - see throttle_tag below.
const PENDING: Map<any, () => Promise<unknown>> = new Map();

export async function flush_tag(
    tag: any,
): Promise<PromiseWithResolvers<undefined> | undefined> {
    await new Promise(requestAnimationFrame);
    return await TAGS.get(tag)?.promise;
}

/**
 * Serializes calls sharing `tag` to at most one running at a time, coalescing any that arrive
 * while one is in flight - e.g. `draw()` calls from a burst of scroll events, where rendering
 * every intermediate frame is wasted work and only the final state matters.
 *
 * Guarantees the *last* request in a burst is eventually honored: a caller that arrives while
 * busy doesn't run `f` itself, but records it as the pending follow-up, and the in-flight call
 * checks for one after finishing and re-runs for it before releasing the tag - looping until
 * nothing new arrived. Earlier versions of this function dropped that guarantee for bursts of
 * three or more overlapping callers (the third caller could return without `f` ever running
 * again for its state), which surfaced as stale rendering - e.g. a virtual-scroll transform
 * offset left over from an earlier point in a fast scroll gesture, never corrected because the
 * final call in the burst was silently discarded rather than deferred.
 */
export async function throttle_tag<T>(
    tag: any,
    f: () => Promise<T>,
): Promise<T | undefined> {
    if (TAGS.has(tag)) {
        PENDING.set(tag, f);
        await TAGS.get(tag)?.promise;
        return;
    }

    TAGS.set(tag, Promise.withResolvers());
    try {
        let current = f;
        let result: T | undefined;
        for (;;) {
            result = await current();
            const next = PENDING.get(tag);
            if (next === undefined) {
                break;
            }
            PENDING.delete(tag);
            current = next as () => Promise<T>;
        }
        return result;
    } finally {
        PENDING.delete(tag);
        const l = TAGS.get(tag);
        TAGS.delete(tag);
        l?.resolve(undefined);
    }
}
