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

---

## TypeScript Migration Plan

### Overview

Migração incremental de JavaScript para TypeScript. O projeto já suporta `.ts/.tsx` no `vite.config.mjs`. A estratégia é bottom-up: tipos primeiro, helpers depois, componentes por último.

### Phase 1 — Setup & Configuration

1. **Instalar dependências TypeScript**
   ```bash
   npm install -D typescript vue-tsc @tsconfig/node20
   ```

2. **Criar `tsconfig.json`** (substituindo `jsconfig.json`)
   ```jsonc
   {
     "compilerOptions": {
       "target": "ES2020",
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "moduleResolution": "bundler",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "skipLibCheck": true,
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "sourceMap": true,
       "baseUrl": "./",
       "paths": { "@/*": ["./src/*"] }
     },
     "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue", "env.d.ts"],
     "exclude": ["node_modules"]
   }
   ```

3. **Criar `env.d.ts`** na raiz
   ```ts
   /// <reference types="vite/client" />
   declare module '*.vue' {
     import type { DefineComponent } from 'vue'
     const component: DefineComponent<{}, {}, any>
     export default component
   }
   ```

4. **Atualizar `package.json` scripts**
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vue-tsc --noEmit && vite build",
       "preview": "vite preview",
       "type-check": "vue-tsc --noEmit"
     }
   }
   ```

5. **Renomear `vite.config.mjs` → `vite.config.ts`** e ajustar imports

6. **Deletar `jsconfig.json`**

### Phase 2 — Definir Tipos Base (`src/types/`)

Criar `src/types/index.ts` com as interfaces do domínio:

```ts
// --- Product & Shelf (runtime) ---
export interface Product {
  title: string
  ean: string
  previewUrl?: string
  height: number
  width: number
  depth: number
  color?: string
  x: number
  y: number
  isPhysical: boolean
  type?: 'decorative'
  shape?: 'circle' | 'rectangle' | 'line'
  position?: number
  quantity?: number
  stackable?: boolean
  // decorative extras
  fillColor?: string
  borderColor?: string
  text?: string
  fontSize?: number
}

export interface Shelf {
  mobiliaryElement: string
  height: number
  width: number
  depth: number
  tickness: number
  color: string
  products: Product[]
}

export interface SelectedProduct {
  imageItem: Product
  index: number        // shelf index
  itemIndex: number    // product index within shelf
}

// --- Drag Preview ---
export interface DragPreview {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  shelfIndex: number
  hasCollision: boolean
  isPhysical: boolean
  shape?: Product['shape']
  color?: string
  previewUrl?: string
}

// --- Database schemas ---
export interface DatabaseProduct {
  id: number
  title: string
  label: 'category' | 'product'
  children?: DatabaseProduct[]
  previewUrl?: string
  ean?: string
  height?: number
  width?: number
  depth?: number
}

export interface DecorativeElementPreset {
  title: string
  color: string
  isPhysical: boolean
  dimensions: {
    width: number
    height: number
    fontSize?: number
  }
}

// --- Snackbar ---
export interface SnackbarState {
  show: boolean
  color: string
  text: string | null
}

// --- Alignment ---
export type AlignType = 'left' | 'right' | 'center' | 'justify'
```

### Phase 3 — Migrar Helper Utilities

Ordem de migração (sem dependências entre si):

| # | Arquivo                          | Mudanças principais |
|---|----------------------------------|---------------------|
| 1 | `cmToPixel.js` → `.ts`          | Tipar parâmetros `(height: number \| null, width: number \| null)` e retorno `{ heightPx: number, widthPx: number }` |
| 2 | `customSnackbar.js` → `.ts`     | Usar `Reactive<SnackbarState>`, tipar `showSnackbar(text: string, color?: string): void` |
| 3 | `stringToColour.js` → `.ts`     | Tipar `hslToHex(h: number, s: number, l: number): string` e `stringToColour(str: string \| null \| undefined): string \| undefined` |

### Phase 4 — Migrar Plugin Files

| # | Arquivo                  | Mudanças principais |
|---|--------------------------|---------------------|
| 1 | `plugins/vuetify.js` → `.ts` | Import types de `vuetify`, tipar `createVuetify()` |
| 2 | `plugins/index.js` → `.ts`   | Tipar `registerPlugins(app: App): void` |
| 3 | `main.js` → `main.ts`        | Atualizar import em `index.html` (`/src/main.ts`) |

### Phase 5 — Migrar Componentes Vue (`<script setup lang="ts">`)

Ordem de migração (dos mais simples para os mais complexos):

| # | Componente | Complexidade | Mudanças principais |
|---|------------|-------------|---------------------|
| 1 | `CustomSnackbar.vue` | Baixa | Adicionar `lang="ts"`, tipar `defineModel<boolean>()` |
| 2 | `AppFooter.vue` | Baixa | Apenas `lang="ts"` |
| 3 | `loadingState.vue` | Baixa | Apenas `lang="ts"` |
| 4 | `resultDialog.vue` | Baixa | `defineModel<boolean>()`, tipar props com `Product[]` e `Shelf[]` |
| 5 | `editShelfDialog.vue` | Baixa | Tipar props e emit |
| 6 | `editProductDialog.vue` | Baixa | Tipar props e emit |
| 7 | `addProductDialog.vue` | Média | Tipar form data, props (`Shelf`, `number`), emit com `Product[]` |
| 8 | `addDecorativeElementDialog.vue` | Média | Tipar shape/color form, emit com `Product` |
| 9 | `importProductDialog.vue` | Média | Tipar `headerTranslateMap`, exceljs row parsing, emit com `DatabaseProduct[]` |
| 10 | `welcomeDialog.vue` | Média | Tipar gsap refs, `defineModel<boolean>()` |
| 11 | `dragAndDropShelf.vue` | Alta | Tipar `DragPreview`, `defineModel<Shelf[]>`, event handlers (`DragEvent`), Panzoom instance, `hasHorizontalCollision()`, `doFormatAlign(align: AlignType, shelfIndex: number)` |
| 12 | `Definitive.vue` | Alta | Tipar todos os refs (`Ref<Shelf[]>`, `Ref<SelectedProduct \| null>`), todas as funções (`addProduct`, `addShelf`, `validateProduct`), template refs (`InstanceType<typeof DragAndDropShelf>`) |

### Phase 6 — Limpeza & Validação

1. **Rodar `vue-tsc --noEmit`** e corrigir todos os erros
2. **Remover componentes Example*.vue** (se não utilizados)
3. **Testar manualmente** todas as funcionalidades:
   - Adicionar/editar/deletar prateleiras
   - Arrastar produtos (físicos e decorativos)
   - Importar Excel
   - Zoom/pan no canvas
   - Context menus (botão direito)
   - Ctrl+K (debug dialog)
4. **Rodar `npm run build`** e verificar build de produção

### Notas Importantes

- **Migração incremental**: cada fase pode ser commitada separadamente. Vue/Vite suportam `.ts` e `.js` coexistindo.
- **`strict: true`** desde o início para máximo benefício. Se gerar muitos erros, pode-se usar `// @ts-expect-error` temporariamente em casos complexos do Vuetify.
- **Vuetify auto-import**: `unplugin-vue-components` continua funcionando com TypeScript sem alterações.
- **JSON imports**: `resolveJsonModule: true` no tsconfig permite imports diretos de `products.json` e `decorativeElement.json`.
- **Sem necessidade de `@types/`** para as deps atuais: Vue 3, Vuetify 3, @vueuse/core e gsap já incluem tipos.