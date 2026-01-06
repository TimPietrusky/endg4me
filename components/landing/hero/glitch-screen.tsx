"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture, Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { Logo } from "@/components/logo";
import { createSeededRandom } from "@/lib/seeded-random";
import { GlitchTransitionShader } from "./glitch-shader";
import {
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  SCREEN_DEPTH,
  GLITCH_MIN_DURATION,
  GLITCH_MAX_DURATION,
  GLITCH_INTERVAL_MIN,
  GLITCH_INTERVAL_MAX,
  FREEZE_PROGRESS_MIN,
  FREEZE_PROGRESS_MAX,
} from "./constants";

// Transition state type
interface TransitionState {
  progress: number;
  isTransitioning: boolean;
  isFrozen: boolean;
  frozenAt: number;
  freezeChecked: boolean; // Whether we've already rolled for freeze this glitch
  glitchStartTime: number; // When this glitch started
  glitchDuration: number; // How long this glitch should last (0.15-1.1s)
  time: number;
  fromIndex: number;
  toIndex: number;
}

interface GlitchScreenProps {
  isLoggedIn: boolean;
  seed: number;
}

/**
 * Screen component with glitch transition effect.
 * Handles the background textures, glitch shader, and UI overlay.
 */
export function GlitchScreen({ isLoggedIn, seed }: GlitchScreenProps) {
  const texture1 = useTexture("/background-1.jpg");
  const texture2 = useTexture("/background-2.jpg");
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  const transitionRef = useRef<TransitionState>({ 
    progress: 0, 
    isTransitioning: false, 
    isFrozen: false,
    frozenAt: 0,
    freezeChecked: false,
    glitchStartTime: 0,
    glitchDuration: 0,
    time: 0,
    fromIndex: 0,
    toIndex: 1 
  });
  
  const textures = useMemo(() => [texture1, texture2], [texture1, texture2]);
  
  // Seeded glitch transition scheduling
  useEffect(() => {
    // Separate PRNG streams for different purposes
    const scheduleRandom = createSeededRandom(seed + 1); // For timing between glitches
    const glitchRandom = createSeededRandom(seed + 2);   // For glitch duration
    const freezeRandom = createSeededRandom(seed + 3);   // For freeze decisions
    
    const triggerTransition = () => {
      const t = transitionRef.current;
      t.isTransitioning = true;
      t.isFrozen = false;
      t.freezeChecked = false; // Reset freeze check for new glitch
      t.progress = 0;
      t.glitchStartTime = t.time; // Record when this glitch started
      
      // Fresh random duration for this specific glitch (0.15s - 2.5s)
      const durationRoll = glitchRandom();
      t.glitchDuration = durationRoll * (GLITCH_MAX_DURATION - GLITCH_MIN_DURATION) + GLITCH_MIN_DURATION;
      
      // Freeze ALWAYS happens - calculate freeze point within allowed range
      const freezePointRoll = freezeRandom();
      t.frozenAt = FREEZE_PROGRESS_MIN + freezePointRoll * (FREEZE_PROGRESS_MAX - FREEZE_PROGRESS_MIN);
      
      // Swap from/to for next transition
      t.fromIndex = t.toIndex;
      t.toIndex = (t.toIndex + 1) % 2;
    };
    
    const scheduleTransition = () => {
      // Seeded interval between glitches
      const interval = scheduleRandom() * (GLITCH_INTERVAL_MAX - GLITCH_INTERVAL_MIN) + GLITCH_INTERVAL_MIN;
      return setTimeout(() => {
        triggerTransition();
        timeoutId = scheduleTransition();
      }, interval);
    };
    
    let timeoutId = scheduleTransition();
    return () => clearTimeout(timeoutId);
  }, [seed]);
  
  // Animate glitch transition with freeze logic
  // Total glitch time is hard-capped at glitchDuration (0.15-1.1s)
  useFrame((_, delta) => {
    const t = transitionRef.current;
    t.time += delta;
    
    if (shaderRef.current) {
      // Update time
      shaderRef.current.uniforms.time.value = t.time;
      
      // Update textures
      shaderRef.current.uniforms.tFrom.value = textures[t.fromIndex];
      shaderRef.current.uniforms.tTo.value = textures[t.toIndex];
      
      if (t.isTransitioning || t.isFrozen) {
        // Check if total glitch time has exceeded the duration limit
        const elapsedSinceGlitchStart = t.time - t.glitchStartTime;
        
        if (elapsedSinceGlitchStart >= t.glitchDuration) {
          // Time's up - immediately end glitch and show target
          t.isFrozen = false;
          t.isTransitioning = false;
          t.progress = 0;
          t.fromIndex = t.toIndex;
          
          shaderRef.current.uniforms.isFrozen.value = 0.0;
          shaderRef.current.uniforms.frozenMicroGlitch.value = 0.0;
          shaderRef.current.uniforms.progress.value = 0;
          return;
        }
        
        // Calculate progress based on elapsed time within the glitch duration
        const normalizedProgress = elapsedSinceGlitchStart / t.glitchDuration;
        
        if (t.isFrozen) {
          // Still frozen - show micro-glitch effects at frozen position
          const microGlitch = 0.3 + Math.sin(t.time * 8) * 0.2 + Math.sin(t.time * 13) * 0.1;
          shaderRef.current.uniforms.frozenMicroGlitch.value = microGlitch;
          shaderRef.current.uniforms.isFrozen.value = 1.0;
          shaderRef.current.uniforms.progress.value = t.frozenAt;
        } else {
          // Actively transitioning
          t.progress = normalizedProgress;
          
          // Check if we should freeze - pre-calculated at glitch start
          // frozenAt >= 0 means a freeze is scheduled at that progress point
          if (!t.freezeChecked && t.frozenAt >= 0 && t.progress >= t.frozenAt) {
            t.isFrozen = true;
            t.freezeChecked = true;
          }
          
          shaderRef.current.uniforms.isFrozen.value = 0.0;
          shaderRef.current.uniforms.frozenMicroGlitch.value = 0.0;
          shaderRef.current.uniforms.progress.value = t.progress;
        }
      } else {
        // Not transitioning - show static image
        shaderRef.current.uniforms.isFrozen.value = 0.0;
        shaderRef.current.uniforms.frozenMicroGlitch.value = 0.0;
        shaderRef.current.uniforms.progress.value = 0;
      }
    }
  });
  
  return (
    <group>
      {/* === BACKGROUND with glitch transition shader - INSIDE the glass case === */}
      {/* Sized smaller than glass case to prevent glitch overflow */}
      <mesh position={[0, 0, -SCREEN_DEPTH/2 + 0.02]}>
        <planeGeometry args={[SCREEN_WIDTH - 0.3, SCREEN_HEIGHT - 0.25]} />
        <shaderMaterial
          ref={shaderRef}
          uniforms={{
            tFrom: { value: texture1 },
            tTo: { value: texture2 },
            progress: { value: 0 },
            time: { value: 0 },
            isFrozen: { value: 0 },
            frozenMicroGlitch: { value: 0 },
          }}
          vertexShader={GlitchTransitionShader.vertexShader}
          fragmentShader={GlitchTransitionShader.fragmentShader}
        />
      </mesh>
      
      {/* Dark overlay for readability */}
      <mesh position={[0, 0, -SCREEN_DEPTH/2 + 0.03]}>
        <planeGeometry args={[SCREEN_WIDTH - 0.3, SCREEN_HEIGHT - 0.25]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.15}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* === INNER GLASS LAYER - in front of background, inside outer case === */}
      {/* Sized to frame the background image */}
      <RoundedBox args={[SCREEN_WIDTH - 0.25, SCREEN_HEIGHT - 0.2, SCREEN_DEPTH * 0.5]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
        <meshPhysicalMaterial 
          color="#ffffff"
          metalness={0.05}
          roughness={0.02}
          transmission={0.97}
          thickness={1.5}
          transparent
          opacity={0.12}
          envMapIntensity={1.2}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.5}
        />
      </RoundedBox>
      
      
      {/* UI Content - ON TOP of the glass case */}
      <Html
        transform
        position={[0, 0, SCREEN_DEPTH/2 + 0.15]}
        distanceFactor={1.8}
        zIndexRange={[100, 0]}
        style={{
          width: "800px",
          height: "500px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col items-center justify-center text-center w-full h-full relative">
          {/* Logo component - larger */}
          <Logo className="w-[650px] h-auto text-white" />
          
          {/* Tagline - white like logo */}
          <p className="text-white text-xl tracking-[0.3em] font-mono mt-8">
            RACE TO SINGULARITY
          </p>
          
          {/* Button - larger */}
          <div className="mt-10 px-16 py-5 border-2 border-white/80 bg-transparent">
            <span className="font-bold tracking-wider text-xl text-white">
              {isLoggedIn ? "CONTINUE" : "START"}
            </span>
          </div>
          
          {/* Seed display - bottom right inside the glass frame */}
          <div className="absolute bottom-4 right-4 select-none">
            <p className="text-white/60 text-base font-mono tracking-wider">
              {seed}
            </p>
          </div>
        </div>
      </Html>
      
    </group>
  );
}

