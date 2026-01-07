Generate coherent entity assets (PNG) in manga-cyberpunk style.

## Input Format

`/asset: <entity_name> | <category> | <optional_notes>`

Examples:

- `/asset: 3B TTS | model | voice synthesis device`
- `/asset: Basic Website | revenue | simple web product starter`
- `/asset: Compute Units | compute | gpu power block`

---

## Workflow Steps

### Step 1: Brainstorm Object Metaphors

Propose 2-4 "object metaphors" that represent the entity as a single object.

Rules:

- Each option must be one sentence
- Avoid color instructions (no baked accent colors)
- Pick metaphors with strong silhouette: "module", "cartridge", "core", "chip", "badge", "crate", "rack", "canister", "visor", "terminal"
- For models, avoid literal text labels. Use visual symbols:
  - TTS: waveform, speaker grill, mic shape language
  - VLM: lens + chip fusion
  - LLM: neural pathways, data streams
- Keep it plausible for the Endg4me universe

### Step 2: Choose Direction

Ask user to pick one option (or propose a merged option). If user doesn't pick, choose the best one and proceed.

### Step 3: Generate Assets

After user picks direction, automatically:

1. Generate the main PNG image (16:9, using prompt templates below)
2. Create folder structure
3. Add metadata to contentCatalog.ts
4. Link to blueprint if applicable

---

## Global Prompt Pack

### STYLE_LOCK (always include)

```
manga cyberpunk object illustration, clean inked linework, subtle halftone shading, cel-shaded tones (2 to 4 tone steps), high detail but readable silhouette, studio-like lighting, sharp focus, consistent camera, 2.5D comic render, no text, no logos, no watermark
```

### COMPOSITION_LOCK (always include)

```
single centered object, wide horizontal form factor, object is wider than it is tall, low-profile shape, landscape orientation device, isolated, flat neutral gray background, no environment, no city, no room, no clutter, readable at small size
```

Note: Template mode (`-t`) handles positioning automatically via the composition guide. The prompt focuses on the object description; positioning instructions are added by the script.

### SIZE_GUIDE (for parameter-scaled models)

For AI models with parameter counts, scale device size:

- **Smallest (1B-3B)**: compact palm-sized device, small module
- **Medium (7B-13B)**: desktop-sized unit, standard module
- **Large (30B-70B)**: rack-mounted equipment, large module
- **Massive (100B+)**: industrial server rack, massive installation

Always generate the smallest variant first as baseline. Larger variants can reference smaller ones with "same device but scaled up / more complex / additional components".

### MAIN_PROMPT template

```
{STYLE_LOCK}, {COMPOSITION_LOCK}, subject: {OBJECT_METAPHOR}
```

---

## Asset Constraints (Hard Rules)

- No baked accent colors (no category coloring in the art)
- Single object only (or very compact vignette with attached parts)
- No environment backgrounds (no city, no room)
- Flat neutral gray background (template mode crops to safe zone)
- No text, no logos, no watermarks inside the art
- Composition must be readable at small sizes
- Deliverables: 1344x756 PNG (16:9 ratio, auto-cropped from template)

---

## File Naming

Generate `entity_slug` (lowercase kebab-case):

- `3B TTS` -> `3b-tts`
- `Basic Website` -> `basic-website`

File paths:

- `public/assets/entities/<entity_slug>/<entity_slug>_v001.png` (original with gray background)
- `public/assets/entities/<entity_slug>/<entity_slug>_v001_transparent.png` (transparent background)

---

## Generation Commands

**Main PNG (with composition template):**

```bash
node scripts/generate-image.mjs -p "<MAIN_PROMPT>" -t -o assets/entities/<slug>/<slug>_v001.png
```

The `-t` flag enables template mode:

- Uses `public/assets/templates/composition-template.png` as reference
- Adds composition instructions to place object within marked boundary
- Auto-crops output to safe zone (1344x756, 16:9 ratio)
- Removes the magenta guide border from final image

**Transparent PNG (background removal):**

```bash
node scripts/remove-background.mjs -i public/assets/entities/<slug>/<slug>_v001.png
```

This creates `<slug>_v001_transparent.png` alongside the original:

- Uses fal-ai/birefnet/v2 for high-quality background removal
- Preserves the original with background
- Transparent version can be composited on any background later

---

## Metadata JSON

Add to `ENTITY_ASSETS` in `convex/lib/contentCatalog.ts`:

```typescript
{
  id: "<category>_<entity_slug_underscored>",
  title: "<Entity Name>",
  category: "<category>",
  slug: "<entity_slug>",
  version: "v001",
  files: {
    image: "/assets/entities/<entity_slug>/<entity_slug>_v001.png",
    imageTransparent: "/assets/entities/<entity_slug>/<entity_slug>_v001_transparent.png",
  },
  notes: "<object metaphor description>",
},
```

If entity is a model blueprint, also add `assetSlug: "<entity_slug>"` to the blueprint in `MODEL_BLUEPRINTS`.

---

## Output Checklist

1. Brainstorm options (2-4)
2. User picks one (or auto-select best)
3. Generate PNG via generate-image.mjs
4. Remove background via remove-background.mjs (creates transparent version)
5. Add metadata to contentCatalog.ts
6. Link to blueprint if applicable
