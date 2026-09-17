# 3D Periodic Table

An interactive 3D periodic table built with **Three.js** and **Vite**. Every element floats as a movable 3D block labeled with its atomic number, symbol and name, holding a miniature atom with a nucleus and orbiting electrons. Click a block to open a detail viewer with discovery info and facts.

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## Project layout

```
index.html                 Entry HTML: #loader loading screen, #app canvas mount,
                           #legend, #search-box, #random button, #panel info
vite.config.js             Vite + Vitest config (unit tests, node environment)
vitest.e2e.config.js       Vitest config for Playwright end-to-end tests
package.json               Scripts: dev, build, test, test:e2e

src/
├── main.js                Orchestrator: wires SceneManager, HUD, PeriodicTable
│                          and the UI events (hover, click, search, category,
│                          random picker, loader hide).
├── style.css              All UI/loading-screen styling (incl. mobile rules).
├── data/                  Pure data (no Three.js — safe to unit test):
│   ├── elementData.js     ELEMENT_DATA: 118 elements (number/symbol/name,
│   │                      period/group, neutrons, shells, category) +
│   │                      CATEGORY_COLORS: 10 category → 0xRRGGBB colors.
│   └── elementFacts.js    ELEMENT_HISTORY: per-element discovery + fun fact.
├── three/
│   └── SceneManager.js    Scene, PerspectiveCamera, WebGLRenderer, OrbitControls,
│                          lights, flyTo animation, resize handling, main loop.
├── ui/
│   └── HUD.js             Builds the legend from CATEGORY_COLORS; exposes
│                          onCategoryClick and setActiveCategory; info panel
│                          updates for hovered elements.
└── world/                 The 3D entities:
    ├── PeriodicTable.js   Container group + all 118 ElementBlocks; raycasting
    │                      (getBlockAt), hover tracking, category filter/
    │                      highlight/dim, category-center math for camera fly.
    ├── ElementBlock.js    A labeled glass cube: BoxGeometry with per-face
    │                      material + a canvas label texture, wireframe outline,
    │                      an embedded Atom, and visual states (hover/dim/highlight).
    ├── Atom.js            Sub-atomic model per element: protons/neutrons as an
    │                      InstancedMesh nucleus, electrons placed on scaleable
    │                      TorusGeometry shell rings, all from element.shells.
    └── ElementViewer.js   DOM overlay opened on click: name, symbol, category,
                          stats, discovery year + fun fact from ELEMENT_HISTORY.

tests/
├── elementData.test.js    Data integrity: 118 elements, unique symbols/names,
│                          valid period/group, categories & color values.
├── elementFacts.test.js   Every element has discovery + fact entries.
├── periodicTable.test.js  Block creation/positioning, raycast hit, hover,
│                          category filter/clear — with three mocks.
├── atom.test.js           Nucleus/shell construction & instancing — three mocks.
└── app.e2e.test.js        Playwright: app boots, loader hides, scene + UI appear;
                          search → fly → click block → viewer opens/closes.
```

## How it works

**Layout.** Each block is positioned by its element's (period, group) on an
invisible grid: `x = (group − 10) × 1.4`, `y = (5 − period) × 1.4`. Lanthanides
and actinides live off-grid as both *57–71 / 89–103*, so unused cells simply
have no block.

**Scene & camera.** `SceneManager` owns the camera flying between positions via
`flyTo()` (a 700 ms cubic-eased lerp of camera position + orbit target) and runs
an `requestAnimationFrame` loop that updates controls, flies and active views
(the element viewer is swapped in by `setView`).

**Interaction.**
- *Hover* — pointer moves are converted to NDC and raycast onto block cubes; the
  hit block scales up and the HUD info panel is updated.
- *Click* — flies to the block, then swaps the scene to an `ElementViewer`
  overlay showing stats and facts; clicking × restores the table.
- *Search* — filters `ELEMENT_DATA` by name/symbol prefix or atomic number
  (top 8), keyboard-navigable (↑/↓/Enter/Esc), and flying to a result.
- *Category filter* — clicking a legend swatch dims every other category,
  highlights matches, and flies the camera to the category's centroid; clicking
  again clears the filter.
- *Random* — picks a random element and flies to it.

**Rendering of atoms.** `Atom` uses `InstancedMesh` for performance: protons +
neutrons are randomized spheres inside the nucleus (one instance per nucleon),
electrons are placed along `TorusGeometry` shell rings with one instance per
electron. All sizes scale from the `shells` array in the element data.

## Testing

```bash
npm test            # unit tests (Vitest, node environment) — 33 tests
npm run test:watch  # re-run unit tests on change
npm run test:e2e    # end-to-end tests (Playwright via Vitest) — boots a
                    # real Vite server on port 5198 and drives Chromium
```

E2E requires a Playwright browser once (`npx playwright install chromium`).
The unit tests mock `three` and `ElementBlock` so they never touch a WebGL
context.