import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const frac01 = (x) => ((x % 1) + 1) % 1;

function RoofPrism({ colorObj, explode, kind, glassMix }) {
  const ref = useRef();
  const mat = useRef();
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-3.2, 0); s.lineTo(3.2, 0); s.lineTo(0, 1.9); s.lineTo(-3.2, 0);
    return s;
  }, []);
  const geo = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth: 4.4, bevelEnabled: false }), [shape]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ref.current) {
      ref.current.position.y = 2.6 + explode * 1.1 + Math.sin(t * 0.8) * 0.04;
      ref.current.rotation.y = Math.sin(t * 0.15) * 0.08;
    }
    if (mat.current) {
      mat.current.color.lerp(colorObj, 0.12);
      const targetOpacity = kind === 'glass' ? 0.35 + glassMix * 0.1 : 1;
      mat.current.opacity += (targetOpacity - mat.current.opacity) * 0.12;
    }
  });

  const showSeams = kind === 'tile' || kind === 'shingle' || kind === 'thatch';
  return (
    <group>
      <mesh ref={ref} geometry={geo} position={[0, 0, -2.2]}>
        <meshPhysicalMaterial
          ref={mat}
          color={colorObj.clone()}
          transparent
          opacity={kind === 'glass' ? 0.35 : 1}
          roughness={kind === 'ceramic' ? 0.15 : kind === 'thatch' ? 0.95 : 0.55}
          metalness={kind === 'puf' ? 0.35 : 0.05}
          clearcoat={kind === 'ceramic' ? 1 : 0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 2.6 + explode * 1.1 + 1.9, 0]}>
        <boxGeometry args={[0.35, 0.18, 4.6]} />
        <meshStandardMaterial color="#0e1216" roughness={0.4} />
      </mesh>
      {showSeams && (
        <group position={[0, 2.6 + explode * 1.1, 0]}>
          {[-1.2, -0.4, 0.4, 1.2].map((x, i) => (
            <mesh key={i} position={[x * 1.4, 0.95 - Math.abs(x) * 0.42, 0]} rotation={[0, 0, x > 0 ? -0.53 : 0.53]}>
              <boxGeometry args={[0.08, 0.06, 4.5]} />
              <meshStandardMaterial color={i % 2 ? '#00000055' : '#ffffff33'} transparent opacity={0.5} />
            </mesh>
          ))}
        </group>
      )}
      {explode > 0.25 && (
        <mesh position={[0, 2.6 + explode * 0.45, 0]}>
          <boxGeometry args={[5.2, Math.max(0.1, 0.28 * explode), 4.2]} />
          <meshStandardMaterial color="#ffd166" emissive="#7a4d00" emissiveIntensity={0.25} transparent opacity={Math.min(1, explode)} />
        </mesh>
      )}
      {(kind === 'glass' || glassMix > 0.4) && (
        <group position={[0, 2.6 + explode * 1.1, 0]}>
          {[-2, -1, 0, 1, 2].map((x) => (
            <mesh key={x} position={[x, 0.95, 0]}>
              <boxGeometry args={[0.09, 1.9, 4.5]} />
              <meshStandardMaterial color="#0e1216" transparent opacity={kind === 'glass' ? 1 : glassMix} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function TileRain({ progress, colorObj }) {
  const ref = useRef();
  const mat = useRef();
  const COUNT = 42;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, i) => ({
    x: frac01(Math.sin(i * 12.9898) * 43758.5453) * 5 - 2.5,
    z: frac01(Math.cos(i * 78.233) * 12543.123) * 3.5 - 1.75,
    s: 0.5 + ((i * 37) % 10) / 18,
    o: (i / COUNT) * 1.2,
  })), []);

  useFrame(() => {
    if (!ref.current) return;
    seeds.forEach((sd, i) => {
      const local = THREE.MathUtils.clamp(progress * 1.6 - sd.o, 0, 1);
      const eased = 1 - Math.pow(1 - local, 3);
      dummy.position.set(sd.x, 6.5 - eased * (4.2 + sd.s), sd.z);
      dummy.rotation.set(eased * 0.6, sd.x, 0.15);
      dummy.scale.setScalar(sd.s);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (mat.current) mat.current.color.lerp(colorObj, 0.12);
  });

  return (
    <instancedMesh ref={ref} args={[null, null, COUNT]}>
      <boxGeometry args={[0.5, 0.08, 0.7]} />
      <meshStandardMaterial ref={mat} color={colorObj.clone()} roughness={0.6} />
    </instancedMesh>
  );
}

export default function RoofScene({ stage, stages, stageFloat = 0, scrollY }) {
  const group = useRef();
  const p = Math.min(1, Math.max(0, scrollY || 0));

  const list = useMemo(() => {
    if (Array.isArray(stages) && stages.length) return stages;
    if (stage) return [stage];
    return [{ color: '#b8471f', roof: 'tile' }];
  }, [stages, stage]);

  const f = Math.min(list.length - 1, Math.max(0, Number.isFinite(stageFloat) ? stageFloat : 0));
  const i0 = Math.floor(f);
  const i1 = Math.min(list.length - 1, i0 + 1);
  const t = f - i0;

  const colorObj = useMemo(() => new THREE.Color(list[i0]?.color || '#b8471f'), [list, i0]);
  useMemo(() => {
    const a = new THREE.Color(list[i0]?.color || '#b8471f');
    const b = new THREE.Color(list[i1]?.color || list[i0]?.color || '#b8471f');
    colorObj.copy(a).lerp(b, THREE.MathUtils.clamp(t, 0, 1));
  }, [list, i0, i1, t, colorObj]);

  const kind = t < 0.5 ? list[i0]?.roof || 'tile' : list[i1]?.roof || 'tile';
  const expOf = (r) => (r === 'puf' ? 0.9 : r === 'glass' ? 0.35 : 0.12);
  const explode = expOf(list[i0]?.roof) * (1 - t) + expOf(list[i1]?.roof) * t;
  const glassMix = ((list[i0]?.roof === 'glass' ? 1 : 0) * (1 - t) + (list[i1]?.roof === 'glass' ? 1 : 0) * t);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (group.current) {
      // continuous rotation across chapters + base scroll dolly
      group.current.rotation.y = -0.45 + f * 0.28 + p * 0.55 + Math.sin(time * 0.1) * 0.05;
      group.current.position.y = -0.4 - p * 0.4 + Math.sin(time * 0.5) * 0.02;
    }
    const cam = state.camera;
    const targetZ = 10.5 - p * 2.2 - f * 0.15;
    const targetY = 3.6 - p * 0.6;
    cam.position.z += (targetZ - cam.position.z) * 0.06;
    cam.position.y += (targetY - cam.position.y) * 0.06;
    cam.lookAt(0, 1.6, 0);
  });

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 4]} intensity={1.6} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#9fd8ff" />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#ffd9a8" />

      <group ref={group}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <circleGeometry args={[7.5, 48]} />
          <meshStandardMaterial color="#161d23" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.59, 0]}>
          <ringGeometry args={[4.9, 5.05, 64]} />
          <meshBasicMaterial color="#c65a2a" transparent opacity={0.7} />
        </mesh>

        <RoundedBox args={[4.6, 2.6, 3.6]} radius={0.06} position={[0, 1.0, 0]}>
          <meshStandardMaterial color="#ece5d8" roughness={0.85} />
        </RoundedBox>
        <mesh position={[0, -0.35, 0]}>
          <boxGeometry args={[5.0, 0.5, 4.0]} />
          <meshStandardMaterial color="#242c34" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.9, 1.83]}>
          <boxGeometry args={[0.9, 1.7, 0.06]} />
          <meshStandardMaterial color="#0e1216" roughness={0.5} />
        </mesh>
        {[[-1.5, 1.3], [1.5, 1.3]].map(([x, y], i) => (
          <mesh key={i} position={[x, y, 1.83]}>
            <boxGeometry args={[0.9, 0.8, 0.06]} />
            <meshStandardMaterial color="#ffd9a0" emissive="#ff9d3c" emissiveIntensity={0.85} />
          </mesh>
        ))}
        {(kind === 'glass' || glassMix > 0.35) && [-2.1, 2.1].map((x) => (
          <mesh key={x} position={[x, 1.4, 1.6]}>
            <cylinderGeometry args={[0.09, 0.09, 2.8, 12]} />
            <meshStandardMaterial color="#0e1216" metalness={0.6} roughness={0.3} transparent opacity={Math.max(0.3, glassMix)} />
          </mesh>
        ))}

        <RoofPrism colorObj={colorObj} kind={kind} explode={explode} glassMix={glassMix} />
        <TileRain progress={Math.min(1, p + f * 0.12)} colorObj={colorObj} />
      </group>

      <ContactShadows position={[0, -0.6, 0]} opacity={0.55} scale={14} blur={2.4} far={4} color="#000000" />
    </>
  );
}
