# User Story: Asset Generation Workflow for Entity Icons (Manga Cyberpunk, Neutral, Depth-Ready)

## Title
Create a repeatable “/asset” workflow to generate coherent entity assets (PNG + depth map) in a consistent manga-cyberpunk universe.

## Player goal
As a player, I want every entity (models, revenue items, compute, research, hiring) to have a recognizable, coherent visual asset, so the UI feels polished and readable without being visually overloaded.

## Why it matters
- Consistency: all assets feel like they belong to the same universe.
- Scalability: we can add new entities quickly without reinventing prompts.
- Flexibility: assets stay neutral (no baked accent colors) and can be tinted/styled via UI later.
- Future-proof: depth maps unlock optional 2.5D/3D-ish effects and “inset” hologram rendering.

---

## Scope
Define a single agent-facing command/workflow (e.g. `/asset`) that:
1) brainstorms a single-object “object metaphor” for an entity,
2) generates a **transparent PNG** + a matching **depth map** (grayscale),
3) outputs a **ready-to-save file naming scheme** and a **metadata snippet** so we can use assets consistently across the app.

This story does **not** require changes to the current UI beyond the ability to reference the resulting files.

---

## Requirements

### Functional
1. There is one repeatable command/snippet that can be reused for every new entity.
2. The workflow always produces **two outputs**:
   - `asset.png` (transparent background, single object)
   - `asset_depth.png` (grayscale depth map, same framing)
3. The workflow includes a brainstorming step with the user (Tim) to select the best object metaphor.
4. The workflow enforces the global style rules so assets remain consistent across time.

### Asset constraints (hard rules)
- **No baked accent colors** (no category coloring in the art).
- **Single object** only (or very compact vignette of a single object with attached parts).
- **No environment backgrounds** (no city, no room).
- Prefer **transparent background**. If not possible, use **flat neutral background** (pure gray) that is easy to key out.
- **No text, no logos, no watermarks** inside the art.
- Composition must be readable at small sizes.

### Deliverables per entity
- Primary: `1024x1024` PNG (alpha).
- Depth: `1024x1024` grayscale PNG.
- Optional (nice-to-have): mask/alpha helper.

### Storage + naming
Assets are saved with a stable naming convention:
- `assets/entities/<entity_slug>/<entity_slug>_v001.png`
- `assets/entities/<entity_slug>/<entity_slug>_v001_depth.png`

Where `entity_slug` is lowercase kebab-case (e.g. `3b-tts`, `7b-vlm`, `basic-website`).

### Metadata
For each asset, the workflow outputs a small JSON snippet:
- `id`, `title`, `category`, `entityType`, `slug`, `version`, `files`, `notes`, `promptHash` (optional)

---

## Acceptance criteria (testable)
- [ ] I can type `/asset` followed by an entity name (and optional short notes) and reliably get:
  - a final “main PNG prompt”
  - a final “depth map prompt”
  - a suggested filename + slug
  - a metadata JSON snippet
- [ ] The generated prompt enforces:
  - manga-cyberpunk linework + halftone shading
  - single-object isolation
  - no text/logos/watermarks
  - neutral / transparent background
- [ ] The depth prompt enforces:
  - grayscale only, smooth gradients
  - no outlines / no halftone / no texture
- [ ] The resulting assets can be placed into an entity card without requiring category-color changes to the art.

---

## Agent Command Snippet: `/asset`
Use this verbatim as the reusable command for the agent.

### Input format
`/asset: <entity_name> | <category> | <optional_notes>`

Examples:
- `/asset: 3B TTS | model | voice synthesis device`
- `/asset: Basic Website | revenue | simple web product starter`
- `/asset: Compute Units | compute | gpu power block`

### Output format (what the agent must return)
1. **Clarifying brainstorm (2–4 options)**  
   - Propose 2–4 “object metaphors” that represent the entity as a single object.
   - Each option must be one sentence and avoid color instructions.

2. **Chosen direction**  
   - Ask the user to pick one option (or propose a merged option).
   - If the user doesn’t pick, choose the best one and proceed.

3. **Final prompts (copy-paste ready)**
   - Main PNG prompt
   - Depth map prompt

4. **File naming**
   - `entity_slug`
   - suggested file paths

5. **Metadata JSON snippet**
   - ready to paste into a catalog file later

---

## Global Prompt Pack (the agent must always use)

### A) Style Lock (always included)
**STYLE_LOCK**
> manga cyberpunk object illustration, clean inked linework, subtle halftone shading, cel-shaded tones (2 to 4 tone steps), high detail but readable silhouette, studio-like lighting, sharp focus, consistent camera, 2.5D comic render, no text, no logos, no watermark

### B) Composition Lock (always included)
**COMPOSITION_LOCK**
> single centered object, isolated, transparent background png (alpha), if transparency is not supported then flat neutral gray background, no environment, no city, no room, no clutter, generous padding around the object (15 to 20 percent), readable at small size

### C) Main PNG prompt template
**MAIN_PROMPT**
> {STYLE_LOCK}, {COMPOSITION_LOCK}, subject: {OBJECT_METAPHOR}

### D) Depth map prompt template
**DEPTH_PROMPT**
> depth map for the same subject and framing, grayscale only, smooth depth gradients, foreground white, background black, no outlines, no halftone, no texture, no shadows, no background elements, subject: {OBJECT_METAPHOR}

---

## Suggested agent behavior (brainstorm rules)
- Don’t mention categories/colors in the art.
- Always pick metaphors with **strong silhouette**:
  - “module”, “cartridge”, “core”, “chip”, “badge”, “crate”, “rack”, “canister”, “visor”, “terminal”
- For models, avoid literal “text labels” like “TTS”. Use visual symbols:
  - waveform / speaker grill / mic shape language (without text)
  - lens + chip fusion for VLM (without text)
- Keep it plausible: an object that could exist in the Endg4me universe.

---

## Implementation tasks (engineering)
1. **Documentation**
   - [ ] Add the `/asset` snippet to internal docs (e.g. `docs/art/asset-workflow.md`).
2. **Asset folder structure**
   - [ ] Create `assets/entities/` base folder and ensure it is included in repo or storage.
3. **Optional: Asset catalog**
   - [ ] Add `contentCatalog` (or a new `assetCatalog`) mapping entity IDs → file paths.
4. **Optional: UI helper**
   - [ ] Add a small helper to resolve `entity_slug` → image URLs.
5. **Optional: 2.5D toggle support (follow-up story)**
   - [ ] Implement depth-based parallax renderer in UI with a settings toggle.

---

## Out of scope (this story)
- Implementing the full 2.5D depth parallax rendering (separate story).
- Reworking card layouts or adding category hero sections.
- Creating 3D models from assets.

---

## Example run (for validation)

### Input
`/asset: 3B TTS | model | voice synthesis`

### Brainstorm options (agent output example)
1) “a compact voice synthesizer module with a small waveform display and speaker grill details”
2) “a cyberpunk microphone capsule fused into a circuit core, like a ‘voice chip’”
3) “a sealed cartridge communicated by shape language only: vents + waveform window + audio ports”

### Chosen
Option 1

### Final prompts
**Main**
> manga cyberpunk object illustration, clean inked linework, subtle halftone shading, cel-shaded tones (2 to 4 tone steps), high detail but readable silhouette, studio-like lighting, sharp focus, consistent camera, 2.5D comic render, no text, no logos, no watermark, single centered object, isolated, transparent background png (alpha), if transparency is not supported then flat neutral gray background, no environment, no city, no room, no clutter, generous padding around the object (15 to 20 percent), readable at small size, subject: a compact voice synthesizer module with a small waveform display and speaker grill details

**Depth**
> depth map for the same subject and framing, grayscale only, smooth depth gradients, foreground white, background black, no outlines, no halftone, no texture, no shadows, no background elements, subject: a compact voice synthesizer module with a small waveform display and speaker grill details

### Files
- `assets/entities/3b-tts/3b-tts_v001.png`
- `assets/entities/3b-tts/3b-tts_v001_depth.png`

### Metadata
```json
{
  "id": "model_3b_tts",
  "title": "3B TTS",
  "category": "model",
  "slug": "3b-tts",
  "version": "v001",
  "files": {
    "image": "assets/entities/3b-tts/3b-tts_v001.png",
    "depth": "assets/entities/3b-tts/3b-tts_v001_depth.png"
  },
  "notes": "single-object neutral asset; depth map ready for inset parallax"
}
```
