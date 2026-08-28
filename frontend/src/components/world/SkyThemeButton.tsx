"use client";

import { SKY_THEMES, SKY_THEME_ORDER } from "./skyThemes";
import { useSkyThemeStore } from "@/store/skyThemeStore";

/**
 * The time-of-day control: Sunset / Sunrise / Dark.
 *
 * Bottom-right, deliberately clear of the park's left-hand dashboard column and
 * of the top navigation. The whole strip is the control — clicking a segment
 * jumps straight to that time of day rather than making the user cycle to it —
 * and it stays a single compact pill so it never competes with the 3D park.
 */
export function SkyThemeButton() {
  const theme = useSkyThemeStore((s) => s.theme);
  const setTheme = useSkyThemeStore((s) => s.setTheme);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-30">
      <div
        role="group"
        aria-label="Time of day"
        className="flex items-center gap-1 rounded-full border border-amber-200/15 bg-[#1a1410]/80 p-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        {SKY_THEME_ORDER.map((id) => {
          const active = id === theme;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              aria-pressed={active}
              aria-label={`${SKY_THEMES[id].label} lighting`}
              className={[
                "rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-wide transition",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70",
                active
                  ? "bg-amber-400 text-slate-950 shadow"
                  : "text-white/70 hover:bg-white/10 hover:text-amber-100",
              ].join(" ")}
            >
              {SKY_THEMES[id].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
