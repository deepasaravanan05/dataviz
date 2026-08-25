"use client";

import Link from "next/link";
import { FerrisWheelScene } from "@/components/ferris-wheel/FerrisWheelScene";
import { CABIN_COLOR_HEX, countByColor } from "@/components/ferris-wheel/cabinManifest";
import { CABIN_COUNT } from "@/components/ferris-wheel/constants";

const LEGEND = [
  { label: "Green", color: CABIN_COLOR_HEX.GREEN, count: countByColor("GREEN") },
  { label: "Yellow", color: CABIN_COLOR_HEX.YELLOW, count: countByColor("YELLOW") },
  { label: "Red", color: CABIN_COLOR_HEX.RED, count: countByColor("RED") },
];

export default function FerrisWheelPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <FerrisWheelScene />

      <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-black/65 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">FERRIS WHEEL</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{CABIN_COUNT} SEATS</div>
        <div className="mt-2 space-y-1 text-xs">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="tabular-nums">{item.count}</span>
              <span className="text-white/70">{item.label}</span>
            </div>
          ))}
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
