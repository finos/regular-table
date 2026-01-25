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

/**
 * Performance Benchmark for regular-table
 *
 * This benchmark measures rendering performance during various scroll operations.
 * It collects CPU metrics, FPS, and other performance statistics.
 *
 * Run with: pnpm run benchmark
 */

import { chromium } from "@playwright/test";

// Benchmark configuration
const CONFIG = {
    // Number of scroll iterations for each test
    iterations: 200,

    // Delay between scroll operations (ms) - set to 0 for max stress
    scrollDelay: 0,

    // Scroll amounts per iteration
    scrollPixelsX: 100,
    scrollPixelsY: 100,

    // Data model configuration
    rows: 100000,
    columns: 1000,
    headerDepth: 3,

    // Warmup iterations before measurement
    warmupIterations: 20,

    // Duration for continuous scroll test (ms)
    continuousScrollDuration: 10000,
};

/**
 * Formats a number with commas for readability
 */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Collects CPU metrics from Chrome DevTools Protocol
 */
async function collectCPUMetrics(cdpSession) {
    const metrics = await cdpSession.send("Performance.getMetrics");
    const metricsMap = {};
    for (const metric of metrics.metrics) {
        metricsMap[metric.name] = metric.value;
    }
    return metricsMap;
}

/**
 * Calculates statistics from an array of numbers
 */
function calculateStats(values) {
    if (values.length === 0)
        return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
    };
}

/**
 * Runs a scroll benchmark test
 */
async function runScrollBenchmark(page, cdpSession, scrollFn, name) {
    // console.log(`\n${"=".repeat(60)}`);
    console.log(`Benchmark: ${name}`);
    // console.log("=".repeat(60));

    // Reset scroll position
    await page.evaluate(() => window.resetScroll());
    await page.waitForTimeout(100);

    // Warmup phase
    console.log(`Warming up (${CONFIG.warmupIterations} iterations)...`);
    for (let i = 0; i < CONFIG.warmupIterations; i++) {
        await scrollFn();
        if (CONFIG.scrollDelay > 0) {
            await page.waitForTimeout(CONFIG.scrollDelay);
        }
    }

    // Reset for measurement
    await page.evaluate(() => window.resetScroll());
    await page.waitForTimeout(100);

    // Clear FPS counter
    await page.evaluate(() => window.getTableMetrics());

    // Collect initial CPU metrics
    const cpuBefore = await collectCPUMetrics(cdpSession);
    const startTime = performance.now();

    // Measurement phase
    const frameTimes = [];
    console.log(`Running benchmark (${CONFIG.iterations} iterations)...`);

    for (let i = 0; i < CONFIG.iterations; i++) {
        const frameStart = performance.now();
        await scrollFn();
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);

        if (CONFIG.scrollDelay > 0) {
            await page.waitForTimeout(CONFIG.scrollDelay);
        }
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Collect final CPU metrics
    const cpuAfter = await collectCPUMetrics(cdpSession);

    // Get table's internal FPS metrics
    const tableMetrics = await page.evaluate(() => window.getTableMetrics());

    // Calculate statistics
    const frameStats = calculateStats(frameTimes);

    // Calculate CPU time used
    const cpuTimeUsed = (cpuAfter.TaskDuration - cpuBefore.TaskDuration) * 1000; // Convert to ms
    const scriptTimeUsed =
        (cpuAfter.ScriptDuration - cpuBefore.ScriptDuration) * 1000;
    const layoutTimeUsed =
        (cpuAfter.LayoutDuration - cpuBefore.LayoutDuration) * 1000;
    const recalcStyleTimeUsed =
        (cpuAfter.RecalcStyleDuration - cpuBefore.RecalcStyleDuration) * 1000;

    // Calculate layout and style counts
    const layoutCount = cpuAfter.LayoutCount - cpuBefore.LayoutCount;
    const styleCount = cpuAfter.RecalcStyleCount - cpuBefore.RecalcStyleCount;

    return {
        name,
        frameStats,
        totalTime,
        iterations: CONFIG.iterations,
        throughput: (CONFIG.iterations / totalTime) * 1000,
        tableFps: tableMetrics.fps,
        cpuTime: cpuTimeUsed,
        scriptTime: scriptTimeUsed,
        layoutTime: layoutTimeUsed,
        styleTime: recalcStyleTimeUsed,
        layoutCount,
        styleCount,
        cpuUtilization: (cpuTimeUsed / totalTime) * 100,
    };
}

/**
 * Runs a continuous scroll stress test
 */
async function runContinuousScrollTest(page, cdpSession) {
    // console.log(`\n${"=".repeat(60)}`);
    console.log(
        `Benchmark: Continuous Scroll (${CONFIG.continuousScrollDuration}ms)`,
    );
    // console.log("=".repeat(60));

    // Reset scroll position
    await page.evaluate(() => window.resetScroll());
    await page.waitForTimeout(100);

    // Clear FPS counter
    await page.evaluate(() => window.getTableMetrics());

    // Collect initial CPU metrics
    const cpuBefore = await collectCPUMetrics(cdpSession);
    const startTime = performance.now();

    // Start continuous scrolling in the browser
    await page.evaluate((duration) => {
        window._benchmarkFrameCount = 0;
        window._benchmarkRunning = true;

        const table = document.getElementById("table");

        function scroll() {
            if (!window._benchmarkRunning) return;

            table.scrollLeft += 10;
            table.scrollTop += 20;

            // Wrap around if at edge
            if (table.scrollLeft >= table.scrollWidth - table.offsetWidth) {
                table.scrollLeft = 0;
            }
            if (table.scrollTop >= table.scrollHeight - table.offsetHeight) {
                table.scrollTop = 0;
            }

            window._benchmarkFrameCount++;
            requestAnimationFrame(scroll);
        }

        requestAnimationFrame(scroll);
    }, CONFIG.continuousScrollDuration);

    // Wait for the test duration
    await page.waitForTimeout(CONFIG.continuousScrollDuration);

    // Stop scrolling and get results
    const frameCount = await page.evaluate(() => {
        window._benchmarkRunning = false;
        return window._benchmarkFrameCount;
    });

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Collect final CPU metrics
    const cpuAfter = await collectCPUMetrics(cdpSession);

    // Get table's internal FPS metrics
    const tableMetrics = await page.evaluate(() => window.getTableMetrics());

    // Calculate CPU time used
    const cpuTimeUsed = (cpuAfter.TaskDuration - cpuBefore.TaskDuration) * 1000;
    const scriptTimeUsed =
        (cpuAfter.ScriptDuration - cpuBefore.ScriptDuration) * 1000;
    const layoutTimeUsed =
        (cpuAfter.LayoutDuration - cpuBefore.LayoutDuration) * 1000;
    const recalcStyleTimeUsed =
        (cpuAfter.RecalcStyleDuration - cpuBefore.RecalcStyleDuration) * 1000;

    // Calculate layout and style counts
    const layoutCount = cpuAfter.LayoutCount - cpuBefore.LayoutCount;
    const styleCount = cpuAfter.RecalcStyleCount - cpuBefore.RecalcStyleCount;

    return {
        name: "Continuous Scroll",
        totalTime,
        frameCount,
        scrollFps: (frameCount / totalTime) * 1000,
        tableFps: tableMetrics.fps,
        cpuTime: cpuTimeUsed,
        scriptTime: scriptTimeUsed,
        layoutTime: layoutTimeUsed,
        styleTime: recalcStyleTimeUsed,
        layoutCount,
        styleCount,
        cpuUtilization: (cpuTimeUsed / totalTime) * 100,
    };
}

/**
 * Main benchmark runner
 */
async function runBenchmarks() {
    console.log(
        "╔════════════════════════════════════════════════════════════╗",
    );
    console.log(
        "║           <regular-table> Performance Benchmark            ║",
    );
    console.log(
        "╚════════════════════════════════════════════════════════════╝",
    );
    console.log("\nConfiguration:");
    console.log(`  Rows:       ${CONFIG.rows.toLocaleString()}`);
    console.log(`  Columns:    ${CONFIG.columns.toLocaleString()}`);
    console.log(`  Headers:    ${CONFIG.headerDepth} levels`);
    console.log(`  Iterations: ${CONFIG.iterations}`);
    console.log(`  Warmup:     ${CONFIG.warmupIterations}`);

    // Launch browser
    const browser = await chromium.launch({
        headless: true,
        args: ["--disable-gpu-sandbox", "--no-sandbox"],
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    // Create CDP session for performance metrics
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send("Performance.enable");

    // Build URL with configuration
    const url = `http://localhost:8080/benchmarks/benchmark.html?rows=${CONFIG.rows}&columns=${CONFIG.columns}&headerDepth=${CONFIG.headerDepth}`;

    console.log(`\nLoading benchmark page: ${url}`);
    await page.goto(url);

    // Wait for the benchmark page to be ready
    await page.waitForFunction(() => window.benchmarkReady === true, {
        timeout: 30000,
    });
    await page.waitForTimeout(500); // Additional settle time

    const config = await page.evaluate(() => window.benchmarkConfig);

    // Store all results
    const results = [];

    // Run scroll right benchmark
    results.push(
        await runScrollBenchmark(
            page,
            cdpSession,
            () =>
                page.evaluate(
                    (px) => window.scrollRight(px),
                    CONFIG.scrollPixelsX,
                ),
            "Scroll Right",
        ),
    );

    // Run scroll down benchmark
    results.push(
        await runScrollBenchmark(
            page,
            cdpSession,
            () =>
                page.evaluate(
                    (px) => window.scrollDown(px),
                    CONFIG.scrollPixelsY,
                ),
            "Scroll Down",
        ),
    );

    // Run diagonal scroll benchmark
    results.push(
        await runScrollBenchmark(
            page,
            cdpSession,
            () =>
                page.evaluate(
                    ([px, py]) => window.scrollDiagonal(px, py),
                    [CONFIG.scrollPixelsX, CONFIG.scrollPixelsY],
                ),
            "Scroll Diagonal",
        ),
    );

    // Run diagonal draw benchmark
    results.push(
        await runScrollBenchmark(
            page,
            cdpSession,
            () =>
                page.evaluate(
                    async () => await window.table.draw(),
                    // [(CONFIG.scrollPixelsX, CONFIG.scrollPixelsY)],
                ),
            "Draw",
        ),
    );

    // Run continuous scroll stress test
    results.push(await runContinuousScrollTest(page, cdpSession));

    // Print summary
    console.log(`\n${"=".repeat(100)}`);
    console.log("BENCHMARK SUMMARY");
    console.log("=".repeat(100));
    console.log(
        "\n| Test                    | Throughput (fps) | Avg Frame (ms) | CPU % | Layout (ms) | Layout # | Style (ms) | Style # |",
    );
    console.log(
        "|-------------------------|------------------|----------------|-------|-------------|----------|------------|---------|",
    );
    for (const result of results) {
        const throughput = result.throughput || result.scrollFps || 0;
        const avgFrame = result.frameStats?.avg || result.tableFps?.avg || 0;
        console.log(
            `| ${result.name.padEnd(23)} | ${formatNumber(throughput).padStart(16)} | ${formatNumber(avgFrame).padStart(14)} | ${formatNumber(result.cpuUtilization, 1).padStart(5)} | ${formatNumber(result.layoutTime).padStart(11)} | ${formatNumber(result.layoutCount, 0).padStart(8)} | ${formatNumber(result.styleTime).padStart(10)} | ${formatNumber(result.styleCount, 0).padStart(7)} |`,
        );
    }
    console.log("");

    await browser.close();

    console.log("Benchmark complete!\n");
}

// Run the benchmarks
runBenchmarks().catch((error) => {
    console.error("Benchmark failed:", error);
    process.exit(1);
});
