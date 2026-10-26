"use client";
import * as React from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Float, Lightformer, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { createDropGeometry, createRbcGeometry } from "./geometries";
import { Boundary, SceneVisible } from "./safe-scene";

function BloodDropMesh() {
  const geo = React.useMemo(() => createDropGeometry(), []);
  const ref = React.useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);
  const scale = React.useRef(1);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // heartbeat pulse: two quick beats then rest
    const beat = t % 1.4;
    const pulse = beat < 0.12 ? Math.sin((beat / 0.12) * Math.PI) * 0.06 : beat > 0.22 && beat < 0.34 ? Math.sin(((beat - 0.22) / 0.12) * Math.PI) * 0.035 : 0;
    const target = (hovered ? 1.08 : 1) + pulse;
    scale.current = THREE.MathUtils.damp(scale.current, target, 10, dt);
    ref.current.scale.setScalar(scale.current);
    ref.current.rotation.y += dt * (hovered ? 0.9 : 0.25);
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <MeshDistortMaterial
        color="#d4062e"
        emissive="#4a0010"
        emissiveIntensity={0.6}
        roughness={0.08}
        metalness={0.1}
        clearcoat={1}
        clearcoatRoughness={0.05}
        distort={hovered ? 0.32 : 0.18}
        speed={hovered ? 3.5 : 1.6}
        envMapIntensity={1.6}
      />
    </mesh>
  );
}

function RedBloodCells({ count = 32 }) {
  const geo = React.useMemo(() => createRbcGeometry(), []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  const cells = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        radius: 2.1 + Math.random() * 2.6,
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        y: (Math.random() - 0.5) * 3.4,
        speed: 0.08 + Math.random() * 0.14,
        size: 0.16 + Math.random() * 0.2,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(1.2),
        bob: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    cells.forEach((c, i) => {
      const a = c.angle + t * c.speed;
      dummy.position.set(Math.cos(a) * c.radius, c.y + Math.sin(t * 0.6 + c.bob) * 0.25, Math.sin(a) * c.radius * 0.6 - 0.6);
      dummy.rotation.set(t * c.spin.x * 0.4 + c.bob, t * c.spin.y * 0.4, t * c.spin.z * 0.3);
      dummy.scale.setScalar(c.size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]}>
      <meshPhysicalMaterial color="#b3001e" emissive="#3a0008" roughness={0.35} clearcoat={0.6} sheen={1} sheenColor="#ff6b81" />
    </instancedMesh>
  );
}

/** Subtle parallax that follows the pointer. */
function Rig() {
  const { camera, pointer } = useThree();
  useFrame((_, dt) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.8, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.5, 3, dt);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const visible = React.useContext(SceneVisible);
  return (
    <Canvas frameloop={visible ? "always" : "never"} dpr={[1, 1.5]} camera={{ position: [0, 0, 6.2], fov: 42 }} gl={{ antialias: true, alpha: true, powerPreference: "default", failIfMajorPerformanceCaveat: false }}>
      <ambientLight intensity={0.25} />
      <pointLight position={[3, 3, 4]} intensity={40} color="#ff4d6d" />
      <pointLight position={[-4, -2, 2]} intensity={25} color="#ff8a5c" />
      <spotLight position={[0, 6, 3]} angle={0.5} penumbra={1} intensity={60} color="#ffffff" />

      <Float speed={1.6} rotationIntensity={0.35} floatIntensity={0.9}>
        <BloodDropMesh />
      </Float>
      <RedBloodCells />
      <Sparkles count={40} scale={[9, 6, 4]} size={2.4} speed={0.35} color="#ff6b81" opacity={0.7} />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 3]} scale={[8, 2, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={4} position={[-4, 1, 2]} scale={2} color="#ff2d55" />
        <Lightformer form="rect" intensity={2} position={[4, -1, 2]} scale={[2, 6, 1]} color="#ff9a5c" />
        <Lightformer form="circle" intensity={1.5} position={[0, -4, -2]} scale={6} color="#6b0f2a" />
      </Environment>

      {/* Bloom is optional — if the GPU can't do it, keep the scene without it */}
      <Boundary label="Bloom" fallback={() => null}>
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.25} luminanceSmoothing={0.6} mipmapBlur />
          <Vignette offset={0.25} darkness={0.7} />
        </EffectComposer>
      </Boundary>
      <Rig />
    </Canvas>
  );
}
