"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sky } from "@react-three/drei";
import { Suspense } from "react";
import { FerrisWheel } from "./FerrisWheel";
import { ParkGround } from "./ParkGround";
import { WHEEL_CENTER_HEIGHT } from "./constants";

/**
 * Three-quarter camera framing the complete ride (§24): the wheel spans
 * roughly y=0..30, so the camera sits back far enough that nothing is cropped
 * while keeping a clear side perspective on the cabin depth.
 */
const CAMERA_POSITION: [number, number, number] = [30, 17, 34];
const CAMERA_TARGET: [number, number, number] = [0, WHEEL_CENTER_HEIGHT * 0.82, 0];

export function FerrisWheelScene() {
  return (
    <Canvas shadows camera={{ position: CAMERA_POSITION, fov: 45 }}>
      <color attach="background" args={["#bcd6f2"]} />
      <fog attach="fog" args={["#bcd6f2", 70, 190]} />

      <Sky sunPosition={[60, 40, -20]} turbidity={3.5} rayleigh={1.1} mieCoefficient={0.005} />

      {/* Bright, layered lighting so the metal structure never reads as black (§23) */}
      <ambientLight intensity={0.75} />
      <hemisphereLight args={["#dceaff", "#5f8f52", 0.85]} />
      <directionalLight
        position={[38, 52, 26]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={42}
        shadow-camera-bottom={-10}
        shadow-camera-far={160}
      />
      {/* Fill from the camera side so the front of the wheel stays legible */}
      <directionalLight position={[-26, 20, 30]} intensity={0.65} color="#cfe0ff" />
      <pointLight position={[0, WHEEL_CENTER_HEIGHT, 18]} intensity={90} distance={70} decay={2} />

      <Suspense fallback={null}>
        <Environment resolution={256}>
          <Lightformer
            intensity={2.2}
            color="white"
            position={[0, 24, 0]}
            scale={[40, 40, 1]}
            rotation={[-Math.PI / 2, 0, 0]}
            form="rect"
          />
          <Lightformer intensity={1} color="#cddcff" position={[-26, 10, 20]} scale={16} form="ring" />
          <Lightformer intensity={0.6} color="#ffe8c2" position={[26, 8, -20]} scale={14} form="ring" />
        </Environment>
      </Suspense>

      <ParkGround />
      <FerrisWheel />

      <OrbitControls
        makeDefault
        target={CAMERA_TARGET}
        minDistance={20}
        maxDistance={120}
        maxPolarAngle={Math.PI / 2.05}
      />
    </Canvas>
  );
}
