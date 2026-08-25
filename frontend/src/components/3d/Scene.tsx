"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { SimulationLoop } from "./SimulationLoop";
import { Gate } from "./Gate";
import { RideMesh } from "./RideMesh";
import { Seats } from "./Seats";
import { Employees } from "./Employees";
import { DoubleTapZoom } from "@/components/park/DoubleTapZoom";

export function Scene() {
  return (
    <Canvas
      shadows
      camera={{ position: [2, 20, 30], fov: 45 }}
      style={{ touchAction: "none" }}
    >
      {/*
        Sky-coloured surround and matching fog: without these the ground simply
        ended against the page background, which read as a small green square
        floating in white.
      */}
      <color attach="background" args={["#bcd6f2"]} />
      <fog attach="fog" args={["#bcd6f2", 200, 520]} />

      <SimulationLoop />

      <ambientLight intensity={0.65} />
      <directionalLight position={[15, 25, 10]} intensity={1.1} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        {/* Extends far past the camera's 60u orbit limit, so the land runs to
            the horizon rather than stopping at a visible edge. */}
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial color="#4d7c3a" />
      </mesh>

      <Gate />
      <RideMesh />
      <Seats />
      <Employees />

      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={60}
        target={[0, 1, 0]}
      />

      {/* Double-tap / double-click to zoom toward whatever is under the cursor. */}
      <DoubleTapZoom />
    </Canvas>
  );
}
