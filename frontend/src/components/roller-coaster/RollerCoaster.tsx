"use client";

import { Track } from "./Track";
import { Supports } from "./Supports";
import { Station } from "./Station";
import { Train } from "./Train";
import { COASTER_ORIGIN } from "./constants";

/**
 * The complete attraction, positioned beside the Ferris Wheel at the park
 * origin. Everything is authored in the coaster's local space and offset by
 * COASTER_ORIGIN, so the ride can be repositioned without touching geometry.
 */
export function RollerCoaster() {
  return (
    <group position={COASTER_ORIGIN}>
      <Station />
      <Supports />
      <Track />
      <Train />
    </group>
  );
}
