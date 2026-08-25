"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { advanceJourneyClock } from "@/simulation/journey/clock";
import { useJourneyStore } from "@/store/journeyStore";

/**
 * Winds the simulated clock forward and publishes a throttled copy to the HUD.
 *
 * Separate from the figures so the clock advances exactly once per frame no
 * matter how many people are on screen, and so nothing that reads the clock
 * can accidentally drive it.
 */
export function JourneyClock() {
  const setSimTime = useJourneyStore((s) => s.setSimTime);
  const publishedMinute = useRef(-1);

  useFrame((_, delta) => {
    const simTime = advanceJourneyClock(delta);
    const minute = Math.floor(simTime);
    if (minute !== publishedMinute.current) {
      publishedMinute.current = minute;
      setSimTime(simTime);
    }
  });

  return null;
}
