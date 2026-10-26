"use client";
import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { fibonacciSphere, latLngToVec3 } from "./geometries";
import { Boundary, SceneVisible } from "./safe-scene";

const R = 2;
const HUBS: [number, number][] = [
  [28.61, 77.21], [19.08, 72.88], [12.97, 77.59], [22.57, 88.36], [13.08, 80.27], [17.38, 78.49],
  [40.71, -74.0], [51.51, -0.13], [35.68, 139.69], [-33.87, 151.21], [1.35, 103.82], [25.2, 55.27],
  [-23.55, -46.63], [6.52, 3.38], [48.86, 2.35], [37.77, -122.42], [-1.29, 36.82], [55.75, 37.62],
];

function DotSphere() {
  const geo = React.useMemo(() => {
    const pts = fibonacciSphere(2600, R);
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.024} color="#7a6b85" transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

function Pulse({ position, delay = 0, color = "#ff2d55" }: { position: THREE.Vector3; delay?: number; color?: string }) {
  const ring = React.useRef<THREE.Mesh>(null);
  const quat = React.useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize()), [position]);
  useFrame((s) => {
    if (!ring.current) return;
    const t = ((s.clock.elapsedTime + delay) % 2) / 2;
    ring.current.scale.setScalar(0.4 + t * 2.2);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <group position={position} quaternion={quat}>
      <mesh>
        <circleGeometry args={[0.03, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.04, 0.055, 32]} />
        <meshBasicMaterial color={color} transparent toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Arc({ from, to, delay }: { from: THREE.Vector3; to: THREE.Vector3; delay: number }) {
  const ref = React.useRef<{ material: { dashOffset: number } } | null>(null);
  const points = React.useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const lift = 1 + from.distanceTo(to) * 0.35;
    mid.normalize().multiplyScalar(R * lift);
    return new THREE.QuadraticBezierCurve3(from, mid, to).getPoints(48);
  }, [from, to]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.material.dashOffset -= dt * 0.6;
  });
  return (
    <Line
      ref={ref as never}
      points={points}
      color="#ff4d6d"
      lineWidth={1.4}
      dashed
      dashSize={0.25}
      gapSize={0.6}
      dashOffset={delay}
      transparent
      opacity={0.85}
      toneMapped={false}
    />
  );
}

function Globe({ donorPoints }: { donorPoints: [number, number][] }) {
  const group = React.useRef<THREE.Group>(null);
  const hubs = React.useMemo(() => HUBS.map(([lat, lng]) => latLngToVec3(lat, lng, R * 1.005)), []);
  const arcs = React.useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < hubs.length; i++) {
      const j = (i * 7 + 3) % hubs.length;
      if (i !== j) pairs.push([hubs[i]!, hubs[j]!]);
    }
    return pairs;
  }, [hubs]);
  const donorGeo = React.useMemo(() => {
    const pts = donorPoints.map(([lng, lat]) => latLngToVec3(lat + (Math.random() - 0.5) * 0.6, lng + (Math.random() - 0.5) * 0.6, R * 1.01));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [donorPoints]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.06;
  });

  return (
    <group ref={group} rotation={[0.35, -1.9, 0]}>
      <mesh>
        <sphereGeometry args={[R * 0.99, 64, 64]} />
        <meshStandardMaterial color="#0c0910" roughness={0.9} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[R, 64, 64]} />
        <shaderMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={{ c: { value: new THREE.Color("#ff2d55") } }}
          vertexShader={`varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `}
          fragmentShader={`uniform vec3 c; varying vec3 vN; void main(){ float i = pow(0.65 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(c, 1.0) * i * 1.6; }`}
        />
      </mesh>
      <DotSphere />
      <points geometry={donorGeo}>
        <pointsMaterial size={0.045} color="#ff2d55" toneMapped={false} />
      </points>
      {hubs.map((p, i) => (
        <Pulse key={i} position={p} delay={i * 0.37} />
      ))}
      {arcs.map(([a, b], i) => (
        <Arc key={i} from={a} to={b} delay={i * 0.4} />
      ))}
    </group>
  );
}

export default function GlobeScene({ donorPoints = [] }: { donorPoints?: [number, number][] }) {
  const visible = React.useContext(SceneVisible);
  return (
    <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 6], fov: 45 }} gl={{ alpha: true, antialias: true, failIfMajorPerformanceCaveat: false }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Globe donorPoints={donorPoints} />
      <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.5} autoRotate={false} />
      <Boundary label="Bloom" fallback={() => null}>
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.1} luminanceThreshold={0.2} mipmapBlur />
        </EffectComposer>
      </Boundary>
    </Canvas>
  );
}
