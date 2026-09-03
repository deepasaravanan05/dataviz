"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import {
  CAR_COUNT,
  CAR_COLORS,
  GIGA_RIDE_NAME,
  LIFT_SPEED,
  SEAT_COUNT,
} from "@/components/giga-coaster/constants";
import { TRACK_LENGTH, TRACK_PEAK, TRACK_VALLEY } from "@/components/giga-coaster/trackCurve";
import { MAX_BANK, MAX_LATERAL_GEE } from "@/components/giga-coaster/trackFrames";
import {
  MAX_LATERAL_GEE_ALLOWED,
  RUN_SECONDS,
  TOP_SPEED,
} from "@/components/giga-coaster/coasterMotion";
import { OVERALL_HEIGHT } from "@/components/giga-coaster/envelope";
import { RIDE_CENTER, gapToNeighbour } from "@/components/giga-coaster/placement";

const CAMERA_POSITION: [number, number, number] = [
  RIDE_CENTER[0] - 150,
  120,
  RIDE_CENTER[1] + 330,
];
const CAMERA_TARGET: [number, number, number] = [
  RIDE_CENTER[0],
  OVERALL_HEIGHT * 0.35,
  RIDE_CENTER[1],
];

export default function GigaCoasterPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">{GIGA_RIDE_NAME.toUpperCase()}</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} RIDERS</div>
        <div className="mt-1 text-xs text-white/60">
          {TRACK_PEAK.toFixed(0)}m lift hill &middot; {TRACK_LENGTH.toFixed(0)}m of track &middot;{" "}
          {CAR_COUNT} cars
        </div>
        <div className="mt-2 space-y-1 text-xs text-white/70">
          <div>
            Exactly as tall as the Tea Cups &mdash; the crest is read from their own height, so
            the two can never drift apart
          </div>
          <div>
            Chain at {(LIFT_SPEED * 3.6).toFixed(0)} km/h, then gravity:{" "}
            {(TRACK_PEAK - TRACK_VALLEY).toFixed(0)}m of drop gets it to{" "}
            {(TOP_SPEED * 3.6).toFixed(0)} km/h
          </div>
          <div>
            Worst corner {MAX_LATERAL_GEE.toFixed(2)}g against a {MAX_LATERAL_GEE_ALLOWED}g limit,
            banked up to {((MAX_BANK * 180) / Math.PI).toFixed(0)}&deg; &mdash; the plan is
            generated from a corner radius, so it cannot pull more
          </div>
          <div>
            Home in {RUN_SECONDS.toFixed(0)}s, {gapToNeighbour(RIDE_CENTER[0], RIDE_CENTER[1]).toFixed(0)}m
            of clear ground from the Tea Cups
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
          href="/tea-cups"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Tea Cups
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
