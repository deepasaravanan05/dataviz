import { LOOP_END, LOOP_START, OPENING_MINUTE } from "./journey";
import { SIM_MINUTES_PER_SECOND } from "./constants";

/**
 * The simulated clock, held outside React.
 *
 * One value, advanced once per frame, read by every walking figure. Keeping it
 * out of React state is deliberate: it changes sixty times a second, and
 * re-rendering a component per employee at that rate would be pure waste. The HUD
 * gets a throttled copy through the journey store instead.
 *
 * Exposed as functions rather than a mutable object so nothing outside this
 * module can wind the clock by hand.
 *
 * Seeking is trivially correct here, and that is by design: `sampleJourney()`
 * is a pure function of time, so setting this value to any instant places all
 * the figures where they belong with no state to rewind. Nothing that
 * accumulates per-employee state should ever be added to the position path, or
 * scrubbing would stop being exact.
 */

/**
 * Playback rates.
 *
 * 1x is real time — a walk looks like a walk, and a queue takes as long as a
 * queue takes. The higher rates fast-forward the same journey without ever
 * changing it: positions are still interpolated every frame, so nobody is
 * teleported to keep up with the clock.
 */
export const SPEED_OPTIONS = [1, 5, 10, 60] as const;

/** Watching a whole morning at real time takes a morning, so start accelerated. */
export const DEFAULT_SPEED = 10;

/*
 * The window the clock runs over. It defaults to the built-in roster's day and
 * is re-bounded by `setJourneyClockBounds` when an uploaded roster swaps in —
 * the imported constants are defaults, never the live value.
 */
let loopStart = LOOP_START;
let loopEnd = LOOP_END;
/*
 * Where the playhead opens and where `reset` returns to. Derived from the
 * roster's own routes — see `JourneyData.openingMinute` — because opening on
 * `loopStart` opens on an empty park.
 */
let openingMinute = OPENING_MINUTE;

let simTime = openingMinute;
let paused = false;
let speed: number = DEFAULT_SPEED;

/**
 * The most simulated time one frame may carry, in simulated minutes.
 *
 * This guard used to be written the other way round — the REAL delta was
 * clamped to 0.1 s — and that had a consequence nobody intended. A frame rate
 * of F fps credits at most F x 0.1 seconds of every real second, so on any
 * machine drawing the park at under 10 fps the clock silently ran at F/10 of
 * the chosen speed, and at 1 fps it barely moved at all: the timeline sat on
 * its first minute, nobody ever walked in, and the page read as a park with no
 * people in it. That is not a hypothetical — it is reproducible by loading the
 * page under a software renderer, where the clock holds 9:27 indefinitely.
 *
 * Bounding the SIMULATED step instead fixes the units. Normal playback is now
 * exactly proportional to real time at every frame rate, because no real frame
 * ever reaches this cap: at the fastest speed the park offers, 60x, one
 * simulated minute takes a full real second. It only bites where the original
 * guard was actually aimed — a tab that was backgrounded, whose first frame
 * back carries tens of seconds — and there it still refuses to teleport the
 * cast across the park.
 */
export const MAX_SIM_STEP_MINUTES = 1;

/**
 * Re-bound the clock to a different simulated day and open it at that day's
 * own fullest arrival minute. Called exactly once per roster swap, before
 * anything reads the new day.
 */
export function setJourneyClockBounds(start: number, end: number, opening = start): number {
  loopStart = start;
  loopEnd = end;
  openingMinute = Math.min(loopEnd, Math.max(loopStart, opening));
  simTime = openingMinute;
  return simTime;
}

/** Advance by a real-time delta in seconds, and return the new simulated time. */
export function advanceJourneyClock(deltaSeconds: number): number {
  if (paused) return simTime;
  const step = Math.min(
    Math.max(0, deltaSeconds) * SIM_MINUTES_PER_SECOND * speed,
    MAX_SIM_STEP_MINUTES,
  );
  simTime += step;
  /* The day restarts at the opening minute, not at the empty one, so a loop
     that has run its course comes back to a park with people in it. */
  if (simTime > loopEnd) simTime = openingMinute;
  return simTime;
}

export function currentSimTime(): number {
  return simTime;
}

/** Jump to an instant. Clamped to the simulated day, and returns what was set. */
export function seekJourneyClock(minutes: number): number {
  simTime = Math.min(loopEnd, Math.max(loopStart, minutes));
  return simTime;
}

/** Put the world back to the opening shot — the fullest minute of the morning. */
export function resetJourneyClock(): number {
  simTime = openingMinute;
  return simTime;
}

/** The minute the playhead opens and resets to. */
export function journeyOpeningMinute(): number {
  return openingMinute;
}

export function setJourneyPaused(value: boolean): void {
  paused = value;
}

export function setJourneySpeed(value: number): void {
  speed = value;
}

export function isJourneyPaused(): boolean {
  return paused;
}

export function currentJourneySpeed(): number {
  return speed;
}
