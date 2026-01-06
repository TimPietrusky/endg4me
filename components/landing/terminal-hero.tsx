"use client";

import { Suspense, useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Html, RoundedBox } from "@react-three/drei";
import { FallbackHero } from "./fallback-hero";
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

// Screen component with smooth blend transition between background images
function GlitchScreen({ 
  isLoggedIn
}: { 
  isLoggedIn: boolean;
}) {
  const texture1 = useTexture("/background-1.jpg");
  const texture2 = useTexture("/background-2.jpg");
  const blendRef = useRef({ progress: 0, transitioning: false, current: 0 });
  const material1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const material2Ref = useRef<THREE.MeshBasicMaterial>(null);
  
  // Random transition interval - smooth blend between images
  useEffect(() => {
    const triggerTransition = () => {
      blendRef.current.transitioning = true;
      blendRef.current.progress = 0;
    };
    
    const scheduleTransition = () => {
      const interval = Math.random() * 5000 + 3000; // 3-8 seconds
      return setTimeout(() => {
        triggerTransition();
        timeoutId = scheduleTransition();
      }, interval);
    };
    
    let timeoutId = scheduleTransition();
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Smooth blend animation - texture2 fades in/out over texture1
  useFrame((_, delta) => {
    const blend = blendRef.current;
    
    if (blend.transitioning) {
      blend.progress += delta * 0.5; // Blend speed
      if (blend.progress >= 1) {
        blend.transitioning = false;
        // Swap textures by toggling which one is "on top"
        blend.current = (blend.current + 1) % 2;
        blend.progress = 0;
      }
    }
    
    // Simple crossfade - texture2 layer fades in/out
    if (material2Ref.current) {
      // When current=0, we're showing texture1 (so texture2 should be 0)
      // When transitioning from 0->1, texture2 fades in
      // When current=1, texture2 is fully visible
      // When transitioning from 1->0, texture2 fades out
      if (blend.current === 0) {
        material2Ref.current.opacity = blend.transitioning ? blend.progress : 0;
      } else {
        material2Ref.current.opacity = blend.transitioning ? 1 - blend.progress : 1;
      }
    }
  });
  
  return (
    <group>
      {/* === BACKGROUND IMAGES - INSIDE the glass case (at the back) === */}
      {/* Background image layer 1 */}
      <mesh position={[0, 0, -SCREEN_DEPTH/2 + 0.01]}>
        <planeGeometry args={[SCREEN_WIDTH - 0.1, SCREEN_HEIGHT - 0.1]} />
        <meshBasicMaterial 
          ref={material1Ref}
          map={texture1} 
          toneMapped={false}
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Background image layer 2 - for crossfade */}
      <mesh position={[0, 0, -SCREEN_DEPTH/2 + 0.015]}>
        <planeGeometry args={[SCREEN_WIDTH - 0.1, SCREEN_HEIGHT - 0.1]} />
        <meshBasicMaterial 
          ref={material2Ref}
          map={texture2} 
          toneMapped={false}
          transparent
          side={THREE.FrontSide}
        />
      </mesh>
      
      {/* Dark overlay for readability - still inside glass */}
      <mesh position={[0, 0, -SCREEN_DEPTH/2 + 0.02]}>
        <planeGeometry args={[SCREEN_WIDTH - 0.1, SCREEN_HEIGHT - 0.1]} />
        <meshBasicMaterial 
          color="#000000" 
          transparent 
          opacity={0.25}
          side={THREE.FrontSide}
        />
      </mesh>
      
      
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
          {/* Logo using SVG - MUCH larger */}
          <svg
            viewBox="0 0 1500 185"
            fill="white"
            className="w-[550px] h-auto"
            aria-label="endg4me"
          >
            {/* E */}
            <path d="m 189.6081,38.6339 a 0.63,0.63 0 0 1 -0.6289,0.6311 L 11.3395,39.575 A 0.63,0.63 0 0 1 10.7084,38.9461 L 10.6519,6.5861 A 0.63,0.63 0 0 1 11.2808,5.955 l 177.6397,-0.31 a 0.63,0.63 0 0 1 0.6311,0.6289 z" />
            <path d="m 176.02,76.87 v 31.51 a 0.42,0.41 0 0 1 -0.42,0.41 H 46.09 a 0.36,0.36 0 0 0 -0.36,0.36 v 36.91 a 0.74,0.74 0 0 0 0.74,0.74 h 144.55 a 0.37,0.37 0 0 1 0.37,0.37 v 32.18 a 0.29,0.29 0 0 1 -0.29,0.29 q -108.8,-0.01 -176.34,0.06 -1.36,0 -3.79,-0.36 a 0.59,0.58 3.9 0 1 -0.51,-0.58 V 77 a 0.83,0.83 0 0 1 0.83,-0.83 h 164.04 a 0.7,0.69 -90 0 1 0.69,0.7 z" />
            {/* N */}
            <path d="m 251.1,179.23 a 0.33,0.33 0 0 1 -0.33,0.33 h -35.49 a 0.51,0.51 0 0 1 -0.51,-0.51 V 6.48 A 0.68,0.68 0 0 1 215.44,5.8 Q 229.51,5.71 247,5.84 c 2.31,0.01 3.1,-0.21 4.9,1.66 q 37.48,38.9 64.69,66.41 10.68,10.78 21.61,22.13 10.73,11.13 63.51,64.5 1.96,1.97 3.24,3.76 a 2.24,2.19 -64.5 0 1 0.42,1.24 l 0.3,13.54 a 0.6,0.59 -0.5 0 1 -0.6,0.6 h -32.34 a 2.52,2.51 66.9 0 1 -1.74,-0.7 c -5.09,-4.9 -9.93,-10.44 -14.5,-14.71 Q 344.85,153.38 330.4,137.55 c -3.87,-4.24 -8.62,-8.53 -13.14,-13.16 q -36.27,-37.1 -62.8,-64.85 -0.88,-0.93 -2.38,-1.89 a 0.64,0.63 -73.6 0 0 -0.98,0.54 z" />
            {/* D */}
            <path d="m 464.91,146.53 a 0.22,0.22 0 0 0 0.22,0.22 q 30.55,0.1 71.62,-0.08 c 14.55,-0.06 27.38,-4.71 36.41,-16.12 6.21,-7.86 8.48,-18.09 8.92,-28.28 0.66,-15.54 0.86,-30.57 -6.74,-43.62 -5.41,-9.29 -16.47,-15.71 -27.38,-18.52 q -3.89,-1 -14.49,-0.93 -50.7,0.35 -128.15,0.01 a 0.78,0.78 0 0 0 -0.77,0.89 q 0.35,2.49 0.36,5.75 0.15,25.19 0.09,75.65 -0.01,6.51 0.84,11.71 a 0.49,0.49 0 0 1 -0.78,0.47 q -2.24,-1.74 -3.99,-3.5 -23.12,-23.34 -25.52,-25.79 -0.17,-0.17 -5.29,-5.81 a 1.38,1.32 24.9 0 1 -0.35,-0.9 V 6.12 a 0.35,0.35 0 0 1 0.35,-0.35 q 83.34,0.25 160.07,-0.08 11.32,-0.05 16.36,0.56 10.56,1.28 16.13,2.72 3.47,0.9 4.85,1.07 a 3.37,2.45 -23.1 0 1 0.57,0.13 q 10.06,3.55 19.88,10.2 c 8.97,6.07 16.26,16.22 20.82,25.92 q 6.44,13.66 8.26,28.23 c 1.37,11 1.4,25.49 0.35,35.65 -3,29.16 -17.34,53.74 -45.46,64.19 -11.2,4.16 -22.99,5.36 -36.32,5.31 q -52.93,-0.2 -105.67,0.21 a 0.5,0.49 89.4 0 1 -0.5,-0.5 V 76.72 a 0.49,0.49 0 0 1 0.49,-0.49 h 34.14 a 0.68,0.67 0 0 1 0.68,0.67 z" />
            {/* G */}
            <path d="m 733.22,108.68 a 0.2,0.2 0 0 1 -0.14,-0.34 l 28.84,-31.1 a 3.32,3.3 21.3 0 1 2.43,-1.06 h 62.86 a 0.51,0.51 0 0 1 0.51,0.51 v 102.42 a 0.34,0.33 89.1 0 1 -0.32,0.34 c -17.11,0.58 -53.97,0.18 -115.78,0.2 q -2.29,0 -9.09,-0.98 c -12.5,-1.79 -24.2,-6.69 -33.88,-14.09 -19.66,-15.05 -27.76,-41.52 -28.44,-65.59 -0.43,-15.13 0.73,-30.1 5.1,-43.74 Q 649.23,43 658.66,31.04 c 7.24,-9.18 17.19,-15.81 27.81,-19.58 10.27,-3.65 20.1,-5.88 31.68,-5.81 10.59,0.07 20.66,0.22 29.13,0.21 Q 819.97,5.8 932.14,5.84 a 0.37,0.37 0 0 1 0.24,0.65 c -1.38,1.19 -3.22,2.53 -4.31,3.56 q -9.28,8.74 -23.57,22.7 -1.22,1.19 -7.92,6.46 a 1.64,1.63 28.4 0 1 -1.16,0.34 q -2.27,-0.21 -5.66,-0.21 -157.79,0.2 -158.47,0.2 c -16.36,-0.07 -26.57,-0.01 -38.6,7.91 -9.3,6.11 -15.16,19.47 -15.89,30.32 q -0.9,13.45 -0.47,22.76 0.64,14.14 4.27,22.19 7.78,17.26 27.89,22.25 c 6.18,1.53 15.24,1.95 22.05,1.92 q 15.62,-0.07 61.12,-0.06 a 0.47,0.47 0 0 0 0.47,-0.47 v -36.32 a 1.36,1.36 0 0 0 -1.36,-1.36 z" />
            {/* 4 */}
            <path d="m 1009.63,7.01 c -12.82,11.05 -24.81,23.55 -38.38,36.48 q -38.74,36.93 -58.55,55.7 -7.32,6.93 -13.83,12.55 a 0.38,0.38 0 0 0 0.25,0.66 h 78.84 a 0.27,0.27 0 0 0 0.27,-0.27 V 67.55 A 3.57,3.55 -22.2 0 1 979.31,65 l 33.78,-32.73 a 0.61,0.61 0 0 1 1.03,0.51 q -0.49,4.09 -0.49,5.1 -0.01,50.9 0.29,74.15 a 0.27,0.27 0 0 0 0.27,0.26 h 29.45 a 0.45,0.45 0 0 1 0.45,0.45 v 31.82 a 0.51,0.5 -90 0 1 -0.5,0.51 h -29.58 a 0.43,0.42 0 0 0 -0.43,0.42 v 33.61 a 0.6,0.6 0 0 1 -0.6,0.6 h -33.86 a 0.72,0.72 0 0 1 -0.72,-0.72 v -33.19 a 0.65,0.65 0 0 0 -0.65,-0.65 H 851.92 a 0.57,0.57 0 0 1 -0.57,-0.57 V 113.8 a 2.08,2.02 60.7 0 1 0.27,-1.02 q 1.71,-2.97 3.26,-4.41 c 18.79,-17.51 35.25,-33.81 55.65,-52.98 q 29.64,-27.87 46.23,-43.8 4.48,-4.3 4.7,-4.44 c 2.37,-1.46 4.62,-1.18 7.36,-1.21 q 22.77,-0.21 40.54,0.31 a 0.43,0.43 0 0 1 0.27,0.76 z" />
            {/* M */}
            <path d="m 1485.22,179.86 q 0.19,0.07 0.33,0.19 0.25,0.23 0.11,0.48 -0.14,0.27 -0.58,0.16 a 0.16,0.15 7.2 0 1 -0.12,-0.15 v -0.32 a 0.53,0.52 90 0 0 -0.52,-0.53 h -178.53 a 0.51,0.51 0 0 1 -0.51,-0.51 v -139 a 0.55,0.55 0 0 0 -0.55,-0.55 q -18.12,-0.13 -36.49,0.26 c -3.23,0.07 -4.74,-1.38 -7.28,1.94 -10.05,13.13 -17.44,24.01 -26.65,35.75 q -17.71,22.59 -47.61,62.23 -2.29,3.03 -2.73,4.77 a 0.81,0.8 7.5 0 1 -0.78,0.59 h -18.22 a 1.6,1.6 0 0 1 -1.28,-0.64 l -60.32,-81.54 a 0.63,0.62 -67.6 0 0 -1.12,0.47 c 0.54,3.63 0.91,7.36 0.92,11.08 q 0.1,32.38 0.23,104.91 a 0.35,0.35 0 0 1 -0.35,0.35 h -35.04 a 0.56,0.56 0 0 1 -0.56,-0.56 V 6.31 a 0.46,0.46 0 0 1 0.46,-0.46 q 7.93,-0.02 30.75,0.06 2.53,0.01 3.7,1.83 c 3.21,5 6.76,9.96 10.37,14.37 q 10.93,13.31 19.2,24.84 c 14.78,20.59 23.25,30.62 39.39,52.09 q 0.34,0.45 2.68,3 a 0.58,0.57 41.6 0 0 0.89,-0.05 q 22.13,-30.43 45.38,-61.61 5.77,-7.74 24.85,-32.65 1.43,-1.87 3.76,-1.87 216.19,-0.05 236.23,-0.13 a 0.38,0.38 0 0 1 0.38,0.38 v 32.44 a 0.92,0.92 0 0 1 -0.92,0.92 l -143.26,-0.15 a 0.05,0.04 -90 0 0 -0.04,0.05 v 36.01 a 0.78,0.78 0 0 0 0.78,0.78 h 128.38 a 0.73,0.72 0 0 1 0.73,0.72 v 31.75 a 0.2,0.2 0 0 1 -0.2,0.2 h -129.29 a 0.46,0.46 0 0 0 -0.46,0.46 v 36.76 a 0.73,0.72 -90 0 0 0.72,0.73 h 142.96 a 0.59,0.59 0 0 1 0.59,0.58 l 0.47,28.78 a 1.23,1.2 56.8 0 1 -0.09,0.46 l -1.04,2.64 a 0.48,0.47 21 0 0 0.28,0.62 z" />
            <path d="m 1265.07,41.8 q -0.17,0.15 -0.37,0.12 a 0.16,0.16 0 0 1 -0.14,-0.12 q -0.05,-0.23 0.38,-0.3 a 0.17,0.17 0 0 1 0.13,0.3 z" />
            <path d="m 1282,56.38 q 0.29,0.68 -0.78,0.07 -0.78,-0.45 -0.58,0.25 0.42,1.45 0.42,2.29 0.26,55.03 0.08,120.1 a 0.56,0.55 0 0 1 -0.56,0.55 h -34.76 a 0.48,0.48 0 0 1 -0.48,-0.48 v -79.8 a 3.73,3.67 -33.6 0 1 0.31,-1.48 q 0.86,-1.98 3.51,-5.46 11.5,-15.09 21.83,-28.18 3.71,-4.7 6.25,-7.08 a 2.77,2.73 13.7 0 1 0.99,-0.59 l 2.45,-0.79 a 1.08,1.07 -20.3 0 1 1.32,0.6 z" />
          </svg>
          
          {/* Tagline - larger */}
          <p className="text-white/60 text-xl tracking-[0.3em] font-mono mt-8">
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
      // Target rotation based on mouse position
      targetRotation.current.y = mouse.current.x * 0.12;
      targetRotation.current.x = -mouse.current.y * 0.06;
      
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
