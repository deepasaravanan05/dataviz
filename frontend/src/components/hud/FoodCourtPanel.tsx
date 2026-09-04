"use client";

import { useEffect, useMemo, useState } from "react";
import { useActiveJourneyStore } from "@/simulation/journey/activeJourney";
import { useFoodCourtStore } from "@/store/foodCourtStore";
import type { JourneyEmployee } from "@/simulation/journey/journey";

/**
 * The food court information panel.
 *
 * Ordinary fixed-position HTML beside the canvas, exactly like the ride panel
 * it sits in the same corner as — so it stays pinned to the top right wherever
 * the camera goes, and never occludes or interacts with the park itself.
 *
 * WHAT IT SHOWS: the employees who are inside the food court AT THIS INSTANT,
 * with the three facts the dataset gives about each of them — their ID, their
 * department and their delay. Not who has been, not who will be: the list is
 * the occupancy of the building right now.
 *
 * READ-ONLY, AND ADD-ONLY. It reads two stores and writes to neither the
 * simulation nor the dataset. It cannot move an employee, wind the clock or
 * change a delay, because it holds no reference to anything that could.
 *
 * IT DOES NOT POLL. `occupants` is published from the frame loop only when
 * somebody actually walks in or out (see `FoodCourtOccupancy`), so this
 * re-renders on those events and at no other time — which is why the count is
 * exact rather than a once-a-minute approximation, and why a paused park shows
 * a frozen list.
 */
export function FoodCourtPanel() {
  const selected = useFoodCourtStore((s) => s.selected);
  const clear = useFoodCourtStore((s) => s.clear);

  if (!selected) return null;

  return <PanelBody onClose={clear} />;
}

/** One row of the table, resolved from the dataset and formatted. */
interface Diner {
  id: string;
  department: string;
  delay: string;
}

function PanelBody({ onClose }: { onClose: () => void }) {
  /** Drives the slide-and-fade in, one frame after the panel mounts. */
  const [shown, setShown] = useState(false);

  /*
   * THE TWO LIVE INPUTS.
   *
   * `occupants` is who is inside, in the order they came through the door.
   * `employees` is the ACTIVE roster — the built-in dataset until an upload
   * swaps it — which is where every value printed below comes from. Nothing on
   * this panel is computed: the ID, the department and the delay are the
   * dataset's own columns, carried through the journey builder untouched.
   */
  const occupants = useFoodCourtStore((s) => s.occupants);
  const employees = useActiveJourneyStore((s) => s.employees);

  const diners = useMemo<Diner[]>(() => {
    const byId = new Map(employees.map((e: JourneyEmployee) => [e.id, e]));
    return occupants
      .map((id) => byId.get(id))
      .filter((e): e is JourneyEmployee => e !== undefined)
      .map((e) => ({
        id: e.id,
        department: e.department,
        /* The sheet's own Delay Time column, so the panel never prints a
           number the workbook does not contain. */
        delay: `${e.reportedDelayMinutes} min`,
      }));
  }, [occupants, employees]);

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
      aria-label="Food court occupancy"
      className={[
        "pointer-events-auto fixed right-4 top-20 z-50",
        // Narrows on small screens but never spills off the edge.
        "w-[min(22rem,calc(100vw-2rem))]",
        "rounded-2xl border border-cyan-300/12 bg-[#070b14]/80 shadow-2xl shadow-black/50 backdrop-blur-xl",
        "transition-all duration-300 ease-out motion-reduce:transition-none",
        shown ? "translate-x-0 opacity-100" : "translate-x-3 opacity-0",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <h2 className="text-base font-bold leading-snug tracking-tight text-white">
          Food Court
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close food court panel"
          className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
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

      {/* The live count, in the same block the ride panel uses for its stats. */}
      <div className="mx-5 mt-3">
        <div className="rounded-xl border border-cyan-300/10 bg-white/[0.06] px-3.5 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Employees currently inside
          </div>
          <div className="mt-0.5 text-2xl font-black leading-none tabular-nums text-sky-300">
            {diners.length}
          </div>
        </div>
      </div>

      <div className="px-5 pb-4 pt-4">
        {diners.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-white/45">
            Nobody is in the food court right now.
          </p>
        ) : (
          <>
            {/* Column headings, outside the scroller so they stay put. */}
            <div className="flex items-baseline gap-2 border-b border-white/10 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
              <span className="w-[5.5rem] shrink-0">Employee ID</span>
              <span className="min-w-0 flex-1">Department</span>
              <span className="w-[3.5rem] shrink-0 text-right">Delay</span>
            </div>

            {/*
              ONLY the list scrolls. The title and the count stay put while the
              court fills up underneath them, and the height is capped in
              viewport units as well as in rems so a short screen gives the list
              less room rather than running the panel off the bottom.
            */}
            <ul className="mt-1.5 max-h-[min(16rem,34vh)] space-y-1 overflow-y-auto pr-1">
              {diners.map((d) => (
                <li
                  key={d.id}
                  className="flex items-baseline gap-2 rounded-lg bg-white/[0.05] px-2.5 py-1.5"
                >
                  <span className="w-[5.5rem] shrink-0 text-[12px] font-semibold tabular-nums text-white">
                    {d.id}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-sky-200">
                    {d.department}
                  </span>
                  <span className="w-[3.5rem] shrink-0 text-right text-[12px] font-medium tabular-nums text-white/70">
                    {d.delay}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
