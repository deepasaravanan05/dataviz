"use client";

import { Text } from "@react-three/drei";
import {
  FOOD_COURT_CENTER,
  FOOD_COURT_DOOR_LOCAL,
  FOOD_COURT_FACING,
  FOOD_COURT_TABLES,
} from "@/simulation/journey/constants";
import { PROP } from "@/world/scale";
import { Bench, Bin, LampPost, MAT, Planter, Railing } from "@/components/world/kit";

/**
 * The park food court — the intermediate stop between checking in and reaching
 * a department ride, and the place a large share of the delay is spent.
 *
 * Rebuilt at human scale. The tables were three metres across and twelve
 * metres apart, sized for the oversized figures that used to walk here; they
 * are now 0.84 m across at a 3.4 m pitch, which is what a real terrace looks
 * like, and the building is a 40 m food hall rather than an abstract block.
 *
 * The table positions come from the same constants the walking employees use,
 * so a diner always sits at a table that actually exists.
 */

const TERRACE = "#b9ad97";
const WALL = "#f3e9d8";
const WALL_TRIM = "#c8562f";
const ROOF = "#8c3b23";

const PARASOL_COLORS = ["#c9503f", "#e0a52c", "#3f8a70", "#b9563f", "#d79a35"];

function Table({ x, z, color, seed }: { x: number; z: number; color: string; seed: number }) {
  const angle = (seed % 7) * 0.21;
  return (
    <group position={[x, 0, z]} rotation={[0, angle, 0]}>
      {/* Pedestal and top */}
      <mesh position={[0, PROP.tableTopY / 2, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.14, PROP.tableTopY, 8]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, PROP.tableTopY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PROP.tableRadius, PROP.tableRadius, 0.04, 16]} />
        <primitive object={MAT.wood} attach="material" />
      </mesh>

      {[0, 1, 2, 3].map((k) => {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
        const cx = Math.cos(a) * 0.72;
        const cz = Math.sin(a) * 0.72;
        return (
          <group key={k} position={[cx, 0, cz]} rotation={[0, -a + Math.PI / 2, 0]}>
            <mesh position={[0, PROP.chairSeatY, 0]} castShadow>
              <boxGeometry args={[PROP.chairWidth, 0.04, PROP.chairWidth]} />
              <primitive object={MAT.woodDark} attach="material" />
            </mesh>
            <mesh position={[0, (PROP.chairSeatY + PROP.chairBackY) / 2, -0.2]} castShadow>
              <boxGeometry args={[PROP.chairWidth, PROP.chairBackY - PROP.chairSeatY, 0.04]} />
              <primitive object={MAT.woodDark} attach="material" />
            </mesh>
            {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([lx, lz], j) => (
              <mesh key={j} position={[lx, PROP.chairSeatY / 2, lz]}>
                <boxGeometry args={[0.03, PROP.chairSeatY, 0.03]} />
                <primitive object={MAT.steel} attach="material" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Parasol */}
      <mesh position={[0, PROP.parasolY / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, PROP.parasolY, 6]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, PROP.parasolY, 0]} castShadow>
        <coneGeometry args={[PROP.parasolRadius, 0.42, 10]} />
        <meshStandardMaterial color={color} roughness={0.85} side={2} />
      </mesh>
    </group>
  );
}

/** A serving kiosk with an awning and a counter. */
function Counter({ x, label, color }: { x: number; label: string; color: string }) {
  return (
    <group position={[x, 0, -3]}>
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 3.2, 3]} />
        <meshStandardMaterial color={WALL} roughness={0.88} />
      </mesh>
      {/* Counter top at serving height */}
      <mesh position={[0, 1.06, 1.7]} castShadow>
        <boxGeometry args={[6.6, 0.08, 0.7]} />
        <primitive object={MAT.steel} attach="material" />
      </mesh>
      <mesh position={[0, 0.52, 1.7]}>
        <boxGeometry args={[6.4, 1.04, 0.55]} />
        <primitive object={MAT.steelDark} attach="material" />
      </mesh>
      {/* Menu board */}
      <mesh position={[0, 2.35, 1.42]} castShadow>
        <boxGeometry args={[5.6, 1.1, 0.08]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <Text position={[0, 2.35, 1.48]} fontSize={0.42} color="#fff6e6" anchorX="center" anchorY="middle">
        {label}
      </Text>
      {/* Awning */}
      <mesh position={[0, 3.05, 2.5]} rotation={[-0.36, 0, 0]} castShadow>
        <boxGeometry args={[6.8, 0.08, 2.4]} />
        <meshStandardMaterial color={color} roughness={0.82} />
      </mesh>
      {[-3.2, 3.2].map((px) => (
        <mesh key={px} position={[px, 1.6, 3.4]}>
          <cylinderGeometry args={[0.05, 0.05, 3.2, 6]} />
          <primitive object={MAT.steel} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

export function FoodCourt() {
  return (
    <group
      position={[FOOD_COURT_CENTER[0], 0, FOOD_COURT_CENTER[1]]}
      rotation={[0, FOOD_COURT_FACING, 0]}
    >
      {/* Terrace paving, and grass beyond it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4]} receiveShadow>
        <planeGeometry args={[34, 38]} />
        <meshStandardMaterial color={TERRACE} roughness={0.97} />
      </mesh>

      {/* Main hall — two and a half storeys, 40 m across. */}
      <group position={[0, 0, -13]}>
        <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[40, 8.8, 15]} />
          <meshStandardMaterial color={WALL} roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[40.5, 1, 15.5]} />
          <meshStandardMaterial color={WALL_TRIM} roughness={0.82} />
        </mesh>
        {/* Pitched roof */}
        <mesh position={[0, 10.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[28, 3.4, 4]} />
          <meshStandardMaterial color={ROOF} roughness={0.84} />
        </mesh>
        {/* Glazed frontage at human scale */}
        {[-13, -4.5, 4.5, 13].map((wx) => (
          <mesh key={wx} position={[wx, 3.6, 7.6]}>
            <boxGeometry args={[6, 4.4, 0.12]} />
            <primitive object={MAT.glass} attach="material" />
          </mesh>
        ))}
        {/* Entrance doors */}
        <mesh position={[0, PROP.doorHeight / 2, 7.62]}>
          <boxGeometry args={[PROP.doorWidth * 3, PROP.doorHeight, 0.1]} />
          <primitive object={MAT.steelDark} attach="material" />
        </mesh>

        {/* Roof sign */}
        <mesh position={[0, 13.1, 2]} castShadow>
          <boxGeometry args={[18, 2.6, 0.35]} />
          <meshStandardMaterial color={WALL_TRIM} roughness={0.58} />
        </mesh>
        <Text position={[0, 13.1, 2.22]} fontSize={1.5} color="#fff6e6" anchorX="center" anchorY="middle">
          FOOD COURT
        </Text>
      </group>

      {/* Serving kiosks */}
      <Counter x={-8} label="COFFEE" color="#3f8a70" />
      <Counter x={0} label="BREAKFAST" color="#c9503f" />
      <Counter x={8} label="SNACKS" color="#e0a52c" />

      {/* Seating terrace */}
      {FOOD_COURT_TABLES.map(([x, z], i) => (
        <Table key={i} x={x} z={z} seed={i} color={PARASOL_COLORS[i % PARASOL_COLORS.length]} />
      ))}

      {/* Terrace edge, planting, lighting and bins. */}
      <Railing position={[0, 0, 20]} length={30} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <LampPost position={[s * 15, 0, 6]} />
          <Planter position={[s * 15, 0, 16]} w={4} d={2.2} />
          <Bench position={[s * 12, 0, 19]} rotation={Math.PI} />
          <Bin position={[s * 9.5, 0, 19.4]} />
        </group>
      ))}

      {/* Entrance marker where employees step on and off the terrace. */}
      <group position={[FOOD_COURT_DOOR_LOCAL[0], 0, FOOD_COURT_DOOR_LOCAL[1]]}>
        {[-2.4, 2.4].map((px) => (
          <mesh key={px} position={[px, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.18, 2.8, 8]} />
            <primitive object={MAT.wood} attach="material" />
          </mesh>
        ))}
        <mesh position={[0, 3.05, 0]} castShadow>
          <boxGeometry args={[5.6, 0.7, 0.16]} />
          <meshStandardMaterial color={WALL_TRIM} roughness={0.72} />
        </mesh>
        <Text position={[0, 3.05, 0.1]} fontSize={0.4} color="#fff6e6" anchorX="center" anchorY="middle">
          WELCOME
        </Text>
      </group>
    </group>
  );
}
