import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Sphere, Cylinder, Capsule, Line, Html, useGLTF, Center, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { Activity, Brain, Heart, Layers, Play, Pause, ZoomIn, Info, Volume2, VolumeX, Upload, X } from 'lucide-react';

// --- 3D Components ---

function Bed() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Main Base */}
      <RoundedBox args={[1.2, 0.4, 2.4]} radius={0.05} position={[0, 0.2, 0]}>
        <meshStandardMaterial color="#1f1b18" roughness={0.8} />
      </RoundedBox>
      {/* Mattress */}
      <RoundedBox args={[1.1, 0.15, 2.3]} radius={0.05} position={[0, 0.475, 0]}>
        <meshStandardMaterial color="#2c2724" roughness={0.9} />
      </RoundedBox>
    </group>
  );
}

function Hotspot({ position, title, desc, visible }: { position: [number, number, number], title: string, desc: string, visible: boolean }) {
  if (!visible) return null;
  return (
    <Html position={position} center zIndexRange={[100, 0]}>
      <div className="group relative flex items-center justify-center cursor-pointer pointer-events-auto">
        <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] animate-pulse border-2 border-blue-500" />
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-48 bg-black/70 backdrop-blur-xl text-white p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/20 shadow-2xl">
          <div className="text-xs font-bold mb-1 text-blue-400">{title}</div>
          <div className="text-[10px] leading-relaxed text-gray-200">{desc}</div>
        </div>
      </div>
    </Html>
  );
}

function BeatingHeart({ progress }: { progress: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = new THREE.Color().lerpColors(new THREE.Color('#ef4444'), new THREE.Color('#3b82f6'), progress);
  
  useFrame(({ clock }) => {
    // Heart rate slows down as progress increases (stress to calm)
    const speed = 12 - (progress * 8); 
    const scale = 1 + Math.sin(clock.elapsedTime * speed) * 0.15;
    if (ref.current) ref.current.scale.setScalar(scale);
  });

  return (
    <Sphere ref={ref} args={[0.06, 32, 32]} position={[-0.06, 0.05, -0.35]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </Sphere>
  );
}

function SoundPulse({ start, target, delay = 0 }: { start: [number, number, number], target: [number, number, number], delay?: number }) {
  const ref = useRef<THREE.Group>(null);
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime * 0.5 + delay) % 1); // 0 to 1
    ref.current.position.lerpVectors(startVec, targetVec, t);
    ref.current.lookAt(targetVec);
    
    const scale = 1 + t * 3;
    ref.current.scale.setScalar(scale);
    
    ref.current.children.forEach((child, i) => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * (0.3 - i * 0.1);
    });
  });

  return (
    <group ref={ref}>
      <mesh>
        <torusGeometry args={[0.05, 0.004, 16, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, 0, 0.02]} scale={0.8}>
        <torusGeometry args={[0.05, 0.002, 16, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Speaker({ position, target }: { position: [number, number, number], target: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(new THREE.Vector3(...target));
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <RoundedBox args={[0.4, 0.3, 0.3]} radius={0.02}>
        <meshStandardMaterial color="#1f1b18" roughness={0.2} metalness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0, 0.16]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0, 0.15]}>
        <ringGeometry args={[0.11, 0.12, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function SoundWaves({ progress }: { progress: number }) {
  const waves = useRef<(THREE.Mesh | null)[]>([]);
  
  useFrame(({ clock }) => {
    waves.current.forEach((wave, i) => {
      if (!wave) return;
      const speed = 0.2 + (1 - progress) * 0.5;
      const t = (clock.elapsedTime * speed + i * 0.33) % 1;
      
      wave.position.y = -0.1 + (t * 0.6);
      wave.scale.setScalar(1 + t * 0.2);
      
      const mat = wave.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.sin(t * Math.PI) * 0.08; // Very soft opacity
      
      const stressColor = new THREE.Color('#ef4444');
      const calmColor = new THREE.Color('#3b82f6');
      mat.color.lerpColors(stressColor, calmColor, progress);
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={el => { waves.current[i] = el; }} rotation={[-Math.PI/2, 0, 0]}>
          <torusGeometry args={[0.6, 0.002, 16, 100]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function CellularNetwork({ progress, color }: { progress: number, color: string }) {
  const count = 4000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const z = (Math.random() - 0.5) * 1.8; // -0.9 to 0.9
      let width = 0.1;
      if (z < -0.7) width = 0.12; // Head
      else if (z < -0.6) width = 0.05; // Neck
      else if (z < -0.2) width = 0.25; // Torso
      else if (z < 0.2) width = 0.2; // Hips
      else width = 0.15; // Legs
      
      const x = (Math.random() - 0.5) * width * 2;
      const y = (Math.random() - 0.5) * 0.15; // Thickness
      
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (pointsRef.current) {
      const speed = 1 + (1 - progress) * 3;
      const pulse = (Math.sin(clock.elapsedTime * speed) + 1) / 2;
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.size = 0.008 + pulse * 0.008;
      mat.opacity = 0.3 + pulse * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} transparent opacity={0.6} size={0.01} sizeAttenuation={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

function BranchingNerves({ color, progress }: { color: string, progress: number }) {
  const lines = useMemo(() => {
    const generated = [];
    for (let i = 0; i < 60; i++) {
      const zStart = -0.7 + Math.random() * 0.8;
      const side = Math.random() > 0.5 ? 1 : -1;
      const xEnd = side * (0.1 + Math.random() * 0.25);
      const zEnd = zStart + (Math.random() - 0.5) * 0.3;
      const yEnd = (Math.random() - 0.5) * 0.15;
      
      const xMid = xEnd * 0.5;
      const zMid = zStart + (zEnd - zStart) * 0.5;
      const yMid = yEnd * 0.5 + (Math.random() * 0.05);

      generated.push([
        [0, 0, zStart],
        [xMid, yMid, zMid],
        [xEnd, yEnd, zEnd]
      ]);
    }
    return generated;
  }, []);

  const impulsesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (impulsesRef.current) {
      const time = clock.elapsedTime * (1 + progress * 2);
      impulsesRef.current.children.forEach((child, i) => {
        const t = (time + i * 0.1) % 1;
        const linePts = lines[i];
        if (linePts) {
          // Interpolate position along the 3 points
          const ptIndex = t < 0.5 ? 0 : 1;
          const localT = (t % 0.5) * 2;
          const p1 = new THREE.Vector3(...linePts[ptIndex]);
          const p2 = new THREE.Vector3(...linePts[ptIndex + 1]);
          child.position.lerpVectors(p1, p2, localT);
        }
      });
    }
  });

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts as any} color={color} lineWidth={1.5} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      ))}
      <group ref={impulsesRef}>
        {lines.map((_, i) => (
          <mesh key={`impulse-${i}`}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Model({ progress, layer }: { progress: number, layer: string }) {
  const { scene } = useGLTF('/ecorche_-_anatomy_study.glb');
  
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Transparency effect based on progress
        if (mesh.material) {
          // If layer is 'all', we fade the skin to reveal the nervous system inside
          // If layer is 'skin', we keep it opaque.
          const targetOpacity = layer === 'all' ? Math.max(0.15, 1 - (progress * 1.5)) : 1;
          
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.transparent = targetOpacity < 1;
          mat.opacity = targetOpacity;
          
          // Remove emissive glow from the skin so the internal nerves stand out clearly
          mat.emissive = new THREE.Color('#000000');
          mat.emissiveIntensity = 0;
          
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene, progress, layer]);

  // Le modèle Sketchfab a une échelle interne microscopique (0.00039).
  // Il faut le multiplier par ~80 pour qu'il fasse une taille humaine normale (2m).
  return (
    <group position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={80}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload('/ecorche_-_anatomy_study.glb');

function DetailedMannequin({ layer, progress }: { layer: string, progress: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Breathing animation: chest expands slightly. Slower as progress increases.
      const breathSpeed = 3 - progress * 2; 
      const breath = Math.sin(clock.elapsedTime * breathSpeed) * 0.015;
      groupRef.current.scale.set(1, 1 + breath * 0.5, 1 + breath);
    }
  });

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#e0f2fe',
    transmission: 0.8,
    opacity: 1,
    metalness: 0.2,
    roughness: 0.1,
    ior: 1.5,
    thickness: 0.5,
    transparent: true,
    clearcoat: 1,
  }), []);

  const showSkin = layer === 'all' || layer === 'skin';
  const showNervous = layer === 'all' || layer === 'nervous';
  const showVascular = layer === 'all' || layer === 'vascular';

  const stateColor = new THREE.Color().lerpColors(new THREE.Color('#ef4444'), new THREE.Color('#3b82f6'), progress).getHexString();
  const stateColorHex = `#${stateColor}`;

  return (
    <group ref={groupRef} position={[0, 0.25, 0]}>
      {/* Skin Layer (Real 3D Model) */}
      {showSkin && (
        <Model progress={progress} layer={layer} />
      )}

      {/* Hotspots */}
      <Hotspot position={[0, 0.1, -0.88]} title="Cortex Cérébral" desc="Ondes Thêta stimulées, favorisant un état méditatif profond." visible={showNervous} />
      <Hotspot position={[-0.06, 0.15, -0.35]} title="Myocarde" desc="Baisse de la fréquence cardiaque et augmentation de la VFC." visible={showVascular} />
      <Hotspot position={[0, 0.05, -0.5]} title="Nerf Vague" desc="Activation parasympathique, réduction immédiate du cortisol." visible={showNervous} />

      {/* Nervous System */}
      {showNervous && (
        <group position={[0, -0.12, 0]}>
          {/* Brain */}
          <Sphere args={[0.08, 24, 24]} position={[0, 0.02, -0.88]}>
            <meshBasicMaterial color={stateColorHex} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
          </Sphere>
          {/* Brain Core (glowing) */}
          <Sphere args={[0.04, 16, 16]} position={[0, 0.02, -0.88]}>
            <meshBasicMaterial color={stateColorHex} transparent opacity={0.9} />
          </Sphere>
          
          {/* Spinal Cord */}
          <Line points={[[0, 0, -0.8], [0, -0.02, -0.5], [0, -0.02, 0.1]]} color={stateColorHex} lineWidth={5} />
          
          {/* Peripheral Nerves (simplified branching) */}
          {/* Arms */}
          <Line points={[[0, -0.02, -0.5], [-0.25, 0, -0.4], [-0.32, 0, -0.1]]} color={stateColorHex} lineWidth={2} transparent opacity={0.6} />
          <Line points={[[0, -0.02, -0.5], [0.25, 0, -0.4], [0.32, 0, -0.1]]} color={stateColorHex} lineWidth={2} transparent opacity={0.6} />
          {/* Legs */}
          <Line points={[[0, -0.02, 0.1], [-0.1, 0, 0.3], [-0.12, 0, 0.7]]} color={stateColorHex} lineWidth={2} transparent opacity={0.6} />
          <Line points={[[0, -0.02, 0.1], [0.1, 0, 0.3], [0.12, 0, 0.7]]} color={stateColorHex} lineWidth={2} transparent opacity={0.6} />
          
          {/* Complex Internal Network */}
          <BranchingNerves color={stateColorHex} progress={progress} />
          <CellularNetwork progress={progress} color={stateColorHex} />
        </group>
      )}

      {/* Vascular / Organs */}
      {showVascular && (
        <group position={[0, -0.12, 0]}>
          <BeatingHeart progress={progress} />
          {/* Aorta / Main vessels */}
          <Line points={[[-0.05, 0.05, -0.4], [0, 0, -0.3], [0, 0, 0.1]]} color="#ef4444" lineWidth={4} transparent opacity={0.7} />
          <Line points={[[0, 0, 0.1], [-0.08, 0, 0.3], [-0.1, 0, 0.7]]} color="#ef4444" lineWidth={2} transparent opacity={0.5} />
          <Line points={[[0, 0, 0.1], [0.08, 0, 0.3], [0.1, 0, 0.7]]} color="#ef4444" lineWidth={2} transparent opacity={0.5} />
        </group>
      )}
    </group>
  );
}

function MiniGraph({ color, progress, type, customData, timeline }: { color: string, progress: number, type: 'hrv' | 'stress', customData?: any[] | null, timeline: number }) {
  const points = useMemo(() => {
    let pts = "";
    if (customData && customData.length > 0) {
      const maxVal = 100;
      const visibleData = customData.filter((d: any) => d.time <= timeline);
      const dataToDraw = visibleData.slice(-50);
      
      if (dataToDraw.length === 0) return "";
      
      for (let i = 0; i < 50; i++) {
        const x = i * 2;
        const dataIndex = Math.floor((i / 50) * dataToDraw.length);
        const d = dataToDraw[dataIndex] || dataToDraw[dataToDraw.length - 1];
        const val = d ? d[type] : 0;
        const y = 30 - (val / maxVal) * 30;
        pts += `${x},${y} `;
      }
    } else {
      for (let i = 0; i < 50; i++) {
        const x = i * 2;
        let y = 15;
        if (type === 'hrv') {
          const freq = 0.8 - progress * 0.5;
          y += Math.sin(i * freq) * 10 * (0.3 + progress * 0.7);
        } else {
          const noise = (Math.random() - 0.5) * 20 * (1 - progress);
          y += noise;
        }
        pts += `${x},${y} `;
      }
    }
    return pts;
  }, [progress, type, customData, timeline]);

  return (
    <svg width="100%" height="30" className="mt-2 opacity-80 overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
    </svg>
  );
}

function HolographicData({ progress, target, customData, timeline }: { progress: number, target: any, customData?: any[] | null, timeline: number }) {
  // Only show holograms in global view
  if (target) return null;

  let hrv = Math.round(42 + (progress * 43));
  let stress = Math.round(85 - (progress * 70));

  if (customData && customData.length > 0) {
    const closest = customData.reduce((prev: any, curr: any) => 
      Math.abs(curr.time - timeline) < Math.abs(prev.time - timeline) ? curr : prev
    );
    hrv = closest.hrv;
    stress = closest.stress;
  }

  return (
    <group>
      <Html position={[0.7, 1.0, -0.5]} center className="pointer-events-none">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/40 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] w-40 transition-all">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">HRV (ms)</div>
          <div className="text-3xl font-semibold text-gray-900">{hrv}</div>
          <MiniGraph color="#3b82f6" progress={progress} type="hrv" customData={customData} timeline={timeline} />
        </div>
      </Html>
      <Html position={[-0.7, 0.7, 0.2]} center className="pointer-events-none">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/40 p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] w-40 transition-all">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Stress (Cortisol)</div>
          <div className="text-3xl font-semibold text-gray-900">{stress}%</div>
          <MiniGraph color="#ef4444" progress={progress} type="stress" customData={customData} timeline={timeline} />
        </div>
      </Html>
    </group>
  );
}

function CameraController({ target, controlsRef }: { target: any, controlsRef: any }) {
  const { camera } = useThree();
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLookAt = useMemo(() => new THREE.Vector3(), []);
  
  useFrame(() => {
    if (target && controlsRef.current) {
      targetPos.fromArray(target.position);
      targetLookAt.fromArray(target.lookAt);
      camera.position.lerp(targetPos, 0.05);
      controlsRef.current.target.lerp(targetLookAt, 0.05);
    } else if (controlsRef.current) {
      // Default Global View
      targetPos.set(2.5, 2.0, 2.5);
      targetLookAt.set(0, 0, 0);
      camera.position.lerp(targetPos, 0.05);
      controlsRef.current.target.lerp(targetLookAt, 0.05);
    }
  });
  return null;
}

// --- Main Component ---

export function Studio3D() {
  const [timeline, setTimeline] = useState(0); // 0 to 40 minutes
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeLayer, setActiveLayer] = useState('all');
  const [zoomTarget, setZoomTarget] = useState<any>(null);
  const controlsRef = useRef<any>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const [customData, setCustomData] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) {
            setCustomData(json);
          } else {
            alert("Le fichier JSON doit contenir un tableau de données.");
          }
        } catch (err) {
          console.error("Invalid JSON file");
          alert("Erreur: Le fichier doit être un JSON valide.");
        }
      };
      reader.readAsText(file);
    }
  };

  const loadExampleData = () => {
    const example = [];
    for (let i = 0; i <= 40; i += 0.5) {
      example.push({
        time: i,
        hrv: Math.round(40 + (i / 40) * 45 + Math.random() * 10),
        stress: Math.max(0, Math.round(85 - (i / 40) * 75 + Math.random() * 10))
      });
    }
    setCustomData(example);
  };

  const progress = timeline / 40; // 0.0 to 1.0

  // Audio Logic
  useEffect(() => {
    if (!isMuted && isPlaying) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContext();
        oscRef.current = audioCtxRef.current.createOscillator();
        gainRef.current = audioCtxRef.current.createGain();
        
        oscRef.current.connect(gainRef.current);
        gainRef.current.connect(audioCtxRef.current.destination);
        
        oscRef.current.type = 'sine';
        oscRef.current.start();
      }
      
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      // Binaural/Drone effect: frequency drops as progress increases (relaxing)
      const freq = 136.1 - (progress * 30); // 136.1Hz (Ohm) down to ~106Hz
      const vol = 0.05 + (progress * 0.05); // Very soft volume
      
      oscRef.current!.frequency.setTargetAtTime(freq, audioCtxRef.current.currentTime, 0.5);
      gainRef.current!.gain.setTargetAtTime(vol, audioCtxRef.current.currentTime, 0.5);
      
    } else {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.5);
      }
    }
  }, [isPlaying, isMuted, progress]);

  // Playback logic
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeline((prev) => {
          if (prev >= 40) {
            setIsPlaying(false);
            return 40;
          }
          return prev + 0.5; // Increment by 30 seconds
        });
      }, 100); // Speed of playback
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const getPhaseData = (time: number) => {
    if (time < 10) return { title: "Pénétration Biophysique", desc: "Les ondes (40-80Hz) traversent les tissus profonds, initiant un micro-massage cellulaire." };
    if (time < 20) return { title: "Réveil des Mécanorécepteurs", desc: "Conversion de l'énergie mécanique en signaux électriques via les corpuscules de Pacini." };
    if (time < 30) return { title: "Shift Autonomique", desc: "Le Nerf Vague s'active. Le système parasympathique prend le relais sur le stress." };
    return { title: "Cohérence Globale", desc: "Synchronisation cardiaque parfaite et émission d'ondes cérébrales Thêta (récupération profonde)." };
  };

  const phase = getPhaseData(timeline);

  const zoomPresets = {
    global: null,
    brain: { position: [0.5, 0.7, -1.2], lookAt: [0, 0.3, -0.8] },
    heart: { position: [0.4, 0.5, -0.2], lookAt: [-0.08, 0.3, -0.2] },
    cell: { position: [0.2, 0.4, 0.3], lookAt: [0, 0.25, 0.3] },
  };

  const targetChest: [number, number, number] = [0, 0.25, -0.3];
  const speakers: [number, number, number][] = [
    [-1.5, 1.5, -1.5], // Front Left
    [1.5, 1.5, -1.5],  // Front Right
    [0, 1.5, 1.5]      // Rear Center
  ];
  const bedSpeaker: [number, number, number] = [0, -0.1, -0.2]; // Inside the bed

  return (
    <section className="py-24 bg-[#E5E5EA] relative overflow-hidden" id="studio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-semibold text-[#1D1D1F] tracking-tight mb-4">
            Voyage au Cœur de la Récupération
          </h2>
          <p className="text-xl text-[#86868B]">
            Explorez les mécanismes physiologiques d'une session AudioVitality de 40 minutes.
          </p>
        </div>
      </div>

      <div className="relative w-full h-[700px] bg-white/50 rounded-3xl overflow-hidden shadow-2xl border border-black/5 max-w-7xl mx-auto">
        
        {/* 3D Canvas */}
        <Canvas shadows camera={{ position: [2.5, 2.0, 2.5], fov: 45 }}>
          <Suspense fallback={
            <Html center>
              <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-black/10 text-blue-500 font-semibold flex items-center gap-3 whitespace-nowrap">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Chargement du modèle 3D...
              </div>
            </Html>
          }>
            <color attach="background" args={['#F5F5F7']} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <pointLight position={[-2, 2, -2]} intensity={0.5} />
            <Environment preset="city" />
            
            <CameraController target={zoomTarget} controlsRef={controlsRef} />
            <OrbitControls ref={controlsRef} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.1} minDistance={0.5} maxDistance={5} />
            
            <Bed />
            <DetailedMannequin layer={activeLayer} progress={progress} />
            <SoundWaves progress={progress} />
            <HolographicData progress={progress} target={zoomTarget} customData={customData} timeline={timeline} />

            {/* Overhead Speakers and their sound pulses */}
            {speakers.map((pos, i) => (
              <group key={`speaker-${i}`}>
                <Speaker position={pos} target={targetChest} />
                <SoundPulse start={pos} target={targetChest} delay={i * 0.6} />
              </group>
            ))}

            {/* Bed Speaker Pulse (coming from below) */}
            <SoundPulse start={bedSpeaker} target={targetChest} delay={0.3} />
          </Suspense>
        </Canvas>

        {/* --- 2D UI OVERLAYS --- */}

        {/* Left Panel: Phase Info */}
        <div className="absolute top-8 left-8 w-80 bg-white/40 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 pointer-events-auto transition-all duration-500">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Analyse en Direct</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{phase.title}</h3>
          <p className="text-sm text-gray-800 leading-relaxed">{phase.desc}</p>
        </div>

        {/* Right Panel: Controls */}
        <div className="absolute top-8 right-8 flex flex-col gap-4 pointer-events-auto">
          {/* Audio Toggle */}
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="bg-white/40 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 flex items-center justify-center hover:bg-white/60 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-gray-700" /> : <Volume2 className="w-5 h-5 text-blue-600" />}
          </button>

          {/* Layers */}
          <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 px-2">Couches Anatomiques</div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'all', label: 'Corps Entier', icon: Layers },
                { id: 'nervous', label: 'Système Nerveux', icon: Brain },
                { id: 'vascular', label: 'Système Vasculaire', icon: Heart },
                { id: 'skin', label: 'Tissus & Fascias', icon: Activity },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActiveLayer(l.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeLayer === l.id 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Targets */}
          <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 px-2">Focus Micro-Cellulaire</div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setZoomTarget(zoomPresets.global)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${!zoomTarget ? 'bg-gray-100/80 text-black shadow-sm' : 'text-gray-800 hover:bg-white/50'}`}>
                <ZoomIn className="w-4 h-4" /> Vue Globale
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.brain)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${zoomTarget === zoomPresets.brain ? 'bg-gray-100/80 text-black shadow-sm' : 'text-gray-800 hover:bg-white/50'}`}>
                <Brain className="w-4 h-4" /> Tronc Cérébral
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.heart)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${zoomTarget === zoomPresets.heart ? 'bg-gray-100/80 text-black shadow-sm' : 'text-gray-800 hover:bg-white/50'}`}>
                <Heart className="w-4 h-4" /> Cohérence Cardiaque
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.cell)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${zoomTarget === zoomPresets.cell ? 'bg-gray-100/80 text-black shadow-sm' : 'text-gray-800 hover:bg-white/50'}`}>
                <Activity className="w-4 h-4" /> Récepteurs Fasciaux
              </button>
            </div>
          </div>

          {/* Data Injection */}
          <div className="bg-white/40 backdrop-blur-2xl p-4 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 px-2">Données Personnelles</div>
            <div className="flex flex-col gap-2">
              <input 
                type="file" 
                accept=".json" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-gray-800 hover:bg-white/50"
              >
                <Upload className="w-4 h-4" /> Importer JSON
              </button>
              <button 
                onClick={loadExampleData}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-gray-800 hover:bg-white/50"
              >
                <Activity className="w-4 h-4" /> Data Démo
              </button>
              {customData && (
                <button 
                  onClick={() => setCustomData(null)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 text-red-600 hover:bg-red-50"
                >
                  <X className="w-4 h-4" /> Effacer Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Panel: Timeline */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white/40 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/40 pointer-events-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Timeline de la Session</div>
            <div className="text-sm font-bold text-blue-600">{Math.floor(timeline)}:{(timeline % 1 * 60).toString().padStart(2, '0')} / 40:00</div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center bg-gray-900 text-white rounded-full hover:scale-105 transition-transform shrink-0 shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            
            <input 
              type="range" 
              min="0" 
              max="40" 
              step="0.5"
              value={timeline}
              onChange={(e) => {
                setTimeline(parseFloat(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
