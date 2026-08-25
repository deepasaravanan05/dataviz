"use client";

import { CAMERA_PLACES } from "@/components/world/cameraPlaces";
import { useCameraStore } from "@/store/cameraStore";

/**
 * Fast travel.
 *
 * A single row of chips at the top of the screen — the whole park reachable in
 * one click, without a panel that covers the world. The camera eases to each
 * viewpoint rather than cutting, so you keep your bearings on the way.
 */
export function PlaceNav() {
  const travelTo = useCameraStore((s) => s.travelTo);
  const mode = useCameraStore((s) => s.mode);
  const destinationId = useCameraStore((s) => s.destination?.id ?? null);

  const groups = [
    CAMERA_PLACES.filter((p) => p.group === "park"),
    CAMERA_PLACES.filter((p) => p.group === "facility"),
    CAMERA_PLACES.filter((p) => p.group === "department"),
  ];

  return (
    <nav
      aria-label="Jump to a location"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 flex justify-center p-3"
    >
      <div className="pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-wrap items-center justify-center gap-1 overflow-x-auto rounded-full border border-cyan-300/10 bg-[#070b14]/80 px-2 py-1.5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* The 2D dashboard is a page of its own, not a camera place. */}
        <a
          href="/dashboard"
          className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium text-amber-200/85 transition hover:bg-white/10 hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          Dashboard
        </a>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/12" />
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-1">
            {gi > 0 && <span aria-hidden="true" className="mx-1 h-4 w-px bg-white/12" />}
            {group.map((place) => {
              const active = mode === "travel" && destinationId === place.id;
              return (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => travelTo(place.id)}
                  className={[
                    "whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                    active
                      ? "bg-sky-400/90 text-slate-950"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  {place.group === "department" ? place.label.split(" — ")[0] : place.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
