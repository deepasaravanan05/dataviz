"use client";

import Link from "next/link";
import { ParkScene } from "@/components/roller-coaster/ParkScene";
import { JourneyHud } from "@/components/hud/JourneyHud";
import { TimelineControls } from "@/components/hud/TimelineControls";
import { PlaceNav } from "@/components/hud/PlaceNav";
import { rideById } from "@/components/park/layout";
import { SEAT_COLOR_HEX, countSeatColor } from "@/components/roller-coaster/seatManifest";
import { CAR_COUNT, SEAT_COUNT } from "@/components/roller-coaster/constants";

const LEGEND = [
  { label: "Green", color: SEAT_COLOR_HEX.GREEN, count: countSeatColor("GREEN") },
  { label: "Yellow", color: SEAT_COLOR_HEX.YELLOW, count: countSeatColor("YELLOW") },
  { label: "Red", color: SEAT_COLOR_HEX.RED, count: countSeatColor("RED") },
];

/** Framed on the coaster itself, not the whole-park entrance overview. */
const COASTER_CENTER = rideById("coaster").center;
const CAMERA_POSITION: [number, number, number] = [COASTER_CENTER[0] - 30, 110, COASTER_CENTER[1] + 240];
const CAMERA_TARGET: [number, number, number] = [COASTER_CENTER[0], 25, COASTER_CENTER[1]];

export default function RollerCoasterPage() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#03050b]">
      <ParkScene cameraPosition={CAMERA_POSITION} cameraTarget={CAMERA_TARGET} />

      <div className="pointer-events-none absolute left-4 top-16 rounded-xl bg-[#070b14]/82 px-4 py-3 text-white shadow-lg backdrop-blur">
        <div className="text-sm font-semibold tracking-wide">ROLLER COASTER</div>
        <div className="mt-0.5 text-2xl font-bold tabular-nums">{SEAT_COUNT} SEATS</div>
        <div className="mt-1 text-xs text-white/60">{CAR_COUNT} cars &middot; 4 seats each</div>
        <div className="mt-2 space-y-1 text-xs">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="tabular-nums">{item.count}</span>
              <span className="text-white/70">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <JourneyHud />
      <TimelineControls />
      <PlaceNav />

      <div className="pointer-events-auto absolute right-4 top-16 flex flex-wrap justify-end gap-2">
        <Link
          href="/entrance"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Entrance
        </Link>
        <Link
          href="/drop-tower"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Drop Tower
        </Link>
        <Link
          href="/dragon-ride"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Dragon Ride
        </Link>
        <Link
          href="/park-train"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Park Train
        </Link>
        <Link
          href="/monster-ride"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Monster Ride
        </Link>
        <Link
          href="/ferris-wheel"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Ferris Wheel
        </Link>
        <Link
          href="/"
          className="rounded-full bg-[#070b14]/82 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          ← Theme Park
        </Link>
      </div>

      {/* CC-BY 4.0 requires crediting the author of the reference model. */}
      <div className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-white/70">
        Track, train and station design inspired by &ldquo;Roller Coaster&rdquo; by FrankiArt
        (Sketchfab, CC&nbsp;BY&nbsp;4.0) — recreated in Three.js.
      </div>
    </main>
  );
}
