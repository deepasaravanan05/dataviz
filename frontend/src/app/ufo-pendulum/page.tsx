"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import {
  ARM_LENGTH,
  OVERALL_HEIGHT,
  OVERALL_REACH,
  SAUCER_RADIUS,
  SEAT_COUNT,
  SEAT_LOAD_Y,
  SKIRT_COLORS,
  TOP_GEE,
  UFO_RIDE_NAME,
  saucerHeightAt,
} from "@/components/ufo-pendulum/constants";
import {
  PEAK_SPEED,
  REVOLUTION_PERIOD,
  RIDE_PERIOD,
  SPIN_PERIOD_RATIO,
  SPIN_RPM,
  TOP_SPEED,
} from "@/components/ufo-pendulum/pendulum";
import { RIDE_CENTER } from "@/components/ufo-pendulum/placement";

/**
 * Framed on the ride from the park side, low enough that the circle reads
 * across the frame rather than end-on — which is the same reason the ride
 * itself is turned broadside to the entrance.
 */
const CAMERA_POSITION: [number, number, number] = [
  RIDE_CENTER[0] - 40,
  70,
  RIDE_CENTER[1] + 210,
];
const CAMERA_TARGET: [number, number, number] = [
  RIDE_CENTER[0],
  OVERALL_HEIGHT * 0.45,
  RIDE_CENTER[1],
];

export default function UfoPendulumPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">
          {UFO_RIDE_NAME.toUpperCase()}
        </div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} SEATS</div>
        <div className="mt-1 text-xs text-white/60">
          {ARM_LENGTH}m arm &middot; {(SAUCER_RADIUS * 2).toFixed(0)}m saucer &middot; 360&deg;
          round
        </div>
        <div className="mt-1 text-xs text-white/60">
          {(OVERALL_REACH * 2).toFixed(0)}m wide &middot; {OVERALL_HEIGHT.toFixed(0)}m up
        </div>
        <div className="mt-2 space-y-1 text-xs text-white/70">
          <div>
            Right over the top, {REVOLUTION_PERIOD.toFixed(1)}s a revolution &mdash; solved
            from energy, not swept at a constant rate
          </div>
          <div>
            {(PEAK_SPEED * 3.6).toFixed(0)} km/h through the bottom, {(TOP_SPEED * 3.6).toFixed(0)}{" "}
            km/h over the top at {TOP_GEE.toFixed(1)}g
          </div>
          <div>
            Saucer spins {SPIN_RPM.toFixed(1)} rpm &mdash; {SPIN_PERIOD_RATIO.toFixed(2)} turns
            per revolution, so the machine repeats every {RIDE_PERIOD.toFixed(0)}s, not every
            time round
          </div>
          <div>
            Loads at the bottom: seats wait {SEAT_LOAD_Y.toFixed(1)}m up, one straight flight
            of steps, and the saucer tops out at {saucerHeightAt(Math.PI).toFixed(0)}m
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1">
          {SKIRT_COLORS.map((c) => (
            <span
              key={c}
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="ml-1 text-xs text-white/50">skirt liveries</span>
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
          href="/dragon-ride"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Dragon Ride
        </Link>
        <Link
          href="/roller-coaster"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Roller Coaster
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
