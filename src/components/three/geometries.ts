import * as THREE from "three";

/** Classic teardrop: x = sin(t)·sin(t/2)^m, y = cos(t), revolved around Y. */
export function createDropGeometry(segments = 96, m = 1.1) {
  const pts: THREE.Vector2[] = [];
  const steps = 80;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI;
    const x = Math.sin(t) * Math.pow(Math.sin(t / 2), m);
    pts.push(new THREE.Vector2(Math.max(x, 0.0001) * 0.95, Math.cos(t) * 1.15));
  }
  // bottom → top so faces/normals point outward
  const geo = new THREE.LatheGeometry(pts.reverse(), segments);
  geo.computeVertexNormals();
  return geo;
}

/** Biconcave red-blood-cell disc (Evans–Fung profile). */
export function createRbcGeometry(segments = 48) {
  const c0 = 0.207, c2 = 2.003, c4 = -1.123;
  const steps = 40;
  const top: THREE.Vector2[] = [];
  const bottom: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = Math.min(i / steps, 0.9999);
    const h = Math.sqrt(1 - x * x) * (c0 + c2 * x * x + c4 * x ** 4) * 0.5;
    top.push(new THREE.Vector2(x, h));
    bottom.unshift(new THREE.Vector2(x, -h));
  }
  // bottom-centre → rim → top-centre so normals point outward
  const geo = new THREE.LatheGeometry([...top, new THREE.Vector2(1, 0), ...bottom].reverse(), segments);
  geo.computeVertexNormals();
  return geo;
}

/** Evenly distributed points on a sphere. */
export function fibonacciSphere(n: number, radius = 1) {
  const pts: THREE.Vector3[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push(new THREE.Vector3(Math.cos(theta) * r * radius, y * radius, Math.sin(theta) * r * radius));
  }
  return pts;
}

export function latLngToVec3(lat: number, lng: number, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}
