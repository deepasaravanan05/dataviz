"use client";

import Link from "next/link";
import { useState } from "react";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { TRAIN_SCALE } from "@/components/park/parkScale";
import { CARRIAGE_COUNT, RIDER_COUNT, TRACK_CENTER } from "@/components/park-train/constants";
import { TRACK_LENGTH } from "@/components/park-train/trainTrack";

/** Pulled back and elevated enough to show the whole loop and every ride at once. */
const CAMERA_POSITION: [number, number, number] = [
  TRACK_CENTER[0] * TRAIN_SCALE - 120,
  520,
  TRACK_CENTER[1] * TRAIN_SCALE + 780,
];
const CAMERA_TARGET: [number, number, number] = [
  TRACK_CENTER[0] * TRAIN_SCALE,
  20,
  TRACK_CENTER[1] * TRAIN_SCALE,
];

export default function ParkTrainPage() {
  const [showLabels, setShowLabels] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene
        cameraPosition={CAMERA_POSITION}
        cameraTarget={CAMERA_TARGET}
        showTrainLabels={showLabels}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">PARK TRAIN</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{RIDER_COUNT} riders</div>
        <div className="mt-1 text-xs text-white/60">
          1 locomotive &middot; {CARRIAGE_COUNT} carriages &middot; {(TRACK_LENGTH * TRAIN_SCALE).toFixed(0)}u loop
          around the whole park
        </div>
        <div className="mt-2 max-w-xs text-xs text-white/70">
          Employees ride the train during their park-visit / delay period. Riding does not count
          as work-started — that happens later, at their assigned department ride.
        </div>
      </div>

      <button
        onClick={() => setShowLabels((v) => !v)}
        className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/85"
      >
        {showLabels ? "Hide employee labels" : "Show employee labels"}
      </button>

      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
        <Link
          href="/entrance"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Entrance
        </Link>
        <Link
          href="/drop-tower"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Drop Tower
        </Link>
        <Link
          href="/dragon-ride"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Dragon Ride
        </Link>
        <Link
          href="/monster-ride"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Monster Ride
        </Link>
        <Link
          href="/roller-coaster"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Roller Coaster
        </Link>
        <Link
          href="/ferris-wheel"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Ferris Wheel
        </Link>
        <Link
          href="/"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          ← Theme Park
        </Link>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-white/70">
        Design inspired by &ldquo;Children&apos;s Carnival Train Ride&rdquo; by SPMech (Sketchfab)
        — original Three.js recreation, no asset reused.
      </div>
    </main>
  );
}
