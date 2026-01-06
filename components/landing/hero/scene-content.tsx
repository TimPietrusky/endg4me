"use client";

import { Suspense } from "react";
import { CyberMonitor } from "./cyber-monitor";
import { Particles } from "./particles";

interface SceneContentProps {
  isLoggedIn: boolean;
  signInUrl: string;
  inputPosition: React.MutableRefObject<{ x: number; y: number }>;
  seed: number;
}

/**
 * Scene content component with lighting, cyber monitor, and particles.
 */
export function SceneContent({ 
  isLoggedIn, 
  signInUrl,
  inputPosition,
  seed,
}: SceneContentProps) {
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
          inputPosition={inputPosition}
          seed={seed}
        />
        <Particles />
      </Suspense>
    </>
  );
}

