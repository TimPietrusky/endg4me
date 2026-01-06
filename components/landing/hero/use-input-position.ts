"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// Extend Window interface for iOS DeviceOrientationEvent permission
declare global {
  interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
    requestPermission?: () => Promise<"granted" | "denied">;
  }
}

/**
 * Hook to track input position normalized to -1 to 1.
 * Uses mouse on desktop, device orientation on mobile.
 */
export function useInputPosition() {
  const position = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [orientationPermission, setOrientationPermission] = useState<"granted" | "denied" | "pending">("pending");
  const [needsPermissionRequest, setNeedsPermissionRequest] = useState(false);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const hasTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const hasOrientation = "DeviceOrientationEvent" in window;
      setIsMobile(hasTouchScreen && hasOrientation);
    };
    checkMobile();
  }, []);
  
  // Check if iOS requires permission request
  useEffect(() => {
    if (!isMobile) return;
    
    const DeviceOrientationEventIOS = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
    if (typeof DeviceOrientationEventIOS.requestPermission === "function") {
      // iOS 13+ requires permission
      setNeedsPermissionRequest(true);
    } else {
      // Android or older iOS - permission granted by default
      setOrientationPermission("granted");
    }
  }, [isMobile]);
  
  // Request permission callback for iOS
  const requestOrientationPermission = useCallback(async () => {
    const DeviceOrientationEventIOS = DeviceOrientationEvent as unknown as DeviceOrientationEventiOS;
    if (typeof DeviceOrientationEventIOS.requestPermission === "function") {
      try {
        const permission = await DeviceOrientationEventIOS.requestPermission();
        setOrientationPermission(permission);
        setNeedsPermissionRequest(false);
      } catch {
        setOrientationPermission("denied");
      }
    }
  }, []);
  
  // Set up mouse tracking for desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      position.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      position.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);
  
  // Set up device orientation for mobile
  useEffect(() => {
    if (!isMobile || orientationPermission !== "granted") return;
    
    // Store initial orientation to use as baseline
    let baselineBeta: number | null = null;
    let baselineGamma: number | null = null;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      
      // Set baseline on first reading (device's natural position)
      if (baselineBeta === null) baselineBeta = e.beta;
      if (baselineGamma === null) baselineGamma = e.gamma;
      
      // Calculate offset from baseline
      // beta: front-back tilt (-180 to 180) - map to y
      // gamma: left-right tilt (-90 to 90) - map to x
      const betaOffset = e.beta - baselineBeta;
      const gammaOffset = e.gamma - baselineGamma;
      
      // Normalize to -1 to 1 range with sensitivity adjustment
      // Clamp to prevent extreme values
      const sensitivity = 0.03; // Lower = more subtle movement
      position.current.x = Math.max(-1, Math.min(1, gammaOffset * sensitivity));
      position.current.y = Math.max(-1, Math.min(1, -betaOffset * sensitivity));
    };
    
    window.addEventListener("deviceorientation", handleOrientation);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, [isMobile, orientationPermission]);
  
  return { 
    position, 
    isMobile, 
    needsPermissionRequest, 
    requestOrientationPermission,
    orientationPermission 
  };
}

