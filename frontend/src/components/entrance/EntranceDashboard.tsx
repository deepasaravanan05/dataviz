"use client";

import { useState } from "react";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { DepartmentOverview } from "@/components/dashboard/DepartmentOverview";
import { useJourneyStore } from "@/store/journeyStore";
import { SIMULATION_DATES, useEmployeeDataStore } from "@/store/employeeDataStore";

/**
 * The dashboard, embedded in the Main Entrance rather than opened as a page.
 *
 * The left column is now two compact buttons with their panels folded away
 * beneath them, rather than two panels standing open. The park is the primary
 * visual element here, and a permanently-open column was holding a fifth of the
 * viewport whether or not anyone was reading it — so both panels start closed
 * and the gate, the rides, the paths and the walking employees are unobscured
 * until something is actually asked for.
 *
 * The two toggles are INDEPENDENT: each panel has its own piece of state, so
 * opening the calendar never closes the department overview and vice versa,
 * and either may be open, both, or neither.
 *
 * Neither card is redesigned. `CalendarCard` and `DepartmentOverview` are the
 * same components with the same props they had when they stood open — month
 * navigation, the July 2026 opening month and every live count are untouched.
 * All that changed is whether they are mounted.
 *
 * The clock comes from the journey store, which the park's own `JourneyClock`
 * publishes once per simulated minute. This component must never call
 * `advanceJourneyClock()` itself: the park is already winding that clock, and a
 * second driver would run the morning at double speed.
 */

/**
 * The calendar opens on the month the dataset starts in — July 2026, which is
 * also the month the concept art opens on. Derived from the workbook rather
 * than typed, so a different attendance file opens on its own first month.
 */
const [OPENING_YEAR, OPENING_MONTH] = (() => {
  const [y, m] = SIMULATION_DATES[0].split("-").map(Number);
  return [y, m - 1] as const;
})();

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

/** Bar chart: the department counts are what the panel below it shows. */
function DepartmentIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  );
}

/** The little chevron that turns to say which way the panel will go. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "ml-auto h-3 w-3 shrink-0 transition-transform duration-200",
        open ? "rotate-180" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PanelToggle({
  label,
  open,
  onToggle,
  controls,
  icon,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  controls: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      className={[
        "group flex w-full items-center gap-2 rounded-full border px-3.5 py-2",
        "text-[12px] font-medium shadow-lg shadow-black/40 backdrop-blur-xl transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
        open
          ? "border-amber-200/35 bg-[#0b1120]/90 text-amber-100"
          : "border-amber-200/15 bg-[#070b14]/82 text-white/85 hover:border-amber-200/35 hover:bg-[#0b1120]/90 hover:text-amber-100",
      ].join(" ")}
    >
      <span
        className={[
          "shrink-0 transition",
          open ? "text-amber-200" : "text-amber-200/70 group-hover:text-amber-100",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
      <Chevron open={open} />
    </button>
  );
}

export function EntranceDashboard() {
  const simTime = useJourneyStore((s) => s.simTime);
  const date = useEmployeeDataStore((s) => s.date);
  const selectDate = useEmployeeDataStore((s) => s.selectDate);

  /* Independent state per panel — never a single "which one is open". */
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-20 hidden w-[21rem] md:block xl:w-[22.5rem]">
      {/* pt-16 clears the PlaceNav bar, which is full-width and sits above this. */}
      <div className="flex h-full flex-col gap-2 overflow-y-auto p-4 pt-16">
        <div className="pointer-events-auto shrink-0">
          <PanelToggle
            label="Calendar"
            open={calendarOpen}
            onToggle={() => setCalendarOpen((v) => !v)}
            controls="entrance-calendar-panel"
            icon={<CalendarIcon className="h-3.5 w-3.5" />}
          />
        </div>

        {/* The calendar hangs directly under its own button, as the layout asks. */}
        {calendarOpen && (
          <div id="entrance-calendar-panel" className="pointer-events-auto shrink-0">
            <CalendarCard
              compact
              navigable
              showAdjacentDays
              initialYear={OPENING_YEAR}
              initialMonth={OPENING_MONTH}
              /*
               * THE CALENDAR IS THE DATE PICKER. The workbook's Date (IST)
               * column decides which morning the park animates, and this is
               * where it is chosen: the dates it actually holds are ringed and
               * clickable, and the one on screen wears the amber pill.
               */
              selectableDates={SIMULATION_DATES}
              selectedDate={date}
              onSelectDate={selectDate}
            />
          </div>
        )}

        <div className="pointer-events-auto shrink-0">
          <PanelToggle
            label="Department-wise Count"
            open={departmentsOpen}
            onToggle={() => setDepartmentsOpen((v) => !v)}
            controls="entrance-department-panel"
            icon={<DepartmentIcon className="h-3.5 w-3.5" />}
          />
        </div>

        {departmentsOpen && (
          <div id="entrance-department-panel" className="pointer-events-auto shrink-0">
            <DepartmentOverview simTime={simTime} compact />
          </div>
        )}
      </div>
    </div>
  );
}
