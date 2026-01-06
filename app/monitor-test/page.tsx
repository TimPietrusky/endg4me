"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Grid } from "@react-three/drei";

function Monitor() {
  const { scene } = useGLTF("/models/crt.glb");
  
  // Log the model bounds
  console.log("Monitor scene:", scene);
  
  // Model is GIGANTIC - scale it down to 1%
  return <primitive object={scene} scale={0.01} />;
}

export default function MonitorTestPage() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10 text-white font-mono text-sm">
        <p>Drag to rotate | Scroll to zoom</p>
        <p>Looking for the monitor...</p>
      </div>
      
      <Canvas
        camera={{
          position: [0, 2, 5],
          fov: 50,
        }}
      >
        <color attach="background" args={["#1a1a2e"]} />
        
        {/* Bright lighting */}
        <ambientLight intensity={2} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <pointLight position={[0, 5, 5]} intensity={1} />
        
        {/* Grid to show scale */}
        <Grid 
          infiniteGrid 
          cellSize={0.5} 
          sectionSize={2} 
          fadeDistance={30}
          cellColor="#444"
          sectionColor="#666"
        />
        
        {/* Orbit controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
        
        <Suspense fallback={null}>
          <Monitor />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

