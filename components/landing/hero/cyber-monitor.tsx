"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { GlitchScreen } from "./glitch-screen";
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_DEPTH } from "./constants";

interface CyberMonitorProps {
  isLoggedIn: boolean;
  signInUrl: string;
  inputPosition: React.MutableRefObject<{ x: number; y: number }>;
  seed: number;
}

/**
 * Floating glass display with transparent rounded case.
 * Contains the glitch screen and corner marks.
 */
export function CyberMonitor({ 
  isLoggedIn, 
  signInUrl,
  inputPosition,
  seed,
}: CyberMonitorProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });
  
  // Subtle floating animation + input tracking (mouse or device orientation)
  useFrame((state) => {
    if (groupRef.current) {
      // Target rotation based on input position - increased for more dramatic effect
      targetRotation.current.y = inputPosition.current.x * 0.3;
      targetRotation.current.x = -inputPosition.current.y * 0.15;
      
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
      <GlitchScreen isLoggedIn={isLoggedIn} seed={seed} />
    </group>
  );
}

