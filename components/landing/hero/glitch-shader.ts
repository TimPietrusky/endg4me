/**
 * Glitch transition shader for the cyber frame background.
 * Blends between two textures with configurable glitch effects.
 */
export const GlitchTransitionShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tFrom;
    uniform sampler2D tTo;
    uniform float progress;
    uniform float time;
    uniform float isFrozen;
    uniform float frozenMicroGlitch;
    varying vec2 vUv;
    
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main() {
      vec2 uv = vUv;
      float p = progress;
      
      // No transition and not frozen - show current texture
      if (p <= 0.0 && isFrozen <= 0.0) {
        gl_FragColor = texture2D(tFrom, uv);
        return;
      }
      if (p >= 1.0 && isFrozen <= 0.0) {
        gl_FragColor = texture2D(tTo, uv);
        return;
      }
      
      // === GLITCH STRENGTH CALCULATION ===
      // Normal transition: peaks at middle
      // Frozen: use frozenMicroGlitch for subtle ongoing effect
      float baseGlitchStrength = sin(p * 3.14159);
      float glitchStrength = isFrozen > 0.5 
        ? frozenMicroGlitch * 0.4 + baseGlitchStrength * 0.3
        : baseGlitchStrength;
      
      // Horizontal slice displacement
      float sliceY = floor(uv.y * 15.0);
      float sliceRand = random(vec2(sliceY, time));
      float sliceOffset = 0.0;
      if (sliceRand > 0.7) {
        sliceOffset = (random(vec2(time, sliceY)) - 0.5) * 0.15 * glitchStrength;
      }
      
      // Block displacement  
      float blockY = floor(uv.y * 8.0);
      float blockX = floor(uv.x * 8.0);
      float blockRand = random(vec2(blockX + time, blockY));
      vec2 blockOffset = vec2(0.0);
      if (blockRand > 0.85) {
        blockOffset = vec2(
          (random(vec2(blockY, time * 2.0)) - 0.5) * 0.2,
          (random(vec2(blockX, time * 2.0)) - 0.5) * 0.1
        ) * glitchStrength;
      }
      
      // Wavy distortion - slower and more subtle when frozen
      float waveSpeed = isFrozen > 0.5 ? 3.0 : 15.0;
      float wave = sin(uv.y * 30.0 + time * waveSpeed) * 0.01 * glitchStrength;
      
      // Apply distortions
      vec2 uvDistorted = uv + vec2(sliceOffset + wave, 0.0) + blockOffset;
      uvDistorted = clamp(uvDistorted, 0.0, 1.0);
      
      // RGB split amount
      float rgbSplit = 0.025 * glitchStrength;
      
      // Sample both textures with RGB split
      vec4 fromR = texture2D(tFrom, uvDistorted + vec2(rgbSplit, 0.0));
      vec4 fromG = texture2D(tFrom, uvDistorted);
      vec4 fromB = texture2D(tFrom, uvDistorted - vec2(rgbSplit, 0.0));
      vec4 fromColor = vec4(fromR.r, fromG.g, fromB.b, 1.0);
      
      vec4 toR = texture2D(tTo, uvDistorted + vec2(rgbSplit, 0.0));
      vec4 toG = texture2D(tTo, uvDistorted);
      vec4 toB = texture2D(tTo, uvDistorted - vec2(rgbSplit, 0.0));
      vec4 toColor = vec4(toR.r, toG.g, toB.b, 1.0);
      
      // Glitchy blend between textures
      // Use noise-based threshold for which pixels show which texture
      float noiseVal = noise(uv * 10.0 + time * 5.0);
      float threshold = p + (noiseVal - 0.5) * 0.4 * glitchStrength;
      
      // Hard cuts between textures based on slice position
      float sliceMix = step(random(vec2(sliceY, floor(time * 3.0))), p);
      
      // Combine blend methods
      float finalMix = mix(p, sliceMix, glitchStrength * 0.7);
      finalMix = mix(finalMix, threshold, glitchStrength * 0.3);
      
      vec4 color = mix(fromColor, toColor, clamp(finalMix, 0.0, 1.0));
      
      // Scanlines - more visible when frozen
      float scanlineStrength = isFrozen > 0.5 ? 0.05 : 0.03;
      float scanline = sin(uv.y * 400.0) * scanlineStrength * glitchStrength;
      color.rgb -= scanline;
      
      // Random noise - more visible when frozen
      float noiseStrength = isFrozen > 0.5 ? 0.15 : 0.1;
      float pixelNoise = (random(uv + time) - 0.5) * noiseStrength * glitchStrength;
      color.rgb += pixelNoise;
      
      // Flash on transition peaks (not when frozen)
      if (isFrozen <= 0.5) {
        float flash = pow(glitchStrength, 3.0) * 0.15;
        color.rgb += flash;
      }
      
      // Subtle color tint when frozen - slight cyan/magenta shift
      if (isFrozen > 0.5) {
        float tintAmount = frozenMicroGlitch * 0.03;
        color.r += sin(time * 2.0) * tintAmount;
        color.b += cos(time * 2.0) * tintAmount;
      }
      
      gl_FragColor = color;
    }
  `,
};

