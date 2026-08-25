import { LOOP_END, LOOP_START } from "./journey";
import { SIM_MINUTES_PER_SECOND } from "./constants";

/**
 * The simulated clock, held outside React.
 *
 * One value, advanced once per frame, read by every walking figure. Keeping it
 * out of React state is deliberate: it changes sixty times a second, and
 * re-rendering fifty-six components at that rate would be pure waste. The HUD
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

let simTime = LOOP_START;
let paused = false;
let speed: number = DEFAULT_SPEED;

/** Advance by a real-time delta in seconds, and return the new simulated time. */
export function advanceJourneyClock(deltaSeconds: number): number {
  if (paused) return simTime;
  // Clamped, so a backgrounded tab does not teleport everyone on return.
  const dt = Math.min(deltaSeconds, 0.1);
  simTime += dt * SIM_MINUTES_PER_SECOND * speed;
  if (simTime > LOOP_END) simTime = LOOP_START;
  return simTime;
}

export function currentSimTime(): number {
  return simTime;
}

/** Jump to an instant. Clamped to the simulated day, and returns what was set. */
export function seekJourneyClock(minutes: number): number {
  simTime = Math.min(LOOP_END, Math.max(LOOP_START, minutes));
  return simTime;
}

/** Put the world back to the start of the morning. */
export function resetJourneyClock(): number {
  simTime = LOOP_START;
  return simTime;
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
