import { Suspense, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { playDeepWoosh, playCloseSound } from '../utils/sound';
import { X, Info, Maximize2, Waves, Zap, Brain, Droplet, HeartPulse } from 'lucide-react';

const HOTSPOTS = [
  { 
    id: 'step1', 
    position: [0, 1.2, 0.2] as [number, number, number], 
    title: '1. Biophysical Penetration', 
    description: 'The human body is 70% water, an excellent conductor for sound. Unlike mechanical massages that stop at the skin, AudioVitality’s calibrated 40-80 Hz waves penetrate deep muscle tissues, fascia, and interstitial fluids, creating a true cellular-level "micro-massage".',
    Icon: Waves
  },
  { 
    id: 'step2', 
    position: [0, 1.0, 0.5] as [number, number, number], 
    title: '2. Mechanoreceptor Awakening', 
    description: 'Specific pressure sensors under the skin and in connective tissues (Pacinian and Meissner corpuscles) are biologically programmed to react to our exact frequencies. They activate and send massive electrical signals through the spinal cord to the brain.',
    Icon: Zap
  },
  { 
    id: 'step3', 
    position: [0, 1.1, -0.6] as [number, number, number], 
    title: '3. Nervous System Shift', 
    description: 'Signals from mechanoreceptors reach the brainstem and stimulate the vagus nerve. This forces an immediate "sympathovagal shift": turning off the Sympathetic mode (stress, inflammation) and turning on the Parasympathetic mode (rest, digestion, tissue repair).',
    Icon: Brain
  },
  { 
    id: 'step4', 
    position: [-0.4, 1.0, -0.2] as [number, number, number], 
    title: '4. Vascular & Metabolic Flush', 
    description: 'Sound vibrations create a gentle "shear stress" on blood vessel walls, triggering the release of Nitric Oxide (NO) for vasodilation. Blood flow and lymphatic drainage accelerate, flushing out toxins (like lactic acid) and reducing local inflammation (DOMS).',
    Icon: Droplet
  },
  { 
    id: 'result', 
    position: [0.15, 1.2, -0.3] as [number, number, number], 
    title: 'Measurable Result: +43% HRV', 
    description: 'At the end of the 40-minute session, this physiological cascade results in a state of profound relaxation and a spectacular increase in Heart Rate Variability (HRV)—measured up to +43% in our clinical trials with CHUV. The body has recovered its deficit.',
    Icon: HeartPulse
  }
];

function SoundPulse({ start, target, delay = 0 }: { start: [number, number, number], target: [number, number, number], delay?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const startVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const targetVec = useMemo(() => new THREE.Vector3(...target), [target]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = ((clock.elapsedTime + delay) % 2) / 2; // 0 to 1 over 2 seconds
    ref.current.position.lerpVectors(startVec, targetVec, t);
    ref.current.scale.setScalar(1 + t * 4);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.4;
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
        <meshStandardMaterial color="#E5E5EA" roughness={0.2} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0, 0.16]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color="#1D1D1F" />
      </mesh>
      {/* Glowing ring around speaker */}
      <mesh position={[0, 0, 0.15]}>
        <ringGeometry args={[0.11, 0.12, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function Bed() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Base (Dark Grey/Brown) */}
      <RoundedBox args={[1.2, 0.5, 2.4]} radius={0.05} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#1f1b18" roughness={0.8} />
      </RoundedBox>
      {/* Mattress (Slightly lighter dark grey/brown) */}
      <RoundedBox args={[1.1, 0.2, 2.3]} radius={0.1} position={[0, 0.65, 0]}>
        <meshStandardMaterial color="#2c2724" roughness={0.9} />
      </RoundedBox>
      {/* Pillow */}
      <RoundedBox args={[0.6, 0.15, 0.3]} radius={0.05} position={[0, 0.8, -0.8]}>
        <meshStandardMaterial color="#2c2724" roughness={0.9} />
      </RoundedBox>
      
      {/* LED Strip all around the bottom edge */}
      <RoundedBox args={[1.22, 0.04, 2.42]} radius={0.02} position={[0, 0.05, 0]}>
        <meshBasicMaterial color="#3b82f6" />
      </RoundedBox>
      {/* Extra ambient glow for the LED on the floor */}
      <RoundedBox args={[1.5, 0.01, 2.7]} radius={0.2} position={[0, 0.01, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.25} depthWrite={false} />
      </RoundedBox>

      {/* LED Glow lights under bed */}
      <pointLight position={[0, 0.1, 0]} color="#3b82f6" intensity={2.5} distance={4} />
      <pointLight position={[0, 0.1, 1]} color="#3b82f6" intensity={2} distance={3} />
      <pointLight position={[0, 0.1, -1]} color="#3b82f6" intensity={2} distance={3} />
    </group>
  );
}

function Skeleton({ yOffset }: { yOffset: number }) {
  // Premium frosted glass material for the skeleton (clean, clinical, high-tech)
  const boneMaterial = new THREE.MeshPhysicalMaterial({
    color: "#e0f2fe",
    roughness: 0.15,
    metalness: 0.1,
    transmission: 0.95,
    transparent: true,
    opacity: 1,
    ior: 1.5,
    thickness: 0.5,
    clearcoat: 1,
    clearcoatRoughness: 0.1
  });

  return (
    <group position={[0, yOffset, 0]}>
      {/* Skull */}
      <mesh position={[0, 0.05, -0.75]} material={boneMaterial}>
        <sphereGeometry args={[0.09, 32, 32]} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 0.0, -0.68]} material={boneMaterial}>
        <boxGeometry args={[0.07, 0.05, 0.08]} />
      </mesh>

      {/* Spine (Vertebrae) */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={`spine-${i}`} position={[0, -0.02, -0.6 + i * 0.05]} material={boneMaterial}>
          <boxGeometry args={[0.03, 0.03, 0.04]} />
        </mesh>
      ))}

      {/* Ribcage (Curved ribs) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={`rib-${i}`} position={[0, 0.02, -0.5 + i * 0.035]} rotation={[Math.PI/2, 0, 0]} material={boneMaterial}>
          <torusGeometry args={[0.1 - Math.abs(i - 4)*0.01, 0.012, 8, 24, Math.PI]} />
        </mesh>
      ))}

      {/* Pelvis */}
      <mesh position={[0, 0, 0.15]} material={boneMaterial}>
        <boxGeometry args={[0.18, 0.06, 0.12]} />
      </mesh>

      {/* Femurs */}
      <mesh position={[-0.07, 0, 0.35]} rotation={[Math.PI/2, 0, 0]} material={boneMaterial}>
        <cylinderGeometry args={[0.018, 0.012, 0.3]} />
      </mesh>
      <mesh position={[0.07, 0, 0.35]} rotation={[Math.PI/2, 0, 0]} material={boneMaterial}>
        <cylinderGeometry args={[0.018, 0.012, 0.3]} />
      </mesh>

      {/* Tibias */}
      <mesh position={[-0.07, 0, 0.7]} rotation={[Math.PI/2, 0, 0]} material={boneMaterial}>
        <cylinderGeometry args={[0.012, 0.008, 0.35]} />
      </mesh>
      <mesh position={[0.07, 0, 0.7]} rotation={[Math.PI/2, 0, 0]} material={boneMaterial}>
        <cylinderGeometry args={[0.012, 0.008, 0.35]} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.18, 0, -0.4]} rotation={[Math.PI/2, 0, 0.2]} material={boneMaterial}>
        <cylinderGeometry args={[0.012, 0.01, 0.25]} />
      </mesh>
      <mesh position={[0.18, 0, -0.4]} rotation={[Math.PI/2, 0, -0.2]} material={boneMaterial}>
        <cylinderGeometry args={[0.012, 0.01, 0.25]} />
      </mesh>
      <mesh position={[-0.22, 0, -0.1]} rotation={[Math.PI/2, 0, 0.1]} material={boneMaterial}>
        <cylinderGeometry args={[0.01, 0.008, 0.25]} />
      </mesh>
      <mesh position={[0.22, 0, -0.1]} rotation={[Math.PI/2, 0, -0.1]} material={boneMaterial}>
        <cylinderGeometry args={[0.01, 0.008, 0.25]} />
      </mesh>
    </group>
  );
}

function PhysiologicalSystems({ yOffset }: { yOffset: number }) {
  const spineRef = useRef<THREE.Mesh>(null);
  const heartRef = useRef<THREE.Mesh>(null);
  const vagusRef = useRef<THREE.Mesh>(null);
  const flushRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    
    // Spine signal (fast pulsing upwards representing mechanoreceptor electrical signals)
    if (spineRef.current) {
      const mat = spineRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.4 + Math.sin(t * 10) * 0.6;
    }

    // Heartbeat (slower, rhythmic for HRV)
    if (heartRef.current) {
      const scale = 1 + Math.pow(Math.sin(t * 3), 4) * 0.3;
      heartRef.current.scale.setScalar(scale);
    }

    // Vagus Nerve (steady glow from brainstem to heart)
    if (vagusRef.current) {
      const mat = vagusRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 + Math.cos(t * 2) * 0.5;
    }

    // Vascular flush (expanding and contracting aura for Nitric Oxide release)
    if (flushRef.current) {
      const scale = 1 + Math.sin(t * 1.5) * 0.1;
      flushRef.current.scale.setScalar(scale);
      const mat = flushRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Spine / Spinal Cord (Inside the vertebrae) */}
      <mesh ref={spineRef} position={[0, yOffset - 0.02, -0.2]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.8, 8]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Brainstem / Vagus Connection */}
      <mesh ref={vagusRef} position={[0, yOffset + 0.02, -0.55]} rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.015, 0.3, 8]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Heart (Inside the ribcage) */}
      <mesh ref={heartRef} position={[0.03, yOffset + 0.02, -0.35]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Vascular Flush Aura (Torso) */}
      <mesh ref={flushRef} position={[0, yOffset, -0.3]} rotation={[Math.PI/2, 0, 0]}>
        <capsuleGeometry args={[0.15, 0.4, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Scene({ setActiveHotspot }: { setActiveHotspot: (id: string | null) => void }) {
  const target: [number, number, number] = [0, 0.38, -0.2]; // Chest area
  
  const speakers: [number, number, number][] = [
    [-1.5, 2, -1.5], // Front Left
    [1.5, 2, -1.5],  // Front Right
    [0, 2, 1.5]      // Rear Center
  ];
  
  const bedSpeaker: [number, number, number] = [0, 0.1, -0.2]; // Inside the bed

  return (
    <>
      <color attach="background" args={['#E5E5EA']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 1, -0.5]} intensity={1.5} color="#3b82f6" distance={3} /> {/* Spotlight on chest */}
      <Environment preset="studio" />

      <Bed />
      <Skeleton yOffset={0.38} />
      <PhysiologicalSystems yOffset={0.38} />

      {/* Overhead Speakers and their sound pulses */}
      {speakers.map((pos, i) => (
        <group key={`speaker-${i}`}>
          <Speaker position={pos} target={target} />
          <SoundPulse start={pos} target={target} delay={i * 0.6} />
        </group>
      ))}

      {/* Bed Speaker Pulse (coming from below) */}
      <SoundPulse start={bedSpeaker} target={target} delay={0.3} />

      {HOTSPOTS.map((hotspot) => {
        const Icon = hotspot.Icon;
        return (
          <Html key={hotspot.id} position={hotspot.position} center>
            <button 
              onClick={() => {
                playDeepWoosh();
                setActiveHotspot(hotspot.id);
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer group border border-black/10"
            >
              <Icon className="w-5 h-5 text-[#1D1D1F] group-hover:text-blue-600 transition-colors" />
              <div className="absolute inset-0 rounded-full border border-blue-500 animate-ping opacity-50" />
            </button>
          </Html>
        );
      })}

      <ContactShadows position={[0, -0.49, 0]} opacity={0.4} scale={5} blur={2} far={4} color="#000000" />
    </>
  );
}

export function Studio3D() {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const activeData = HOTSPOTS.find(h => h.id === activeHotspot);

  return (
    <section id="studio" className="py-32 bg-[#F5F5F7] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-[#1D1D1F] tracking-tight mb-4">The Physiological Cascade</h2>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto">Zoom in to explore the internal biological response during a 40-minute session.</p>
        </motion.div>

        <div className="relative w-full h-[600px] md:h-[700px] bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-black/5">
          <Canvas camera={{ position: [2, 1.5, 3], fov: 45 }}>
            <Suspense fallback={null}>
              <Scene setActiveHotspot={setActiveHotspot} />
              <OrbitControls 
                enablePan={false} 
                minDistance={0.5} 
                maxDistance={8}
                maxPolarAngle={Math.PI / 2 + 0.1}
                autoRotate
                autoRotateSpeed={0.3}
              />
            </Suspense>
          </Canvas>

          {/* Overlay UI for Hotspots */}
          <AnimatePresence>
            {activeData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-8 left-8 right-8 md:left-auto md:right-8 md:w-[400px] bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-black/5"
              >
                <button 
                  onClick={() => {
                    playCloseSound();
                    setActiveHotspot(null);
                  }}
                  className="absolute top-6 right-6 text-gray-400 hover:text-[#1D1D1F] transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="w-12 h-12 bg-[#F5F5F7] rounded-2xl flex items-center justify-center mb-6 border border-black/5">
                  <Info className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-[#1D1D1F] mb-3 tracking-tight">{activeData.title}</h3>
                <p className="text-[#424245] leading-relaxed">{activeData.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hint Overlay */}
          <div className="absolute top-6 left-6 flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-black/5 pointer-events-none">
            <Maximize2 size={16} className="text-[#1D1D1F]" />
            <span className="text-sm font-medium text-[#1D1D1F]">Scroll to Zoom Inside</span>
          </div>
        </div>
      </div>
    </section>
  );
}
