/**
 * The park's times of day.
 *
 * Everything that makes the sky read as a particular hour lives here — the
 * gradient dome, the haze, the key light's direction and colour, the exposure
 * and the ground tint — so a theme is one table entry rather than a set of
 * literals scattered through the scene.
 *
 * `dark` reproduces the park's original night EXACTLY: the same background,
 * fog, dome colours, lights and exposure as before this table existed. Its
 * ground now carries the same generated lawn the other two do, at the same
 * darkness it always had.
 * The verification scripts assert against that entry, so the night the park was
 * tuned and proven under is still the night it renders.
 *
 * The two lit themes place the sun near the horizon on opposite sides — sunset
 * low in the west behind the ride fan, sunrise low in the east — which is what
 * gives the long shadows and the rim on the rides. Neither is a daylight
 * setting: the park is still an evening park, just no longer a black one.
 */

export type SkyTheme = "sunset" | "sunrise" | "dark";

/** Cycle order for the theme button. */
export const SKY_THEME_ORDER: SkyTheme[] = ["sunset", "sunrise", "dark"];

export interface SkyThemeConfig {
  label: string;
  /** Clear colour behind everything. Kept near the fog so land fades into sky. */
  background: string;
  fog: { color: string; near: number; far: number };
  /** The gradient dome, horizon -> overhead, plus the band sitting on the skyline. */
  dome: { horizon: string; mid: string; zenith: string; glow: string };
  /** Stars are a night-only feature. */
  stars: boolean;
  /** The disc in the sky, and the direction the key light comes from. */
  orb: { position: [number, number, number]; core: string; halo: string; haloOpacity: number };
  ambient: { color: string; intensity: number };
  hemisphere: { sky: string; ground: string; intensity: number };
  key: { position: [number, number, number]; color: string; intensity: number };
  fill: { position: [number, number, number]; color: string; intensity: number };
  environment: { top: string; ringA: string; ringB: string; intensity: number };
  toneMappingExposure: number;
  ground: { grass: string; plaza: string; plazaRim: string };
}

export const SKY_THEMES: Record<SkyTheme, SkyThemeConfig> = {
  /*
   * Sunset — the project's reference art. A burnt-orange band on the horizon
   * running up through rose into a dusty violet overhead, with the sun sitting
   * just above the skyline behind the ride fan so the rides are rim-lit.
   */
  sunset: {
    label: "Sunset",
    background: "#6a4a5e",
    fog: { color: "#6a4a5e", near: 1400, far: 8000 },
    dome: { horizon: "#ff8a45", mid: "#a84f78", zenith: "#2f3363", glow: "#ff6a2a" },
    stars: false,
    orb: { position: [-2100, 420, -1500], core: "#ffd9a0", halo: "#ff9a4a", haloOpacity: 0.3 },
    ambient: { color: "#8a6152", intensity: 0.5 },
    hemisphere: { sky: "#ffa768", ground: "#3a2820", intensity: 0.62 },
    key: { position: [-210, 150, -150], color: "#ffb478", intensity: 1.45 },
    fill: { position: [120, 60, 180], color: "#8f7fb8", intensity: 0.3 },
    environment: { top: "#f0a878", ringA: "#ff8a52", ringB: "#c79a63", intensity: 0.5 },
    toneMappingExposure: 1.02,
    ground: { grass: "#2f8a2a", plaza: "#4a3b2e", plazaRim: "#362a20" },
  },

  /*
   * Sunrise — the same low sun on the other side, but cooler and cleaner: gold
   * on the horizon, pink above it, and a waking blue overhead rather than
   * violet. Slightly brighter than sunset, the way early light actually is.
   */
  sunrise: {
    label: "Sunrise",
    background: "#7a6a86",
    fog: { color: "#7a6a86", near: 1400, far: 8000 },
    dome: { horizon: "#ffc46b", mid: "#ef8fa6", zenith: "#3f66a8", glow: "#ffb256" },
    stars: false,
    orb: { position: [2200, 380, -1400], core: "#fff0c4", halo: "#ffc06a", haloOpacity: 0.28 },
    ambient: { color: "#8496b4", intensity: 0.54 },
    hemisphere: { sky: "#ffd0a0", ground: "#2f3038", intensity: 0.66 },
    key: { position: [240, 150, -150], color: "#ffd7a8", intensity: 1.4 },
    fill: { position: [-160, 70, 180], color: "#89a6d8", intensity: 0.34 },
    environment: { top: "#ffd2a0", ringA: "#ffbf74", ringB: "#9db6e8", intensity: 0.52 },
    toneMappingExposure: 1.06,
    ground: { grass: "#2f8a38", plaza: "#474338", plazaRim: "#343128" },
  },

  /*
   * Dark — the park's original night, value for value. Do not retune these:
   * the night pass was verified against them. The one exception is
   * `ground.grass`, which moved from a near-neutral olive to a dark green when
   * the ground became a lawn rather than a painted plane — the same request
   * that greened the other two themes. Its VALUE is unchanged, so the night is
   * still as dark as it was; only the hue is now grass.
   */
  dark: {
    label: "Dark",
    background: "#05070f",
    fog: { color: "#0a1020", near: 1400, far: 8000 },
    dome: { horizon: "#16233d", mid: "#0a1024", zenith: "#03040b", glow: "#3d4f7a" },
    stars: true,
    orb: { position: [-2100, 1250, -1500], core: "#e8f1ff", halo: "#9db6e8", haloOpacity: 0.16 },
    ambient: { color: "#24304a", intensity: 0.16 },
    hemisphere: { sky: "#1c2c4a", ground: "#070a11", intensity: 0.34 },
    key: { position: [-210, 320, -150], color: "#a8c4ff", intensity: 0.62 },
    fill: { position: [120, 60, 180], color: "#5f7bb0", intensity: 0.12 },
    environment: { top: "#8ea8d8", ringA: "#7f9ad0", ringB: "#c79a63", intensity: 0.32 },
    toneMappingExposure: 0.92,
    ground: { grass: "#1b2618", plaza: "#3a3128", plazaRim: "#2a231b" },
  },
};

/** The park opens at sunset — the brief is explicitly "no need for full dark". */
export const DEFAULT_SKY_THEME: SkyTheme = "sunset";
