"use client";

import Link from "next/link";
import { useState } from "react";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { rideById } from "@/components/park/layout";
import { SEAT_COLOR_HEX, countRiderColor, RIDERS } from "@/components/monster-ride/riders";
import {
  ARM_COUNT,
  GONDOLAS_PER_ARM,
  SEATS_PER_GONDOLA,
} from "@/components/monster-ride/constants";

const LEGEND = [
  { label: "Green", hint: "earliest starters", color: SEAT_COLOR_HEX.GREEN, count: countRiderColor("GREEN") },
  { label: "Yellow", hint: "moderate", color: SEAT_COLOR_HEX.YELLOW, count: countRiderColor("YELLOW") },
  { label: "Red", hint: "latest starters", color: SEAT_COLOR_HEX.RED, count: countRiderColor("RED") },
];

/**
 * Framed on the Monster Ride, with the Ferris Wheel and coaster behind it.
 * Scaled with the park so the framing is unchanged now the rides are larger.
 */
const MONSTER_CENTER = rideById("monster").center;
const CAMERA_POSITION: [number, number, number] = [
  MONSTER_CENTER[0] + 20,
  55,
  MONSTER_CENTER[1] + 150,
];
const CAMERA_TARGET: [number, number, number] = [MONSTER_CENTER[0], 18, MONSTER_CENTER[1]];

export default function MonsterRidePage() {
  const [showLabels, setShowLabels] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <ParkScene
        cameraPosition={CAMERA_POSITION}
        cameraTarget={CAMERA_TARGET}
        showRiderLabels={showLabels}
      />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">MONSTER RIDE</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{RIDERS.length} SEATS</div>
        <div className="mt-1 text-xs text-white/60">
          {ARM_COUNT} arms &middot; {GONDOLAS_PER_ARM} gondolas each &middot; {SEATS_PER_GONDOLA} seats
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
          href="/park-train"
          className="rounded-full bg-black/65 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-black/80"
        >
          Park Train
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
        Design inspired by &ldquo;Parkitect Mod - Monster Ride&rdquo; by SirMaverick34 (Sketchfab)
        — original Three.js recreation, no asset reused.
      </div>
    </main>
  );
}
