import { create } from "zustand";
import { DEFAULT_SKY_THEME, SKY_THEME_ORDER, type SkyTheme } from "@/components/world/skyThemes";

/**
 * Which time of day the park is rendered at.
 *
 * Held outside React's tree so the 3D scene and the 2D button agree without
 * either owning the other, exactly like the journey and camera stores.
 */
interface SkyThemeState {
  theme: SkyTheme;
  setTheme: (theme: SkyTheme) => void;
  /** Advance to the next theme in SKY_THEME_ORDER, wrapping around. */
  cycle: () => void;
}

export const useSkyThemeStore = create<SkyThemeState>((set) => ({
  theme: DEFAULT_SKY_THEME,
  setTheme: (theme) => set({ theme }),
  cycle: () =>
    set((s) => ({
      theme: SKY_THEME_ORDER[(SKY_THEME_ORDER.indexOf(s.theme) + 1) % SKY_THEME_ORDER.length],
    })),
}));
