"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCameraStore } from "@/store/cameraStore";
import { sampleJourney } from "@/simulation/journey/journey";
import { activeEmployeeById } from "@/simulation/journey/activeJourney";
import { currentSimTime } from "@/simulation/journey/clock";
import { HUMAN } from "@/world/scale";

/**
 * Moves the camera, and only when asked.
 *
 * Travelling eases both the eye and the orbit target toward a named viewpoint
 * with a critically-damped approach — fast at first, settling without
 * overshoot — and then hands control straight back to the user. Nothing here
 * ever animates the camera on its own; if the mode is `free` this component
 * does nothing at all, which is what keeps exploration from being interrupted.
 *
 * Follow mode deliberately moves the orbit *target* rather than the camera:
 * the employee stays framed while the user keeps full freedom to rotate and
 * zoom around them. The camera is eased to a sensible standing-back distance
 * once, on entering follow, and left alone after that.
 */

/** Seconds to close most of the remaining distance while travelling. */
const TRAVEL_HALF_LIFE = 0.32;
/** Close enough to call it arrived, in metres. */
const ARRIVAL_EPSILON = 1.5;

/** A comfortable distance to watch a person from — not glued to their head. */
const FOLLOW_DISTANCE = 26;
const FOLLOW_HEIGHT = 11;

export function CameraDirector() {
  const goalPos = useRef(new THREE.Vector3());
  const goalLook = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    // Read from the frame state rather than a captured binding, so nothing
    // owned by React is mutated from inside the loop.
    const controls = state.controls as unknown as
      | { target: THREE.Vector3; update: () => void }
      | null;
    if (!controls) return;

    const { mode, destination, followId, followSettled } = useCameraStore.getState();
    if (mode === "free") return;

    const dt = Math.min(delta, 0.1);
    // Frame-rate independent easing: the same curve at 30 fps and at 144.
    const k = 1 - Math.pow(0.5, dt / TRAVEL_HALF_LIFE);

    if (mode === "travel" && destination) {
      goalPos.current.set(...destination.position);
      goalLook.current.set(...destination.lookAt);

      state.camera.position.lerp(goalPos.current, k);
      controls.target.lerp(goalLook.current, k);
      controls.update();

      if (
        state.camera.position.distanceTo(goalPos.current) < ARRIVAL_EPSILON &&
        controls.target.distanceTo(goalLook.current) < ARRIVAL_EPSILON
      ) {
        useCameraStore.getState().release();
      }
      return;
    }

    if (mode === "follow" && followId) {
      const employee = activeEmployeeById(followId);
      if (!employee) {
        useCameraStore.getState().release();
        return;
      }
      const at = sampleJourney(employee, currentSimTime());
      if (!at) {
        // Not on stage yet — hold at the entrance rather than snapping to nowhere.
        return;
      }

      /* Follow them up the ride too: `at.y` is zero for every leg walked on the
         ground and is the seat's height once they are aboard, so the camera
         keeps its subject in frame instead of watching the ground beneath. */
      goalLook.current.set(at.x, at.y + HUMAN.shoulderY, at.z);

      if (!followSettled) {
        // Ease in behind them once, then leave the camera to the user.
        scratch.current.set(
          at.x - Math.sin(at.facing) * FOLLOW_DISTANCE,
          at.y + FOLLOW_HEIGHT,
          at.z - Math.cos(at.facing) * FOLLOW_DISTANCE,
        );
        state.camera.position.lerp(scratch.current, k);
        controls.target.lerp(goalLook.current, k);
        controls.update();

        if (controls.target.distanceTo(goalLook.current) < ARRIVAL_EPSILON) {
          useCameraStore.getState().markFollowSettled();
        }
        return;
      }

      /*
       * Settled: carry the camera along with the employee by exactly the
       * distance the target moved, so the user's chosen angle and zoom are
       * preserved while the subject stays centred.
       */
      scratch.current.copy(goalLook.current).sub(controls.target);
      const step = Math.min(1, k * 2.4);
      scratch.current.multiplyScalar(step);
      controls.target.add(scratch.current);
      state.camera.position.add(scratch.current);
      controls.update();
    }
  });

  return null;
}
