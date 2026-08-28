import { create } from "zustand";
import { OPENING_MINUTE } from "@/simulation/journey/journey";
import {
  DEFAULT_SPEED,
  resetJourneyClock,
  seekJourneyClock,
  setJourneyPaused,
  setJourneySpeed,
} from "@/simulation/journey/clock";

/**
 * Live state for the employee journey: the simulated clock, playback, and
 * which employee the user has clicked or is hovering.
 *
 * ADD-ONLY: a store of its own. Nothing in the rides, the department panel or
 * the existing simulation store reads or writes it, so clicking an employee or
 * pausing the timeline cannot disturb anything already in the park — the rides
 * keep running on their own clocks either way.
 *
 * `simTime` is pushed from the animation loop only when the displayed minute
 * actually changes, so the HUD re-renders about once a second rather than
 * sixty times a second. The walking figures never read it — they read the
 * frame-accurate clock directly — so the throttle costs no smoothness.
 *
 * Playback actions delegate to the clock module rather than duplicating its
 * state, so there is exactly one clock and the UI is a view of it.
 */
interface JourneyState {
  /** Simulated minutes-of-day, published roughly once a simulated minute. */
  simTime: number;
  paused: boolean;
  speed: number;
  selectedId: string | null;
  hoveredId: string | null;

  setSimTime: (minutes: number) => void;
  setPaused: (paused: boolean) => void;
  setSpeed: (speed: number) => void;
  seek: (minutes: number) => void;
  /** Put the morning back to its start. */
  reset: () => void;
  select: (employeeId: string) => void;
  clear: () => void;
  setHovered: (employeeId: string | null) => void;
}

export const useJourneyStore = create<JourneyState>((set) => ({
  /*
   * The same minute the clock module opens on, not the start of the day. The
   * HUD's copy is published from the frame loop only when the minute changes,
   * so seeding it with the wrong value leaves the first paint — and, on a
   * machine slow enough that the first frame takes a while, the whole opening
   * impression — reading 9:27 over an empty park.
   */
  simTime: OPENING_MINUTE,
  paused: false,
  speed: DEFAULT_SPEED,
  selectedId: null,
  hoveredId: null,

  setSimTime: (minutes) => set({ simTime: minutes }),

  setPaused: (paused) => {
    setJourneyPaused(paused);
    set({ paused });
  },
  setSpeed: (speed) => {
    setJourneySpeed(speed);
    set({ speed });
  },
  seek: (minutes) => set({ simTime: seekJourneyClock(minutes) }),

  /*
   * Reset restores the simulation, not the dataset: the employee records are
   * immutable, so rewinding the clock is all that is needed to replay exactly
   * the same morning. Selection is cleared because the panel would otherwise
   * describe someone who has not arrived yet.
   */
  reset: () => {
    setJourneyPaused(false);
    setJourneySpeed(DEFAULT_SPEED);
    set({ simTime: resetJourneyClock(), paused: false, speed: DEFAULT_SPEED, selectedId: null });
  },

  // A single slot, so only one employee panel can ever be open.
  select: (employeeId) => set({ selectedId: employeeId }),
  clear: () => set({ selectedId: null }),
  setHovered: (employeeId) => set({ hoveredId: employeeId }),
}));
