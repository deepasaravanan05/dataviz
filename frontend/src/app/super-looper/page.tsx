"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import {
  LOOP_RADIUS,
  LOOP_REVOLUTIONS,
  LOOPER_RIDE_NAME,
  OVERALL_HEIGHT,
  RIDER_CAPACITY,
  CAR_COUNT,
  CAR_COLORS,
  PLATFORM_Y,
} from "@/components/super-looper/constants";
import {
  CYCLE_SECONDS,
  MAX_SPEED,
  PUMP_SECONDS,
  PUMP_SWINGS,
  TOP_PASS_SPEED,
} from "@/components/super-looper/loopMotion";
import { RIDE_CENTER } from "@/components/super-looper/placement";

/**
 * Framed on the ring from the park side, low enough that the loop reads as a
 * circle standing on the ground rather than as a disc in the sky.
 */
const CAMERA_POSITION: [number, number, number] = [
  RIDE_CENTER[0] - 30,
  26,
  RIDE_CENTER[1] + 78,
];
const CAMERA_TARGET: [number, number, number] = [
  RIDE_CENTER[0],
  OVERALL_HEIGHT * 0.45,
  RIDE_CENTER[1],
];

export default function SuperLooperPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">
          {LOOPER_RIDE_NAME.toUpperCase()}
        </div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{RIDER_CAPACITY} RIDERS</div>
        <div className="mt-1 text-xs text-white/60">
          {(LOOP_RADIUS * 2).toFixed(0)}m loop &middot; {CAR_COUNT} cars &middot;{" "}
          {OVERALL_HEIGHT.toFixed(0)}m up
        </div>
        <div className="mt-2 space-y-1 text-xs text-white/70">
          <div>
            Pumped by the drive tyres &mdash; {PUMP_SWINGS} swings over{" "}
            {PUMP_SECONDS.toFixed(0)}s before it can get over the top
          </div>
          <div>
            {LOOP_REVOLUTIONS} times round at up to {(MAX_SPEED * 3.6).toFixed(0)} km/h, crossing
            the top at {(TOP_PASS_SPEED * 3.6).toFixed(0)} km/h
          </div>
          <div>
            The train is captive on the rail, so it can crawl over the top rather than
            having to be thrown over it
          </div>
          <div>
            Loads at the bottom: seats wait {PLATFORM_Y.toFixed(1)}m up, one straight flight of
            steps, and the whole cycle repeats every {CYCLE_SECONDS.toFixed(0)}s
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {CAR_COLORS.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
          ))}
          <span className="ml-1 text-xs text-white/50">car liveries</span>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
        <Link
          href="/entrance"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Entrance
        </Link>
        <Link
          href="/ufo-pendulum"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          UFO Pendulum
        </Link>
        <Link
          href="/"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          ← Theme Park
        </Link>
      </div>
    </main>
  );
}
