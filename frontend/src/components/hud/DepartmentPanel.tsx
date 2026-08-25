"use client";

import { useEffect, useState } from "react";
import { useRideSelectionStore } from "@/store/rideSelectionStore";

/**
 * The department information panel.
 *
 * Ordinary fixed-position HTML, not a 3D object: it lives in the DOM beside
 * the canvas, so it stays pinned to the top-right corner of the screen no
 * matter where the camera moves, and it never occludes or interacts with the
 * park itself.
 *
 * ADD-ONLY: it reads the ride-selection store and nothing else. It cannot
 * pause a ride, a walking employee or the simulation clock, because it has no
 * reference to any of them.
 */
export function DepartmentPanel() {
  const selected = useRideSelectionStore((s) => s.selected);
  const hoveredId = useRideSelectionStore((s) => s.hoveredId);
  const clear = useRideSelectionStore((s) => s.clear);

  // A pointer cursor while a ride is under the mouse, so it reads as clickable.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.cursor = hoveredId ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredId]);

  if (!selected) return null;

  /*
   * Keyed by ride, so switching rides remounts the body and replays the
   * entrance animation. It also keeps the "shown" flag out of this component,
   * where flipping it back to false would mean a setState during an effect.
   */
  return (
    <PanelBody
      key={selected.rideId}
      department={selected.department}
      rideName={selected.rideName}
      onClose={clear}
    />
  );
}

function PanelBody({
  department,
  rideName,
  onClose,
}: {
  department: string;
  rideName: string;
  onClose: () => void;
}) {
  /** Drives the slide-and-fade in, one frame after the panel mounts. */
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape closes the panel.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label={`${department} department information`}
      className={[
        "pointer-events-auto fixed right-4 top-20 z-50",
        // Narrows on small screens but never spills off the edge.
        "w-[min(20rem,calc(100vw-2rem))]",
        "rounded-2xl border border-cyan-300/12 bg-[#070b14]/80 shadow-2xl shadow-black/50 backdrop-blur-xl",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        shown ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/90">
          Department
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close department panel"
          className="-mr-1 -mt-1 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M5 5l10 10M15 5L5 15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="px-5 pb-2">
        <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
          {department}
        </h2>
      </div>

      <div className="mx-5 mb-4 mt-2 rounded-xl border border-cyan-300/10 bg-white/[0.06] px-4 py-3">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
          Ride
        </div>
        <div className="mt-0.5 text-base font-semibold text-white">{rideName}</div>
      </div>

      <p className="px-5 pb-4 text-[11px] leading-relaxed text-white/45">
        Click another ride to switch, or press Esc to close.
      </p>
    </aside>
  );
}
