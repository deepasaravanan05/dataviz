export function polar(radius: number, angle: number): [number, number] {
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

export interface Segment2D {
  position: [number, number, number];
  rotationZ: number;
  length: number;
}

/** A straight beam between two points in the wheel's flat plane, at a fixed z. */
export function segment(p1: [number, number], p2: [number, number], z = 0): Segment2D {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  return {
    position: [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, z],
    rotationZ: Math.atan2(dy, dx),
    length: Math.hypot(dx, dy),
  };
}
