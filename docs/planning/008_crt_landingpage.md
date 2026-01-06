# User Story: 3D CRT Monitor Hero on Landing Page

## Title

Landing page hero uses a 3D CRT monitor scene and renders the Endg4me entry UI on the monitor screen.

## Player goal

As a player, I want an impressive “terminal gateway” landing page where the logo, slogan, and start/continue button appear _on a CRT monitor_, so the game instantly feels like entering a cyberpunk AI lab.

## Why it matters

- Makes the first impression memorable and on-theme (tech/cyberpunk).
- Creates a reusable “terminal in a room” visual language we can reuse later in-game.
- Keeps the landing CTA clear while upgrading the presentation.

## Scope

Integrate a Poly Haven CRT model (CC0) into the landing page hero as a lightweight 3D scene. The existing landing UI (logo “Endg4me”, slogan “raised to singularity”, start/continue button) must be rendered on the monitor screen, remain responsive, and remain clickable/accessibility-friendly.

> Note: Poly Haven assets are CC0 (no attribution required). We will still add a Credits page entry as a courtesy.

---

## Requirements

### Functional

1. Landing page hero renders a 3D CRT monitor scene (full-viewport hero).
2. The landing UI is visually displayed _on the monitor screen_:
   - Large logo “Endg4me”
   - Slogan “raised to singularity”
   - Button shows **Start** if logged out, **Continue** if logged in
3. The button is clickable and triggers the same navigation/flow as today.
4. The hero works across breakpoints:
   - Mobile portrait
   - Tablet
   - Desktop widescreen
5. The hero degrades gracefully:
   - If WebGL fails or is disabled, show a static fallback hero image with the same CTA.
6. Performance is acceptable:
   - First render is not janky (no long blank screen).
   - The scene remains smooth on typical laptops/phones.

### Visual / UX

1. Scene is minimalist (focus on the CRT):
   - CRT + subtle desk/ground plane (optional)
   - Dark room baseline lighting
2. Screen has a subtle cyberpunk feel:
   - Light scanline / mild glitch effect (screen only)
   - Optional: background image swap (utopia ↔ ruined) can happen on the screen or behind it
3. Logo/slogan/button remain readable and not overly distorted.

### Tech / Implementation

1. Use a 3D pipeline suitable for Next.js:
   - Three.js via React Three Fiber (preferred), or equivalent Three integration
2. Screen UI should be real HTML pinned to the screen plane (preferred for crisp text + click targets).
3. The Poly Haven CRT model is loaded as GLB and optimized for web delivery.
4. Add a Credits page entry for Poly Haven.

---

## Acceptance criteria (testable)

### Rendering & layout

- [ ] Opening `/` shows a full-viewport hero with a visible CRT monitor centered in frame.
- [ ] The logo, slogan, and CTA are visible _on the screen area_ of the CRT (not floating in the scene).
- [ ] On desktop, the monitor is framed nicely (not cropped).
- [ ] On mobile portrait, the monitor and CTA remain readable without zooming.

### Interaction

- [ ] Clicking **Start** (logged out) triggers the existing login/signup flow.
- [ ] Clicking **Continue** (logged in) triggers the existing “continue” flow.
- [ ] Keyboard navigation reaches the CTA (tab focus visible), and pressing Enter triggers it.
- [ ] Hero is usable without mouse (accessibility baseline).

### Responsive behavior

- [ ] At 3 breakpoints (mobile/tablet/desktop), monitor remains in frame and UI remains legible.
- [ ] UI scales appropriately (no microscopic text on mobile, no comically huge text on desktop).

### Performance & fallback

- [ ] Model is optimized (reasonable file size) and does not block the page from becoming interactive.
- [ ] If WebGL is unavailable, a static fallback renders and the CTA still works.
- [ ] No console errors in normal operation.

### Credits / licensing

- [ ] There is a Credits (or “Attributions”) page that includes Poly Haven.
- [ ] The landing page or site footer links to Credits.

---

## Implementation checklist (engineering tasks)

### Asset pipeline

- [ ] Import Poly Haven CRT asset.
- [ ] Ensure the model is exported as `.glb`.
- [ ] Name the screen mesh (e.g., `Screen`) or record its node path for easy targeting.
- [ ] Optimize:
  - [ ] Reduce textures to 1K–2K where possible
  - [ ] Enable compression (Draco for geometry; optional KTX2 for textures)
- [ ] Store under a stable path (e.g., `/public/models/crt.glb`) or a CDN bucket.

### Hero scene

- [ ] Create `TerminalHero` component:
  - [ ] Canvas setup (R3F)
  - [ ] Load CRT GLB
  - [ ] Lights (ambient + rim + subtle fill)
  - [ ] Minimal environment (optional desk plane)
  - [ ] Camera framing that keeps CRT in view
- [ ] Add responsive camera/layout logic (3 breakpoint presets):
  - [ ] mobile: front-ish, closer, less tilt
  - [ ] tablet: slight angle
  - [ ] desktop: more dramatic angle, more breathing room

### Screen UI overlay

- [ ] Create `TerminalScreenUI` component:
  - [ ] Renders existing landing UI (logo/slogan/button)
  - [ ] Receives auth state (`isLoggedIn`)
  - [ ] Uses the same click handlers/routes as current hero
- [ ] Pin HTML to the CRT screen plane:
  - [ ] Align position/rotation/scale to match `Screen`
  - [ ] Ensure pointer events work (click + hover + focus)
  - [ ] Ensure text remains crisp (avoid texture blurring)

### Effects (screen-only)

- [ ] Add scanlines/glitch styling to the screen UI:
  - [ ] Prefer CSS overlay (cheap) before shader complexity
  - [ ] Keep distortion subtle so readability stays high
- [ ] Optional: integrate your existing utopia ↔ ruined image swap as screen background.

### Fallback hero

- [ ] Add a static fallback hero:
  - [ ] “CRT screenshot” or curated image background
  - [ ] Same DOM CTA overlay (logo/slogan/button)
- [ ] Detect WebGL support and switch to fallback when needed.

### Credits page

- [ ] Add `Credits` page route.
- [ ] Add Poly Haven entry:
  - [ ] “Poly Haven (CC0 assets)”
  - [ ] Link to the asset or Poly Haven site
- [ ] Link Credits from footer or landing page.

---

## Notes / edge cases

- Keep the 3D hero isolated from gameplay pages to avoid loading heavy assets where not needed.
- Don’t let postprocessing effects apply to the whole page; keep them screen-local if possible.
- Ensure the CTA remains usable on low-end devices (reduce DPR, disable effects as needed).

## Out of scope (for this story)

- Building a custom CRT model in Blender.
- Full shader-based CRT distortion pipeline (can be a follow-up story).
- Reusing the terminal scene in other game pages (separate story after landing ships).
