"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * The dashboard calendar, shared by the dashboard page and the Main Entrance.
 *
 * Defaults reproduce the original behaviour exactly — the real current month,
 * no navigation, no spill days — so the dashboard page is unaffected. The
 * entrance opts in to the fuller calendar: it opens on a fixed month, lets the
 * user page through the months, and greys in the adjacent-month days so every
 * week is a full row.
 *
 * `compact` only tightens spacing and type scale for the entrance overlay,
 * where the card sits over the 3D park and must stay out of its way.
 *
 * IT IS ALSO THE PARK'S DATE PICKER, when the caller gives it the three
 * date props. `data/final one.xlsx` records 49 working days and the park
 * animates one of them at a time, so the days the workbook actually has are
 * drawn as buttons, the one on screen wears the pill, and clicking another
 * rebuilds the morning around it. Without those props nothing changes: the
 * dashboard page still gets the same read-only wall calendar it always had.
 */

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const WEEKDAY_NAMES = [
  "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY",
];
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/** One cell: the day number, and which month it belongs to. */
interface Cell {
  day: number;
  outside: boolean;
}

/**
 * The weeks of `year`/`month`, Sunday-first.
 *
 * With `withAdjacent` the leading and trailing gaps are filled from the
 * neighbouring months instead of left blank, so July 2026 opens on
 * `28 29 30 1 2 3 4` exactly as a wall calendar would.
 */
function monthCells(year: number, month: number, withAdjacent: boolean): (Cell | null)[] {
  const lead = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: (Cell | null)[] = [];
  for (let i = 0; i < lead; i++) {
    cells.push(withAdjacent ? { day: prevDays - lead + 1 + i, outside: true } : null);
  }
  for (let d = 1; d <= days; d++) cells.push({ day: d, outside: false });
  if (withAdjacent) {
    // Fill out the final week only — never a whole trailing blank row.
    for (let d = 1; cells.length % 7 !== 0; d++) cells.push({ day: d, outside: true });
  }
  return cells;
}

/** "2026-07-01" for a cell, in the calendar's own local terms. */
function isoDate(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarCard({
  compact = false,
  initialYear,
  initialMonth,
  navigable = false,
  showAdjacentDays = false,
  selectableDates,
  selectedDate,
  onSelectDate,
}: {
  compact?: boolean;
  /** Opening year. Defaults to the real current year. */
  initialYear?: number;
  /** Opening month, 0-based. Defaults to the real current month. */
  initialMonth?: number;
  /** Show ‹ › controls to page through the months. */
  navigable?: boolean;
  /** Fill the first and last weeks from the neighbouring months. */
  showAdjacentDays?: boolean;
  /** The dates the dataset actually has, "YYYY-MM-DD". Makes them clickable. */
  selectableDates?: readonly string[];
  /** The date the park is animating, which wears the pill. */
  selectedDate?: string;
  /** Called with a date the visitor picked. */
  onSelectDate?: (date: string) => void;
}) {
  const [today, setToday] = useState<Date | null>(null);
  const fixed = initialYear !== undefined && initialMonth !== undefined;
  const [view, setView] = useState<{ y: number; m: number } | null>(
    fixed ? { y: initialYear, m: initialMonth } : null,
  );

  useEffect(() => {
    // Set after a frame so prerendered HTML and first client render agree.
    const id = requestAnimationFrame(() => {
      const now = new Date();
      setToday(now);
      // Only follow the real month when no opening month was requested.
      setView((v) => v ?? { y: now.getFullYear(), m: now.getMonth() });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const cells = useMemo(
    () => (view ? monthCells(view.y, view.m, showAdjacentDays) : null),
    [view, showAdjacentDays],
  );

  /** Step whole months, letting Date roll the year over at the boundaries. */
  const step = (delta: number) =>
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const cell = compact ? "h-[1.35rem] w-[1.35rem] text-[10px]" : "h-6 w-6";

  /* The amber "today" pill only makes sense while the real month is on screen. */
  const isThisMonth =
    !!today && !!view && today.getFullYear() === view.y && today.getMonth() === view.m;

  /* Picking mode: the caller handed us the dataset's own dates. */
  const picking = !!selectableDates && !!onSelectDate;
  const available = useMemo(() => new Set(selectableDates ?? []), [selectableDates]);

  return (
    <section
      aria-label="Calendar"
      className={[
        "rounded-2xl border border-amber-200/12 bg-[#1a1410]/72 shadow-2xl shadow-black/50 backdrop-blur-xl",
        compact ? "p-3.5" : "p-5",
      ].join(" ")}
    >
      {view && cells ? (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className={compact ? "text-[11px] font-semibold text-amber-300" : "text-sm font-semibold text-amber-300"}>
                {view.y}
              </div>
              <div className={compact ? "text-base font-bold tracking-wide text-white" : "text-2xl font-bold tracking-wide text-white"}>
                {MONTHS[view.m]}
              </div>
              <div className={[
                "font-semibold tracking-[0.2em] text-amber-300/80",
                compact ? "text-[9px]" : "text-[11px]",
              ].join(" ")}>
                {isThisMonth && today
                  ? WEEKDAY_NAMES[today.getDay()]
                  : WEEKDAY_NAMES[new Date(view.y, view.m, 1).getDay()]}
              </div>
            </div>

            {navigable && (
              <div className="flex shrink-0 items-center gap-1">
                {([["‹", -1, "Previous month"], ["›", 1, "Next month"]] as const).map(
                  ([glyph, delta, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-label={label}
                      onClick={() => step(delta)}
                      className="flex h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-white/[0.06] text-[13px] leading-none text-white/70 transition hover:border-amber-300/40 hover:bg-white/12 hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                    >
                      {glyph}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          <div
            className={[
              "grid grid-cols-7 text-center tabular-nums",
              compact ? "mt-2 gap-y-0.5 text-[10px]" : "mt-3 gap-y-1.5 text-[12px]",
            ].join(" ")}
          >
            {WEEKDAYS.map((w) => (
              <div key={w} className={w === "SUN" ? "text-amber-300/80" : "text-white/50"}>
                {w}
              </div>
            ))}
            {cells.map((c, i) => {
              if (c === null) return <div key={i} className="flex items-center justify-center" />;
              const iso = c.outside ? null : isoDate(view.y, view.m, c.day);
              const hasData = !!iso && available.has(iso);
              const isSelected = !!iso && iso === selectedDate;
              /* The pill marks the date being animated when the card is a
                 picker, and the real today when it is the wall calendar. */
              const pill = picking
                ? isSelected
                : isThisMonth && !c.outside && c.day === today?.getDate();
              const tone = c.outside
                ? "text-white/20"
                : pill
                  ? "bg-amber-400 font-bold text-slate-950"
                  : hasData
                    ? "text-white ring-1 ring-amber-300/35 hover:bg-amber-300/20"
                    : i % 7 === 0
                      ? "text-amber-300/80"
                      : "text-white/80";
              const className = ["flex items-center justify-center rounded-full", cell, tone].join(" ");

              return (
                <div key={i} className="flex items-center justify-center">
                  {picking && hasData && iso ? (
                    <button
                      type="button"
                      onClick={() => onSelectDate?.(iso)}
                      aria-label={`Show ${iso}`}
                      aria-pressed={isSelected}
                      className={`${className} transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70`}
                    >
                      {c.day}
                    </button>
                  ) : (
                    <span className={picking && !c.outside ? `${className} opacity-45` : className}>
                      {c.day}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          className={[compact ? "h-40" : "h-56", "animate-pulse rounded-xl bg-white/5"].join(" ")}
          aria-hidden="true"
        />
      )}
    </section>
  );
}
