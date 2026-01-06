"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { FallbackHero } from "./fallback-hero";
import { useInputPosition, SceneContent } from "./hero";

export interface TerminalHeroProps {
  isLoggedIn: boolean;
  signInUrl: string;
  hasError?: boolean;
  errorMessage?: string;
  seed: number;
}

export function TerminalHero({
  isLoggedIn,
  signInUrl,
  hasError,
  errorMessage,
  seed,
}: TerminalHeroProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const { 
    position, 
    isMobile, 
    needsPermissionRequest, 
    requestOrientationPermission,
    orientationPermission 
  } = useInputPosition();

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
    // On iOS, first tap requests orientation permission
    if (isMobile && needsPermissionRequest && orientationPermission === "pending") {
      requestOrientationPermission();
      return;
    }
    
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
          inputPosition={position}
          seed={seed}
        />
      </Canvas>

      {/* iOS permission request hint */}
      {isMobile && needsPermissionRequest && orientationPermission === "pending" && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1001] pointer-events-none">
          <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg backdrop-blur-sm">
            <p className="text-white/80 text-sm font-mono tracking-wide">
              TAP TO ENABLE MOTION CONTROL
            </p>
          </div>
        </div>
      )}

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
