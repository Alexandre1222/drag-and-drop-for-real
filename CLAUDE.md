# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

There are no test or lint scripts configured.

## Architecture Overview

**Planoghini** is a planogram editor — a drag-and-drop tool for arranging products on retail shelves. The app is written in Portuguese (pt-BR).

### Stack

- **Vue 3** (Composition API with `<script setup>`) + **Vuetify 3** (UI components)
- **Vite** with `unplugin-vue-components` (auto-imports Vuetify components)
- **@panzoom/panzoom** for canvas zoom/pan
- **@vueuse/sound** for UI sound effects
- **exceljs** for Excel product import
- Path alias `@` → `src/`

### Core Components

**`src/components/Definitive.vue`** — Main application shell. Owns all state:
- `shelf` array — list of shelf objects, each with `{ height, width, tickness, color, products[] }`
- `productList` and `decorativeElementList` — loaded from JSON databases on mount
- `selectedShelf` / `selectedProduct` — currently focused items
- Manages adding/validating products and decorative elements, shelf CRUD, and keyboard shortcut (Ctrl+K opens debug dialog)
- Renders: toolbar, left sidebar (product/decor library), canvas area, right properties panel

**`src/components/dragAndDropShelf.vue`** — The canvas component. Uses HTML5 drag-and-drop API + Panzoom:
- Receives `shelf`, `selectedShelf`, `selectedProduct` as `defineModel()` bindings
- Handles `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd` with live preview (`dragPreview` reactive object)
- Implements `hasHorizontalCollision()` to prevent physical products overlapping
- Exposes `resetPosition()` and `doFormatAlign(align, shelfIndex)` for toolbar actions
- Middle-click pans; scroll-wheel zooms (via Panzoom `excludeClass: 'exclude-area'` to prevent panning draggable items)
- Right-click context menus for shelf and product actions

### Key Concepts

**Physical vs. Decorative items** (`isPhysical` flag):
- Physical items (`isPhysical: true`) respect shelf width limits and participate in collision detection. They snap to the shelf floor (y = shelfHeight - productHeight).
- Decorative items (`isPhysical: false`) can be freely positioned anywhere on the shelf (y follows mouse position during drag).

**Coordinate system**: All dimensions are stored in **cm** in the data model and converted to pixels for rendering using `cmToPixel()`. The conversion rate is **8px per cm** (`src/plugins/helper/cmToPixel.js`).

**Product data shape** (in `shelf[n].products[]`):
```js
{
  title, ean, previewUrl, height, width, depth, color,
  x,          // pixel offset from shelf left
  y,          // pixel offset from shelf top
  isPhysical, // bool
  type,       // 'decorative' or undefined for products
  shape,      // 'circle' | 'rectangle' | 'line' (decorative only)
}
```

### Helper Utilities (`src/plugins/helper/`)

- **`cmToPixel.js`** — `cmToPixel(heightCm, widthCm)` → `{ heightPx, widthPx }`. Pass `null` for the dimension you don't need.
- **`customSnackbar.js`** — Global reactive snackbar. Call `showSnackbar(text, color?)` from anywhere; `snackbarState` is bound in `App.vue`.
- **`stringToColour.js`** — Deterministic hex color from a string (used to color products by EAN when no image).

### Static Databases (`src/plugins/database/`)

- **`products.json`** — Hierarchical product catalog. Top-level items have `label: 'category'` and a `children` array. Leaf items have `label: 'product'` with `{ ean, height, width, depth, previewUrl }` in cm.
- **`decorativeElement.json`** — Flat list of decorative presets with `{ title, color, isPhysical, dimensions: { width, height, fontSize } }`.

### Dialog Components (`src/components/dialog/`)

Each dialog uses `defineModel()` for open/close state:
- **`addProductDialog.vue`** — Manual product form, emits `save-product`
- **`addDecorativeElementDialog.vue`** — Decorative element builder (shape, fill color, border color, text), emits `save-decorative-element`
- **`importProductDialog.vue`** — Parses `.xlsx` via exceljs, maps Portuguese column headers to English keys via `headerTranslateMap`, emits `update-products`
- **`editShelfDialog.vue`** / **`editProductDialog.vue`** — Edit existing items
- **`resultDialog.vue`** — Debug view (Ctrl+K) showing raw `products` and `shelf` state
- **`welcomeDialog.vue`** — Shown on first canvas load