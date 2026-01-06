"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Html, RoundedBox } from "@react-three/drei";
import { FallbackHero } from "./fallback-hero";
import { Logo } from "@/components/logo";
import * as THREE from "three";

// Hook to track mouse position normalized to -1 to 1
function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  
  return mouse;
}

// Floating sci-fi screen dimensions
const SCREEN_WIDTH = 4.5;
const SCREEN_HEIGHT = 2.8;
const SCREEN_DEPTH = 0.25; // Thicker for visible depth

// Glitch TRANSITION shader - blends between two textures with glitch effect
const GlitchTransitionShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tFrom;
    uniform sampler2D tTo;
    uniform float progress;
    uniform float time;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 uv = vUv;
      float p = progress;
      
      // No transition - show current texture
      if (p <= 0.0) {
        gl_FragColor = texture2D(tFrom, uv);
        return;
      }
      if (p >= 1.0) {
        gl_FragColor = texture2D(tTo, uv);
        return;
      }
      
      // === GLITCH TRANSITION ===
      float glitchStrength = sin(p * 3.14159); // Peak at middle of transition
      
      // Horizontal slice displacement
      float sliceY = floor(uv.y * 15.0);
      float sliceRand = random(vec2(sliceY, time));
      float sliceOffset = 0.0;
      if (sliceRand > 0.7) {
        sliceOffset = (random(vec2(time, sliceY)) - 0.5) * 0.15 * glitchStrength;
      }
      
      // Block displacement  
      float blockY = floor(uv.y * 8.0);
      float blockX = floor(uv.x * 8.0);
      float blockRand = random(vec2(blockX + time, blockY));
      vec2 blockOffset = vec2(0.0);
      if (blockRand > 0.85) {
        blockOffset = vec2(
          (random(vec2(blockY, time * 2.0)) - 0.5) * 0.2,
          (random(vec2(blockX, time * 2.0)) - 0.5) * 0.1
        ) * glitchStrength;
      }
      
      // Wavy distortion
      float wave = sin(uv.y * 30.0 + time * 15.0) * 0.01 * glitchStrength;
      
      // Apply distortions
      vec2 uvDistorted = uv + vec2(sliceOffset + wave, 0.0) + blockOffset;
      uvDistorted = clamp(uvDistorted, 0.0, 1.0);
      
      // RGB split amount
      float rgbSplit = 0.025 * glitchStrength;
      
      // Sample both textures with RGB split
      vec4 fromR = texture2D(tFrom, uvDistorted + vec2(rgbSplit, 0.0));
      vec4 fromG = texture2D(tFrom, uvDistorted);
      vec4 fromB = texture2D(tFrom, uvDistorted - vec2(rgbSplit, 0.0));
      vec4 fromColor = vec4(fromR.r, fromG.g, fromB.b, 1.0);
      
      vec4 toR = texture2D(tTo, uvDistorted + vec2(rgbSplit, 0.0));
      vec4 toG = texture2D(tTo, uvDistorted);
      vec4 toB = texture2D(tTo, uvDistorted - vec2(rgbSplit, 0.0));
      vec4 toColor = vec4(toR.r, toG.g, toB.b, 1.0);
      
      // Glitchy blend between textures
      // Use noise-based threshold for which pixels show which texture
      float noiseVal = noise(uv * 10.0 + time * 5.0);
      float threshold = p + (noiseVal - 0.5) * 0.4 * glitchStrength;
      
      // Hard cuts between textures based on slice position
      float sliceMix = step(random(vec2(sliceY, floor(time * 3.0))), p);
      
      // Combine blend methods
      float finalMix = mix(p, sliceMix, glitchStrength * 0.7);
      finalMix = mix(finalMix, threshold, glitchStrength * 0.3);
      
      vec4 color = mix(fromColor, toColor, clamp(finalMix, 0.0, 1.0));
      
      // Scanlines
      float scanline = sin(uv.y * 400.0) * 0.03 * glitchStrength;
      color.rgb -= scanline;
      
      // Random noise
      float pixelNoise = (random(uv + time) - 0.5) * 0.1 * glitchStrength;
      color.rgb += pixelNoise;
      
      // Flash on transition peaks
      float flash = pow(glitchStrength, 3.0) * 0.15;
      color.rgb += flash;
      
      gl_FragColor = color;
    }
  `,
};

// Screen component with glitch transition effect
function GlitchScreen({ 
  isLoggedIn
}: { 
  isLoggedIn: boolean;
}) {
  const texture1 = useTexture("/background-1.jpg");
  const texture2 = useTexture("/background-2.jpg");
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const transitionRef = useRef({ 
    progress: 0, 
    isTransitioning: false, 
    time: 0,
    fromIndex: 0,
    toIndex: 1 
  });
  
  const textures = useMemo(() => [texture1, texture2], [texture1, texture2]);
  
  // Random glitch transition interval - 1-5 seconds
  useEffect(() => {
    const triggerTransition = () => {
      const t = transitionRef.current;
      t.isTransitioning = true;
      t.progress = 0;
      // Swap from/to for next transition
      t.fromIndex = t.toIndex;
      t.toIndex = (t.toIndex + 1) % 2;
    };
    
    const scheduleTransition = () => {
      const interval = Math.random() * 4000 + 3000; // 3-7 seconds
      return setTimeout(() => {
        triggerTransition();
        timeoutId = scheduleTransition();
      }, interval);
    };
    
    let timeoutId = scheduleTransition();
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Animate glitch transition
  useFrame((_, delta) => {
    const t = transitionRef.current;
    t.time += delta;
    
    if (shaderRef.current) {
      // Update time
      shaderRef.current.uniforms.time.value = t.time;
      
      // Update textures
      shaderRef.current.uniforms.tFrom.value = textures[t.fromIndex];
      shaderRef.current.uniforms.tTo.value = textures[t.toIndex];
      
      if (t.isTransitioning) {
        // Fast glitch transition - complete in ~0.4 seconds
        t.progress += delta * 2.5;
        
        if (t.progress >= 1) {
          t.progress = 1;
          t.isTransitioning = false;
          // Swap so "to" becomes "from" for next transition
          t.fromIndex = t.toIndex;
        }
      }
      
      shaderRef.current.uniforms.progress.value = t.isTransitioning ? t.progress : 0;
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
        <div className="flex flex-col items-center justify-center text-center w-full h-full">
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
        </div>
      </Html>
      
    </group>
  );
}

// Floating glass display with transparent rounded case
function CyberMonitor({ 
  isLoggedIn, 
  signInUrl,
  mouse,
}: { 
  isLoggedIn: boolean; 
  signInUrl: string;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  
  // Subtle floating animation + mouse tracking
  useFrame((state) => {
    if (groupRef.current) {
      // Target rotation based on mouse position - increased for more dramatic effect
      targetRotation.current.y = mouse.current.x * 0.3;
      targetRotation.current.x = -mouse.current.y * 0.15;
      
      // Smooth interpolation (lerp)
      groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.05;
      groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.05;
      
      // Subtle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {/* === LIGHTING for reflections === */}
      {/* Cyan light from upper left */}
      <pointLight 
        position={[-2, 1, 2]} 
        intensity={4} 
        color="#00ffff" 
        distance={6}
      />
      {/* Magenta light from lower right */}
      <pointLight 
        position={[2, -1, 2]} 
        intensity={4} 
        color="#ff00ff" 
        distance={6}
      />
      
      {/* === TRANSPARENT GLASS CASE - rounded edges === */}
      {/* Main outer frame - clear transparent glass */}
      <RoundedBox args={[SCREEN_WIDTH + 0.15, SCREEN_HEIGHT + 0.15, SCREEN_DEPTH]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial 
          color="#ffffff"
          metalness={0.1}
          roughness={0.05}
          transmission={0.95}
          thickness={0.8}
          transparent
          opacity={0.15}
          envMapIntensity={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          ior={1.5}
        />
      </RoundedBox>
      
      {/* Inner bezel - slightly visible glass frame */}
      <RoundedBox args={[SCREEN_WIDTH + 0.05, SCREEN_HEIGHT + 0.05, SCREEN_DEPTH + 0.02]} radius={0.05} smoothness={4} position={[0, 0, 0.01]}>
        <meshPhysicalMaterial 
          color="#aaccff"
          metalness={0.1}
          roughness={0.1}
          transmission={0.9}
          thickness={0.5}
          transparent
          opacity={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          ior={1.4}
        />
      </RoundedBox>
      
      {/* Technical measurement marks on the glass */}
      {/* Top left corner mark */}
      <mesh position={[-SCREEN_WIDTH/2 - 0.02, SCREEN_HEIGHT/2 + 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.15, 0.01]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-SCREEN_WIDTH/2 - 0.02, SCREEN_HEIGHT/2 + 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.01, 0.15]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>
      
      {/* Top right corner mark */}
      <mesh position={[SCREEN_WIDTH/2 + 0.02, SCREEN_HEIGHT/2 + 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.15, 0.01]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[SCREEN_WIDTH/2 + 0.02, SCREEN_HEIGHT/2 + 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.01, 0.15]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.4} />
      </mesh>
      
      {/* Bottom left corner mark */}
      <mesh position={[-SCREEN_WIDTH/2 - 0.02, -SCREEN_HEIGHT/2 - 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.15, 0.01]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[-SCREEN_WIDTH/2 - 0.02, -SCREEN_HEIGHT/2 - 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.01, 0.15]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </mesh>
      
      {/* Bottom right corner mark */}
      <mesh position={[SCREEN_WIDTH/2 + 0.02, -SCREEN_HEIGHT/2 - 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.15, 0.01]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </mesh>
      <mesh position={[SCREEN_WIDTH/2 + 0.02, -SCREEN_HEIGHT/2 - 0.02, SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[0.01, 0.15]} />
        <meshBasicMaterial color="#ff00ff" transparent opacity={0.4} />
      </mesh>
      
      {/* === THE SCREEN CONTENT === */}
      <GlitchScreen isLoggedIn={isLoggedIn} />
    </group>
  );
}

// Atmospheric particles with slow movement
function Particles() {
  const count = 50;
  const pointsRef = useRef<THREE.Points>(null);
  
  // Create initial positions and store velocities
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
      
      // Random slow velocities
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    
    return { positions: pos, velocities: vel };
  }, []);
  
  // Animate particles
  useFrame(() => {
    if (pointsRef.current) {
      const posArray = pointsRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < count; i++) {
        // Update positions
        posArray[i * 3] += velocities[i * 3];
        posArray[i * 3 + 1] += velocities[i * 3 + 1];
        posArray[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Wrap around bounds
        if (posArray[i * 3] > 4) posArray[i * 3] = -4;
        if (posArray[i * 3] < -4) posArray[i * 3] = 4;
        if (posArray[i * 3 + 1] > 3) posArray[i * 3 + 1] = -3;
        if (posArray[i * 3 + 1] < -3) posArray[i * 3 + 1] = 3;
        if (posArray[i * 3 + 2] > 2) posArray[i * 3 + 2] = -3;
        if (posArray[i * 3 + 2] < -3) posArray[i * 3 + 2] = 2;
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

interface TerminalHeroProps {
  isLoggedIn: boolean;
  signInUrl: string;
  hasError?: boolean;
  errorMessage?: string;
}

// Scene content component that uses mouse tracking
function SceneContent({ 
  isLoggedIn, 
  signInUrl,
  mouse,
}: { 
  isLoggedIn: boolean; 
  signInUrl: string;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
  return (
    <>
      <color attach="background" args={["#05050a"]} />
      
      {/* Subtle ambient */}
      <ambientLight intensity={0.4} />
      
      {/* Main key light */}
      <directionalLight position={[3, 4, 5]} intensity={0.8} color="#ffffff" />
      
      {/* Fill light from opposite side */}
      <directionalLight position={[-2, 2, 3]} intensity={0.3} color="#8888ff" />
      
      {/* Rim light to show edges */}
      <pointLight position={[0, 3, -2]} intensity={0.5} color="#ffffff" distance={8} />
      
      {/* Screen glow */}
      <pointLight position={[0, 0, 2]} intensity={0.8} color="#ffffff" distance={4} />
      
      <Suspense fallback={null}>
        <CyberMonitor 
          isLoggedIn={isLoggedIn} 
          signInUrl={signInUrl}
          mouse={mouse}
        />
        <Particles />
      </Suspense>
    </>
  );
}

export function TerminalHero({
  isLoggedIn,
  signInUrl,
  hasError,
  errorMessage,
}: TerminalHeroProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const mouse = useMousePosition();

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (!webglSupported) {
    return (
      <FallbackHero
        isLoggedIn={isLoggedIn}
        signInUrl={signInUrl}
        hasError={hasError}
        errorMessage={errorMessage}
      />
    );
  }

  const handleClick = () => {
    if (isLoggedIn) {
      window.location.href = "/operate";
    } else {
      window.location.href = signInUrl;
    }
  };

  return (
    <div className="w-full h-screen relative bg-[#05050a]">
      {/* CLICKABLE OVERLAY - covers entire screen, must be above Html content from drei */}
      <div 
        className="absolute inset-0 z-[1000] cursor-pointer"
        onClick={handleClick}
        onWheel={(e) => {
          // Pass scroll through to page
          window.scrollBy(0, e.deltaY);
        }}
      />

      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
        }}
      >
        <SceneContent 
          isLoggedIn={isLoggedIn} 
          signInUrl={signInUrl}
          mouse={mouse}
        />
      </Canvas>

      {/* Error overlay */}
      {hasError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-32 z-20">
          <div className="px-6 py-4 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="font-semibold text-red-200">Sign in failed</p>
            <p className="text-red-300/80 text-xs mt-1">
              {errorMessage || "Please try again."}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
