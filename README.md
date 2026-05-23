# Animate.dev

> A library of web animations you can copy-paste into your favorite AI coding tool.

Every animation on Animate.dev ships with a single artifact: a **prompt**. Paste it into Claude Code, Cursor, v0, Lovable, or Bolt — and the AI regenerates the effect in your codebase. The video shows the result. The prompt makes it yours.

---

## Why this exists

Most animation showcases give you a CodePen link and wish you luck. That works if you write your own React. It does not work if you live in v0 / Lovable / Bolt, where copying a CodePen and praying is a recipe for half-broken output.

Animate.dev treats the prompt as the deliverable. Each entry is written to drop cleanly into a low-code AI tool — single file, named props, mental-model section, tweak knobs. The video proves it works; the prompt is the install.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Astro 6** | Static-first, zero JS by default, fast |
| CMS | **Sanity v3** (self-hosted Studio at `studio-animate.dev/`) | Project entries, video uploads, prompts as `text` |
| Styling | **Tailwind CSS v4** | The `@import "tailwindcss"` flavor |
| Content | **Astro Content Collections** (`src/content/`) + **Sanity** (projects) | Static markdown for blog/legal/sites; Sanity for the live project library |
| Hosting | Anywhere static (Vercel / Netlify / Cloudflare Pages) | Sanity CDN serves videos directly |

---

## Quick start

```bash
git clone https://github.com/smammar100/Anemateit.git
cd Anemateit
npm install

# Astro frontend
cp .env.example .env.local        # fill in your Sanity project ID + token
npm run dev                       # → http://localhost:4321

# Sanity Studio (in a second terminal)
cd studio-animate.dev
npm install
npm run dev                       # → http://localhost:3333
```

Required env vars (see `.env.example`):

```ini
PUBLIC_SANITY_PROJECT_ID=tgexqefn
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2025-01-01
SANITY_API_TOKEN=                 # only needed for the upload scripts
```

---

## Architecture

```
.
├── src/                          # Astro frontend
│   ├── pages/
│   │   ├── index.astro           # Homepage — project grid pulled from Sanity
│   │   └── projects/[slug].astro # Detail page — split layout, copy-prompt UX
│   ├── lib/
│   │   ├── sanity.ts             # Client + urlFor + fileUrl helpers
│   │   ├── queries.ts            # GROQ queries (getAllProjects, getProjectBySlug, …)
│   │   └── types.ts              # Project, Slug, ThumbnailType
│   └── content/                  # Astro Collections (blog, legal, sites, store)
│
├── studio-animate.dev/           # Embedded Sanity Studio
│   └── schemaTypes/project.ts    # Project schema definition
│
├── prompts/                      # Canonical copy-prompt source files
│   ├── 3d-perspective-highlight.md
│   ├── 3d-perspective-highlight.meta.json   # technologies array, etc.
│   └── liquid-reveal-hero.md
│
└── scripts/                      # Sanity write utilities
    ├── createLandoEntry.mjs      # One-off: create a project entry with uploaded video
    ├── syncPrompts.mjs           # Patch all entries from prompts/<slug>.md (+ .meta.json)
    ├── updateLandoPrompt.mjs     # Patch a single entry's copyPrompt
    ├── listProjects.mjs          # Quick inspector
    └── inspectVideo.mjs          # See which video asset a project references
```

---

## Current projects

| Title | Technique | Source |
|---|---|---|
| **3D Perspective Highlight** | CSS `perspective` + `transform-style: preserve-3d` + per-frame lerp of two CSS custom properties (`--rx`, `--ry`, `--lift`). Inline highlight spans read `--lift` to drive translate + box-shadow in opposite directions. | [CodePen](https://codepen.io/smammar14/pen/VYmbVzK) |
| **Liquid Reveal Hero** | SVG `feGaussianBlur` + `feColorMatrix` "goo" filter merging four spring-trailed `<circle>` elements into a single organic blob, used as a CSS `mask` on the reveal image. Inspired by landonorris.com (OFF+BRAND). | [GitHub (reference)](https://github.com/BrunoCarvalhoFeitosa/lando-norris) |

Each entry ships with the same template structure: a one-line goal, install command, drop-in component, a "how it works" mental model, a tweak-knobs table, accessibility notes.

---

## Adding a new project

1. **Build the standalone** — a separate Vite/Next.js project that demonstrates the effect at full quality. Get it on Vercel or GitHub Pages.
2. **Record a 5–10s loop** at 1920×1080, export as MP4 (target <12MB) — same playback shape as the existing entries.
3. **Write the prompt** in `prompts/<slug>.md` using the [template](#prompt-template). Optional sidecar `prompts/<slug>.meta.json` for technologies, viewCodeUrl, etc.
4. **Upload the video** through Sanity Studio at `localhost:3333` (Project → New → Thumbnail Type: Video → drag MP4 in).
5. **Run the sync script** — pushes the prompt + meta into the existing Sanity doc:
   ```bash
   node scripts/syncPrompts.mjs
   ```
6. **Verify** — open `localhost:4321/projects/<slug>`. Video plays, prompt copies, View Code link works.

### Prompt template

Every prompt in `prompts/` follows the same shape. This is what makes them v0/Lovable/Bolt-friendly:

```markdown
# <Effect name>

<One-paragraph goal — what this is, what stack it targets.>

**Stack:** React + Tailwind + <library>. Drop-in single file.

## Install
\`\`\`bash
npm i <whatever>
\`\`\`

## Component (paste into `components/<Name>.tsx`)
\`\`\`tsx
'use client';
// … the whole component, one file, named props
\`\`\`

## Use it
\`\`\`tsx
<Component prop="…" />
\`\`\`

## How it works (mental model)
1. <One sentence per step. Aim for 3–5 steps.>

## Tweak knobs
| Want | Change |
|---|---|
| Bigger / smaller | `<prop>` |
| Faster / slower | `<prop>` |

## Accessibility
- Reduced motion: <what happens>
- Touch / no-cursor: <what happens>
```

---

## Scripts reference

| Command | Purpose |
|---|---|
| `npm run dev` | Astro dev server on `:4321` |
| `npm run build` | Build static site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `node scripts/listProjects.mjs` | List all Sanity project entries with prompt lengths |
| `node scripts/syncPrompts.mjs` | Push every `prompts/<slug>.md` (+ `.meta.json`) to its Sanity doc |
| `node scripts/inspectVideo.mjs <slug>` | See which video asset a project references |
| `node scripts/dumpPrompt.mjs <slug>` | Dump a Sanity project's current prompt to a local file |

---

## Copy-prompt UX

The detail page renders the prompt in a scrollable `<pre>` with a bottom fade gradient (`linear-gradient(to top, var(--color-base-50), transparent)`) that auto-hides once the user scrolls to the end. Both the inline "Copy" icon and the main "Copy Prompt" button share a single click handler that:

1. Tries `navigator.clipboard.writeText`
2. Falls back to a hidden `<textarea>` + `document.execCommand('copy')` for non-secure contexts
3. Swaps the button label to "Copied ✓" for 2s
4. Shows a toast: *"Prompt copied — paste into Claude Code, Cursor, v0, or Lovable"*
5. Logs `[animate.dev] prompt_copied` for analytics

The whole thing is data-driven via `data-prompt` attributes — no per-project JS.

---

## Deployment notes

- `dist/` is the build output. Drop it on any static host.
- Sanity videos are served from `cdn.sanity.io` with a 1-year `Cache-Control`. They never hit your server.
- `.env.local` is gitignored. Set `SANITY_API_TOKEN` on the host **only** if you run the sync scripts in CI; the Astro build itself only needs the public project ID + dataset.
- Re-run the build whenever you publish a Sanity change. (Or set up a webhook from Sanity → your host's deploy trigger.)

---

## Acknowledgments

- Built on top of the [Lexington Carbon](https://lexingtonthemes.com/templates/carbon) Astro theme — kept the design tokens (`--color-base-*`), wrapper grid, and typography scale.
- Sanity Studio scaffolded via `npm create sanity@latest`.
- Liquid Reveal Hero technique credit: [Bruno Carvalho Feitosa's open-source recreation](https://github.com/BrunoCarvalhoFeitosa/lando-norris) of the landonorris.com hero (OFF+BRAND, Awwwards SOTD).

---

## License

UNLICENSED — private project. If you want to reuse any of the prompts or scaffolding, open an issue.
