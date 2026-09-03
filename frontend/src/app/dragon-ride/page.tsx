"use client";

import Link from "next/link";
import { useState } from "react";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { rideById } from "@/components/park/layout";
import {
  RIDE_CAPACITY,
  RIDE_MIN_START_COUNT,
  RIDE_RUN_DURATION_MINUTES,
  SEAT_COLOR_HEX,
  countSeatColor,
} from "@/components/dragon-ride/riders";
import { APEX_HEIGHT, SEAT_COUNT, SWING_MAX, SWING_PERIOD } from "@/components/dragon-ride/constants";

const LEGEND = [
  { label: "Green", hint: "no / low delay", color: SEAT_COLOR_HEX.GREEN, count: countSeatColor("GREEN") },
  { label: "Yellow", hint: "moderate delay", color: SEAT_COLOR_HEX.YELLOW, count: countSeatColor("YELLOW") },
  { label: "Red", hint: "high delay", color: SEAT_COLOR_HEX.RED, count: countSeatColor("RED") },
];

/** Framed on the Dragon Ride, with the roller coaster it leads into behind it. */
const DRAGON_CENTER = rideById("dragon").center;
const CAMERA_POSITION: [number, number, number] = [
  DRAGON_CENTER[0] + 20,
  60,
  DRAGON_CENTER[1] + 165,
];
const CAMERA_TARGET: [number, number, number] = [DRAGON_CENTER[0], 20, DRAGON_CENTER[1]];

export default function DragonRidePage() {
  const [showLabels, setShowLabels] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene
        cameraPosition={CAMERA_POSITION}
        cameraTarget={CAMERA_TARGET}
        showDragonLabels={showLabels}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">DRAGON SWING SHIP</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} SEATS</div>
        <div className="mt-1 text-xs text-white/60">
          {APEX_HEIGHT}u A-frame &middot; &plusmn;{Math.round((SWING_MAX * 180) / Math.PI)}&deg; swing
          &middot; {SWING_PERIOD.toFixed(1)}s pendulum period
        </div>
        <div className="mt-2 space-y-1 text-xs">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="tabular-nums">{item.count}</span>
              <span className="text-white/70">{item.label}</span>
              <span className="text-white/40">{item.hint}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 max-w-xs text-xs text-white/70">
          Seats, colours and dispatch rules come from the park&apos;s existing ride system:
          capacity {RIDE_CAPACITY}, dispatches at {RIDE_MIN_START_COUNT}+ employees, runs{" "}
          {RIDE_RUN_DURATION_MINUTES} min.
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
          href="/ufo-pendulum"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          UFO Pendulum
        </Link>
        <Link
          href="/park-train"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Park Train
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
          href="/"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          ← Theme Park
        </Link>
      </div>
    </main>
  );
}
