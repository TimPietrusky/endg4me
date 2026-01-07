"use client"

import { useRef, useMemo, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"

interface DepthPlaneProps {
  image: string
  depthImage: string
}

// Vertex shader for depth displacement
const vertexShader = `
  varying vec2 vUv;
  varying float vDepth;
  uniform sampler2D depthMap;
  uniform float displacement;
  uniform vec2 offset;
  uniform float time;
  
  void main() {
    vUv = uv;
    
    // Sample depth (white = foreground, black = background)
    float depth = texture2D(depthMap, uv).r;
    vDepth = depth;
    
    // Stronger automatic animation for always-visible 3D effect
    vec2 autoOffset = vec2(
      sin(time * 0.6) * 0.3,
      cos(time * 0.8) * 0.2
    );
    
    // Combine auto animation with mouse offset
    vec2 totalOffset = (offset + autoOffset) * depth * displacement;
    
    // Strong z-axis displacement for pop-out effect
    float zOffset = depth * displacement * 1.0;
    
    vec3 newPosition = position;
    newPosition.xy += totalOffset;
    newPosition.z += zOffset;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

// Fragment shader with depth-based shading for 3D effect
const fragmentShader = `
  varying vec2 vUv;
  varying float vDepth;
  uniform sampler2D colorMap;
  
  void main() {
    vec4 color = texture2D(colorMap, vUv);
    
    // Stronger ambient occlusion - darken background areas more
    float ao = mix(0.5, 1.15, vDepth);
    color.rgb *= ao;
    
    gl_FragColor = color;
  }
`

function DepthPlane({ image, depthImage }: DepthPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  
  const [colorMap, depthMap] = useTexture([image, depthImage])
  
  const uniforms = useMemo(
    () => ({
      colorMap: { value: colorMap },
      depthMap: { value: depthMap },
      displacement: { value: 0.6 },
      offset: { value: new THREE.Vector2(0, 0) },
      time: { value: 0 },
    }),
    [colorMap, depthMap]
  )
  
  useFrame(({ pointer, clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial
      // Update time for automatic animation
      material.uniforms.time.value = clock.getElapsedTime()
      // Smooth mouse following (adds to automatic animation)
      material.uniforms.offset.value.lerp(
        new THREE.Vector2(pointer.x * 0.5, pointer.y * 0.5),
        0.08
      )
    }
  })
  
  // Cover the viewport (object-fit: cover behavior)
  const imageAspect = 16 / 9
  const viewportAspect = viewport.width / viewport.height
  
  let width = viewport.width
  let height = viewport.height
  
  if (viewportAspect > imageAspect) {
    // Viewport wider than image - match width, overflow height
    height = width / imageAspect
  } else {
    // Viewport taller than image - match height, overflow width
    width = height * imageAspect
  }
  
  // Scale up slightly for parallax room
  width *= 1.15
  height *= 1.15
  
  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height, 64, 64]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  )
}

interface DepthImageProps {
  image: string
  depthImage: string
  className?: string
}

export function DepthImage({ image, depthImage, className }: DepthImageProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <div className={className} />
  }
  
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: true }}
      >
        <DepthPlane image={image} depthImage={depthImage} />
      </Canvas>
    </div>
  )
}

