"use client";

import Link from "next/link";
import { Scene } from "@/components/3d/Scene";
import { Dashboard } from "@/components/hud/Dashboard";
import { ClockControls } from "@/components/hud/ClockControls";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#03050b]">
      <Scene />
      <Dashboard />
      <ClockControls />
      <div className="pointer-events-auto absolute right-4 top-4 flex gap-2">
        <Link
          href="/entrance"
          className="rounded-full bg-[#070b14]/84 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Main entrance →
        </Link>
        <Link
          href="/ferris-wheel"
          className="rounded-full bg-[#070b14]/84 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Ferris Wheel showcase →
        </Link>
        <Link
          href="/roller-coaster"
          className="rounded-full bg-[#070b14]/84 px-4 py-2 text-sm text-white shadow-lg backdrop-blur transition hover:bg-[#070b14]/90"
        >
          Full park →
        </Link>
      </div>
    </main>
  );
}
