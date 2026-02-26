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
  label?: string
  position?: number
  quantity?: number
  stackable?: boolean
  // decorative extras
  fillColor?: string
  borderColor?: string
  text?: string
  fontSize?: number
  dimensions?: { width?: number; height?: number; fontSize?: string }
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
