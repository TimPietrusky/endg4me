"use client"

import { useRef, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { useGLTF, Center } from "@react-three/drei"
import * as THREE from "three"

interface ModelProps {
  url: string
}

function Model({ url }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { scene } = useGLTF(url)
  
  // Auto-rotate
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.02
    }
  })
  
  return (
    <Center>
      <group ref={groupRef} rotation={[0.15, 0, 0]}>
        <primitive object={scene} scale={2.2} />
      </group>
    </Center>
  )
}

// Simple room environment with colored walls
function Room() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 0, -2]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Floor */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial color="#0f0f1a" />
      </mesh>
      {/* Left wall */}
      <mesh position={[-2.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
      {/* Right wall */}
      <mesh position={[2.5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshBasicMaterial color="#16213e" />
      </mesh>
    </group>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshBasicMaterial color="#444" wireframe />
    </mesh>
  )
}

interface ModelViewerProps {
  modelUrl: string
  className?: string
}

export function ModelViewer({ modelUrl, className }: ModelViewerProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0.2, 2], fov: 40 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true }}
      >
        {/* Strong ambient for even base lighting */}
        <ambientLight intensity={3} />
        {/* Key light from front-right */}
        <directionalLight position={[3, 3, 4]} intensity={2} />
        {/* Fill light from left */}
        <directionalLight position={[-3, 2, 2]} intensity={1.5} />
        {/* Back light for rim */}
        <directionalLight position={[0, 2, -3]} intensity={1} />
        {/* Bottom fill */}
        <directionalLight position={[0, -2, 2]} intensity={0.8} />
        
        <Room />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model url={modelUrl} />
        </Suspense>
      </Canvas>
    </div>
  )
}

