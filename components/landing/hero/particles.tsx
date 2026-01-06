"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Atmospheric particles with slow movement for the hero scene.
 */
export function Particles() {
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
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

