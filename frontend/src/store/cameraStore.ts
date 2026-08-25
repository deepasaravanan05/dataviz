import { create } from "zustand";
import { placeById, type CameraPlace } from "@/components/world/cameraPlaces";

/**
 * What the camera is currently doing.
 *
 * Three modes, and only three, because the brief is explicit that the camera
 * must never move on its own: it travels when the user asks it to and at no
 * other time.
 *
 *   free      the user is in charge; the director does nothing at all
 *   travel    easing toward a named viewpoint, then handing back to free
 *   follow    keeping a chosen employee framed while the user orbits them
 *
 * Follow does not seize the controls. It moves the orbit target with the
 * employee and leaves rotation and zoom to the user, so watching someone walk
 * across the park never means losing the ability to look around.
 */
export type CameraMode = "free" | "travel" | "follow";

interface CameraState {
  mode: CameraMode;
  /** The viewpoint being travelled to, if any. */
  destination: CameraPlace | null;
  /** The employee being followed, if any. */
  followId: string | null;
  /** Set once the director has eased into a follow, so it stops re-framing. */
  followSettled: boolean;

  travelTo: (placeId: string) => void;
  follow: (employeeId: string) => void;
  markFollowSettled: () => void;
  release: () => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  mode: "free",
  destination: null,
  followId: null,
  followSettled: false,

  travelTo: (placeId) =>
    set({ mode: "travel", destination: placeById(placeId), followId: null, followSettled: false }),

  follow: (employeeId) =>
    set({ mode: "follow", followId: employeeId, destination: null, followSettled: false }),

  markFollowSettled: () => set({ followSettled: true }),

  /** Hand the camera back to the user. */
  release: () => set({ mode: "free", destination: null, followId: null, followSettled: false }),
}));
