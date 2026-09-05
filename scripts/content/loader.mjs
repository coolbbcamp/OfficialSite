/** Boot loader copy + timing — edit here; run patch-loader-text.mjs to apply. */
export const LOADER_TEXT = "CoolBB Base Camp";

/** One full marquee cycle; tuned for ~10–20s total boot on slow networks. */
export const LOADER_FLOW_DURATION_S = 16;

/** Repeated segments in the scrolling strip (must be even for seamless -50% loop). */
export const LOADER_TEXT_REPEATS = 4;

/** Keep loader visible until App3D is ready (avoid forced teardown on slow loads). */
export const LOADER_HIDE_TIMEOUT_MS = 30000;

export const LOADER_OUTRO_TEXT_MS = 500;
export const LOADER_OUTRO_FADE_MS = 1200;
