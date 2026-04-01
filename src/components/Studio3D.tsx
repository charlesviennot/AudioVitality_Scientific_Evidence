import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, RoundedBox, Sphere, Cylinder, Capsule, Line, Html, useGLTF, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Activity, Brain, Heart, Layers, Play, Pause, ZoomIn, Info } from 'lucide-react';

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
      {/* Pillow */}
      <RoundedBox args={[0.6, 0.15, 0.3]} radius={0.05} position={[0, 0.6, -0.8]}>
        <meshStandardMaterial color="#2c2724" roughness={0.9} />
      </RoundedBox>
    </group>
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
  const ref = useRef<THREE.Mesh>(null);
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime + delay) % 2) / 2; // 0 to 1 over 2 seconds
    ref.current.position.lerpVectors(startVec, targetVec, t);
    ref.current.scale.setScalar(1 + t * 4);
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.4;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
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
      {/* Glowing ring around speaker */}
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
      const speed = 1 + progress; // Waves get smoother/slower
      const t = (clock.elapsedTime * speed + i * 0.33) % 1;
      wave.scale.setScalar(1 + t * 2);
      const mat = wave.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.4;
    });
  });

  return (
    <group position={[0, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={el => { waves.current[i] = el; }} rotation={[-Math.PI/2, 0, 0]}>
          <ringGeometry args={[0.3, 0.35, 64]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Model() {
  const { scene } = useGLTF('/ecorche_-_anatomy_study.glb');
  
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

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
    <group position={[0, 0.25, 0]}>
      {/* Skin Layer (Real 3D Model) */}
      {showSkin && (
        <Model />
      )}

      {/* Nervous System */}
      {showNervous && (
        <group>
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
        </group>
      )}

      {/* Vascular / Organs */}
      {showVascular && (
        <group>
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

function HolographicData({ progress, target }: { progress: number, target: any }) {
  // Only show holograms in global view
  if (target) return null;

  const hrv = Math.round(42 + (progress * 43));
  const stress = Math.round(85 - (progress * 70));

  return (
    <group>
      <Html position={[0.6, 1.0, -0.5]} center className="pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-black/10 p-3 rounded-xl shadow-xl w-32">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">HRV (ms)</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{hrv}</div>
          <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(hrv/100)*100}%` }} />
          </div>
        </div>
      </Html>
      <Html position={[-0.6, 0.7, 0.2]} center className="pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-black/10 p-3 rounded-xl shadow-xl w-32">
          <div className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider mb-1">Stress (Cortisol)</div>
          <div className="text-2xl font-semibold text-[#1D1D1F]">{stress}%</div>
          <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${stress}%` }} />
          </div>
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
  const [activeLayer, setActiveLayer] = useState('all');
  const [zoomTarget, setZoomTarget] = useState<any>(null);
  const controlsRef = useRef<any>(null);

  const progress = timeline / 40; // 0.0 to 1.0

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
            <HolographicData progress={progress} target={zoomTarget} />

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
        <div className="absolute top-8 left-8 w-80 bg-white/90 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-black/5 pointer-events-auto">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#86868B]">Analyse en Direct</span>
          </div>
          <h3 className="text-xl font-semibold text-[#1D1D1F] mb-2">{phase.title}</h3>
          <p className="text-sm text-[#424245] leading-relaxed">{phase.desc}</p>
        </div>

        {/* Right Panel: Controls */}
        <div className="absolute top-8 right-8 flex flex-col gap-4 pointer-events-auto">
          {/* Layers */}
          <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-black/5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-3">Couches Anatomiques</div>
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
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeLayer === l.id ? 'bg-blue-500 text-white' : 'bg-white text-[#1D1D1F] hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <l.icon className="w-4 h-4" />
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Zoom Targets */}
          <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-lg border border-black/5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#86868B] mb-3">Focus Micro-Cellulaire</div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setZoomTarget(zoomPresets.global)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!zoomTarget ? 'bg-gray-100 text-black font-semibold' : 'text-[#424245] hover:bg-gray-50'}`}>
                <ZoomIn className="w-4 h-4" /> Vue Globale
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.brain)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${zoomTarget === zoomPresets.brain ? 'bg-gray-100 text-black font-semibold' : 'text-[#424245] hover:bg-gray-50'}`}>
                <Brain className="w-4 h-4" /> Tronc Cérébral
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.heart)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${zoomTarget === zoomPresets.heart ? 'bg-gray-100 text-black font-semibold' : 'text-[#424245] hover:bg-gray-50'}`}>
                <Heart className="w-4 h-4" /> Cohérence Cardiaque
              </button>
              <button onClick={() => setZoomTarget(zoomPresets.cell)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${zoomTarget === zoomPresets.cell ? 'bg-gray-100 text-black font-semibold' : 'text-[#424245] hover:bg-gray-50'}`}>
                <Activity className="w-4 h-4" /> Récepteurs Fasciaux
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Timeline */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white/90 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-black/5 pointer-events-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1D1D1F]">Timeline de la Session</div>
            <div className="text-sm font-bold text-blue-500">{Math.floor(timeline)}:{(timeline % 1 * 60).toString().padStart(2, '0')} / 40:00</div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 flex items-center justify-center bg-[#1D1D1F] text-white rounded-full hover:scale-105 transition-transform shrink-0"
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
