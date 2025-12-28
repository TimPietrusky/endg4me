"use client";

import { useCallback, useEffect, useState } from "react";

const backgrounds = ["/background-1.jpg", "/background-2.jpg"];

function getRandomInterval() {
  // Random interval between 1000ms (1s) and 5000ms (5s)
  return Math.random() * 4000 + 1000;
}

export function GlitchBackground() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGlitching, setIsGlitching] = useState(false);

  const triggerGlitch = useCallback(() => {
    // Start glitch effect
    setIsGlitching(true);

    // After glitch animation, swap background
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % backgrounds.length);
    }, 200);

    // End glitch effect
    setTimeout(() => {
      setIsGlitching(false);
    }, 400);
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const scheduleNextGlitch = () => {
      timeoutId = setTimeout(() => {
        triggerGlitch();
        scheduleNextGlitch();
      }, getRandomInterval());
    };

    scheduleNextGlitch();

    return () => clearTimeout(timeoutId);
  }, [triggerGlitch]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base background layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
        style={{ backgroundImage: `url(${backgrounds[currentIndex]})` }}
      />

      {/* Glitch layers - only visible during glitch */}
      {isGlitching && (
        <>
          {/* Red channel offset */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70 mix-blend-multiply animate-glitch-1"
            style={{
              backgroundImage: `url(${backgrounds[currentIndex]})`,
              filter: "url(#red-channel)",
            }}
          />
          {/* Cyan channel offset */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-70 mix-blend-screen animate-glitch-2"
            style={{
              backgroundImage: `url(${
                backgrounds[(currentIndex + 1) % backgrounds.length]
              })`,
              filter: "url(#cyan-channel)",
            }}
          />
          {/* Scan lines */}
          <div className="absolute inset-0 bg-scanlines opacity-30 animate-flicker" />
          {/* Noise overlay */}
          <div className="absolute inset-0 bg-noise opacity-20 animate-noise" />
        </>
      )}

      {/* SVG Filters for color channel separation */}
      <svg className="hidden">
        <defs>
          <filter id="red-channel">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="cyan-channel">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  );
}
