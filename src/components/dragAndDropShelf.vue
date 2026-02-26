<script setup lang="ts">
import {computed, onMounted, reactive, ref} from "vue";
import {useSound} from "@vueuse/sound";
import Panzoom from '@panzoom/panzoom';
import type { PanzoomObject } from '@panzoom/panzoom';
import cmToPixel from "@/plugins/helper/cmToPixel";
import {stringToColour} from "@/plugins/helper/stringToColour";
import {showSnackbar} from "@/plugins/helper/customSnackbar";
import WelcomeDialog from "@/components/dialog/welcomeDialog.vue";
import bonk from "@/assets/sounds/bonk.mp3";
import magic from "@/assets/sounds/magic.mp3";
import mine from "@/assets/sounds/mine.mp3";
import type { Shelf, Product, SelectedProduct, AlignType } from '@/types';

interface DraggedItem {
  item: Product
  index: number
  shelfIndex: number
  offsetX: number
  offsetY: number
}

interface DragPreviewState {
  x: number
  y: number
  width: number
  height: number
  ean: string
  isPhysical: boolean
  shape: string
}

const props = defineProps<{
  showAssets: boolean
}>();

interface ShelfMenuState {
  x: number
  y: number
  index: number
}

const shelf = defineModel<Shelf[]>("shelf", { required: true });
const selectedShelf = defineModel<number | ShelfMenuState | null>("selectedShelf");
const selectedProduct = defineModel<SelectedProduct | null>("selectedProduct");

const panzoomRef = ref<PanzoomObject | null>(null);
const isPanningCanva = ref(false);
const welcomeDialogRef = ref(false);
const draggedItem = ref<DraggedItem | null>(null);
const menu = ref(false);
const shelfMenu = ref(false);
const menuTarget = ref<HTMLElement | null>(null);
const currentFocus = ref<Product | null>(null);
const dragShow = ref<boolean[]>([]);
const dragPreview: DragPreviewState = reactive({x: 0, y: 0, width: 0, height: 0, ean: '', isPhysical: true, shape: 'rectangle'});

const {play: deleteSound} = useSound(bonk, {volume: 0.4, interrupt: true});
const {play: addMagicSound} = useSound(magic, {volume: 0.5, interrupt: true});
const {play: deleteShelfSound} = useSound(mine, {volume: 0.5, interrupt: true});

function getEffectiveWidth(product: { width: number; quantity?: number }): number {
  return product.width * (product.quantity ?? 1);
}

defineExpose({resetPosition, doFormatAlign} as { resetPosition: () => void; doFormatAlign: (align: AlignType, shelfIndex: number) => void });

const previewStyle = computed(() => ({
  top: `${dragPreview.y}px`,
  left: `${dragPreview.x}px`,
  width: `${dragPreview.width}px`,
  height: `${dragPreview.height}px`,
  position: 'absolute' as const,
  opacity: 0.6,
  border: dragPreview.isPhysical ? '2px solid #000' : '2px dashed #1976D2',
  pointerEvents: 'none' as const,
  borderRadius: dragPreview.shape === 'circle' ? '50%' : dragPreview.shape === 'line' ? '2px' : '4px',
  zIndex: 100,
}));

const getProductStyle = (imageItem: Product) => {
  const effectiveWidth = getEffectiveWidth(imageItem);
  const {heightPx, widthPx} = cmToPixel(imageItem.height, effectiveWidth);
  const hasImage = props.showAssets && imageItem.previewUrl;
  return {
    top: `${imageItem.y}px`,
    left: `${imageItem.x}px`,
    height: `${heightPx}px`,
    width: `${widthPx}px`,
    backgroundColor: hasImage ? 'rgba(0,0,0,0)' : (imageItem.color || stringToColour(imageItem.ean)),
    zIndex: imageItem.isPhysical ? 0 : 200,
    borderRadius: imageItem.shape === 'circle' ? '50%' : '4px',
  };
};

const getProductClasses = (imageItem: Product, itemIndex: number, shelfIndex: number) => {
  const isSelected = selectedProduct.value?.itemIndex === itemIndex && selectedProduct.value?.index === shelfIndex;
  const hasImage = props.showAssets && imageItem.previewUrl;
  return {
    'selected-product': isSelected,
    'default-border': !hasImage,
    'is-decorative': !imageItem.isPhysical
  };
};

function hasHorizontalCollision(products: Product[], indexToIgnore: number | null, newX: number, draggedWidth: number, isItemPhysical: boolean) {
  if (!isItemPhysical || !products) return false;

  const draggedStart = newX;
  const draggedEnd = newX + draggedWidth;

  return products.some((item, index) => {
    if (!item || index === indexToIgnore || item.isPhysical === false) {
      return false;
    }

    const itemWidthPx = cmToPixel(null, getEffectiveWidth(item)).widthPx;
    const itemStart = item.x;
    const itemEnd = item.x + itemWidthPx;
    return (draggedStart < itemEnd) && (draggedEnd > itemStart);
  });
}

function openShelfMenu(shelfIndex: number, event: MouseEvent) {
  menu.value = false;
  selectedShelf.value = {x: event.clientX, y: event.clientY, index: shelfIndex};
  shelfMenu.value = true;
}

function actionShelf(method: string) {
  const shelfState = selectedShelf.value as ShelfMenuState | null;
  if (method === 'delete' && shelfState) {
    shelf.value!.splice(shelfState.index, 1);
    shelfMenu.value = false;
    if (selectedProduct.value && shelfState.index === selectedProduct.value.index) {
      selectedProduct.value = null;
    }
    deleteShelfSound();
  }
}

function openMenu(index: number, shelfIndex: number, event: MouseEvent) {
  shelfMenu.value = false;
  draggedItem.value = {index, shelfIndex} as DraggedItem;
  menuTarget.value = (event.target as HTMLElement)?.closest('.menuContext') as HTMLElement | null;
  menu.value = true;
}

function action(method: string) {
  if (!draggedItem.value || !shelf.value) return;
  const shelfIdx = draggedItem.value.shelfIndex;
  const pIdx = draggedItem.value.index;
  const product = shelf.value![shelfIdx].products[pIdx];

  if (method === "delete") {
    shelf.value![shelfIdx].products.splice(pIdx, 1);
    menu.value = false;
    selectedProduct.value = null;
    deleteSound();
  } else if (method === "togglePhysics") {
    product.isPhysical = !product.isPhysical;
    menu.value = false;
  }
}

function canAddProduct(currentShelfProducts: Product[], currentShelfWidth: number, productWidth: number) {
  const widthAccumulated = currentShelfProducts.reduce((acc, p) => acc + (p.isPhysical ? getEffectiveWidth(p) : 0), 0);
  return (productWidth + widthAccumulated) > currentShelfWidth;
}

function onDragStart(item: Product, itemIndex: number, shelfIndex: number, event: DragEvent) {
  const element = (event.target as HTMLElement).closest('.image-item') || event.target as HTMLElement;
  const rect = (element as HTMLElement).getBoundingClientRect();
  const effectiveWidth = getEffectiveWidth(item);
  const {widthPx, heightPx} = cmToPixel(item.height, effectiveWidth);
  const currentScale = panzoomRef.value!.getScale();

  dragShow.value[shelfIndex] = true;
  dragPreview.width = widthPx;
  dragPreview.height = heightPx;
  dragPreview.ean = item.ean || 'decor';
  dragPreview.isPhysical = item.isPhysical !== false;
  dragPreview.shape = item.shape || 'rectangle';

  draggedItem.value = {
    item,
    index: itemIndex,
    shelfIndex,
    offsetX: (event.clientX - rect.left) / currentScale,
    offsetY: (event.clientY - rect.top) / currentScale
  };

  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  event.dataTransfer!.setDragImage(img, 0, 0);
  event.dataTransfer!.effectAllowed = 'move';
}

function doFormatAlign(align: AlignType, shelfIndex: number) {
  addMagicSound();
  const currentShelf = shelf.value![shelfIndex];
  const shelfWidth = cmToPixel(null, shelf.value![shelfIndex].width).widthPx;
  const physicalProducts = currentShelf.products.filter(p => p.isPhysical !== false);
  const sortedProducts = [...physicalProducts].sort((a, b) => a.x - b.x);

  const productsWithWidth = sortedProducts.map(product => ({
    product,
    widthPx: cmToPixel(null, getEffectiveWidth(product)).widthPx
  }));

  const totalProductsWidth = productsWithWidth.reduce((acc, item) => acc + item.widthPx, 0);
  const count = productsWithWidth.length;

  let start = 0;
  let gap = 0;

  switch (align) {
    case 'left': break;
    case 'right': start = shelfWidth - totalProductsWidth; break;
    case 'center': start = (shelfWidth - totalProductsWidth) / 2; break;
    case 'justify': if (count > 1) gap = (shelfWidth - totalProductsWidth) / (count - 1); break;
    default: return;
  }

  let position = start;
  productsWithWidth.forEach(({product, widthPx}) => {
    product.x = position;
    position += widthPx + gap;
  });
}

function onDrop(index: number, event: DragEvent, shelfHeight: number = 0) {
  if (!draggedItem.value?.item) return;

  const sourceIndex = draggedItem.value.shelfIndex;
  const sourceShelf = shelf.value![sourceIndex];
  const destShelf = shelf.value![index];
  const draggedIndex = draggedItem.value.index;
  const draggedProduct = sourceShelf.products[draggedIndex];
  const isPhysical = draggedProduct.isPhysical !== false;

  if (isPhysical) {
    if (draggedProduct.height > destShelf.height) {
      showSnackbar(`Produto muito alto para esta prateleira.`);
      return;
    }
    if (sourceIndex !== index && canAddProduct(destShelf.products, destShelf.width, getEffectiveWidth(draggedProduct))) {
      showSnackbar(`Limite atingido nesta prateleira.`);
      return;
    }
  }

  const container = event.currentTarget as HTMLElement;
  const containerRect = container.getBoundingClientRect();
  const currentScale = panzoomRef.value!.getScale();
  const mouseRelX = (event.clientX - containerRect.left) / currentScale;
  const finalX = mouseRelX - draggedItem.value.offsetX;

  const itemToIgnore = (sourceIndex === index) ? draggedIndex : null;
  const draggedWidthPx = cmToPixel(null, getEffectiveWidth(draggedItem.value.item)).widthPx
  if (isPhysical && hasHorizontalCollision(destShelf.products, itemToIgnore, finalX, draggedWidthPx, true)) {
    showSnackbar('Não é possível soltar o produto sobre outro');
    return;
  }

  const removedItem = sourceShelf.products[draggedIndex];
  removedItem.x = finalX;

  if (isPhysical) {
    removedItem.y = shelfHeight - cmToPixel(removedItem.height, null).heightPx;
  } else {
    const mouseRelY = (event.clientY - containerRect.top) / currentScale;
    removedItem.y = mouseRelY - draggedItem.value.offsetY;
    if (removedItem.y < 0) removedItem.y = 0;
  }

  let insertIndex = index;
  if (sourceIndex === index && draggedIndex < index) insertIndex--;

  sourceShelf.products.splice(draggedIndex, 1);
  destShelf.products.splice(insertIndex, 0, removedItem);

  selectedProduct.value = null;
  onDragEnd();
}

function onDragEnd() {
  draggedItem.value = null;
  dragShow.value = [];
}

const onDragOver = (event: DragEvent, shelfHeight: number, shelfIndex: number) => {
  if (!dragShow.value[shelfIndex]) {
    const newShowState = new Array(shelf.value!.length).fill(false) as boolean[];
    newShowState[shelfIndex] = true;
    dragShow.value = newShowState;
  }

  const destShelf = shelf.value![shelfIndex];
  const container = event.currentTarget as HTMLElement;
  const rect = container.getBoundingClientRect();
  const currentScale = panzoomRef.value!.getScale();

  const mouseRelX = (event.clientX - rect.left) / currentScale;
  const mouseRelY = (event.clientY - rect.top) / currentScale;

  dragPreview.x = mouseRelX - draggedItem.value!.offsetX;

  if (dragPreview.isPhysical) {
    dragPreview.y = shelfHeight - dragPreview.height;
  } else {
    dragPreview.y = mouseRelY - draggedItem.value!.offsetY;
  }
  const draggedWidthPx = cmToPixel(null, getEffectiveWidth(draggedItem.value!.item)).widthPx
  const collision = hasHorizontalCollision(destShelf.products, draggedItem.value!.index, dragPreview.x, draggedWidthPx, dragPreview.isPhysical);
  (previewStyle.value as Record<string, unknown>).backgroundColor = collision ? "#ff2c2c" : stringToColour(dragPreview.ean);
  (previewStyle.value as Record<string, unknown>).borderRadius = dragPreview.shape === 'circle' ? '50%' : '4px';
};

function onFocus(currentImage: Product) { currentFocus.value = currentImage; }
function onFocusOut() { currentFocus.value = null; }

function onMouseDown(event: MouseEvent) {
  if (event.button === 1) {
    isPanningCanva.value = true;
    panzoomRef.value!.setOptions({disablePan: true});
  }
}

function onMouseLeave() {
  isPanningCanva.value = false;
  panzoomRef.value!.setOptions({disablePan: false});
}

function resetPosition() { panzoomRef.value!.reset(); }

onMounted(() => {
  const elem = document.getElementById('canvas')!;
  panzoomRef.value = Panzoom(elem, {maxScale: 5, excludeClass: 'exclude-area'});
  elem.parentElement!.addEventListener('wheel', panzoomRef.value.zoomWithWheel);
});
</script>

<template>
  <div id="canvas" :style="{ cursor: isPanningCanva ? 'grabbing' : 'default' }" @mouseleave="onMouseLeave" @click.middle="onMouseDown">
    <template v-for="(shelfItem, index) in shelf">
      <v-sheet :class="{ 'selected': selectedShelf === index }" :width="cmToPixel(null, shelfItem.width).widthPx + 'px'" class="shelf-container pa-0 ma-0">
        <div :style="{ 'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px' }"
             class="flex-nowrap droppable-area"
             @drop="onDrop(index, $event, cmToPixel(shelfItem.height, null).heightPx)"
             @click.stop="selectedShelf = index"
             @contextmenu.prevent.stop="openShelfMenu(index, $event)"
             @dragover.prevent="onDragOver($event, cmToPixel(shelfItem.height, null).heightPx, index)">

          <div v-if="dragShow[index]" :style="previewStyle"></div>

          <v-menu v-model="shelfMenu" :target="[(selectedShelf as ShelfMenuState)?.x ?? 0, (selectedShelf as ShelfMenuState)?.y ?? 0]" close-on-back close-on-content-click location="end">
            <v-list class="py-0" density="compact" nav slim>
              <v-list-item density="compact" @click="actionShelf('edit')"><v-list-item-title>Editar Prateleira</v-list-item-title></v-list-item>
              <v-list-item density="compact" @click="actionShelf('delete')"><v-list-item-title>Deletar Prateleira</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>

          <div v-for="(imageItem, itemIndex) in shelfItem.products" :key="itemIndex"
               :class="getProductClasses(imageItem, itemIndex, index)"
               :style="getProductStyle(imageItem)"
               class="position-absolute cursor-move image-item menuContext exclude-area product-transition"
               draggable="true" tabindex="0"
               @focus="onFocus(imageItem)"
               @focusout="onFocusOut"
               @click.stop="selectedProduct = {imageItem, index, itemIndex}"
               @dragstart.stop="onDragStart(imageItem, itemIndex, index, $event)"
               @dragend.stop="onDragEnd"
               @contextmenu.prevent.stop="openMenu(itemIndex, index, $event)">

            <div v-if="showAssets && imageItem.previewUrl" class="d-flex h-100">
              <v-img v-for="q in (imageItem.quantity ?? 1)" :key="q" :src="imageItem.previewUrl" cover
                     :style="{ width: `${100 / (imageItem.quantity ?? 1)}%`, flexShrink: 0 }" />
            </div>
            <div v-else-if="!imageItem.previewUrl" class="d-flex h-100">
              <div v-for="q in (imageItem.quantity ?? 1)" :key="q"
                   :style="{'font-size': imageItem?.dimensions?.fontSize ? imageItem.dimensions.fontSize : '0pt', 'line-height': '1.1', width: `${100 / (imageItem.quantity ?? 1)}%`}"
                   class="d-flex align-center justify-center text-center h-100">
                {{ imageItem.text || imageItem.title || 'Item' }}
              </div>
            </div>
          </div>

          <v-menu v-model="menu" :target="menuTarget ?? undefined" close-on-back close-on-content-click location="end">
            <v-list class="py-0" density="compact" nav slim>
              <v-list-item density="compact" @click="action('togglePhysics')">
                <v-list-item-title class="d-flex align-center">
                  <v-icon :icon="shelf![draggedItem?.shelfIndex ?? 0]?.products[draggedItem?.index ?? 0]?.isPhysical ? 'mdi-cube-outline' : 'mdi-ghost'" class="mr-2" size="small"></v-icon>
                  {{ shelf![draggedItem?.shelfIndex ?? 0]?.products[draggedItem?.index ?? 0]?.isPhysical ? 'Tornar Decorativo' : 'Tornar Físico' }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item density="compact" @click="action('edit')"><v-list-item-title>Editar</v-list-item-title></v-list-item>
              <v-list-item color="error" density="compact" @click="action('delete')"><v-list-item-title>Excluir</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>
        </div>
        <v-divider :color="shelfItem.color" :thickness="cmToPixel(shelfItem.tickness, null).heightPx" class="border-opacity-100" variant="solid"/>
      </v-sheet>
    </template>
  </div>
  <welcome-dialog v-model="welcomeDialogRef"/>
</template>

<style scoped>
.image-item { transition: box-shadow 0.2s; }
.droppable-area { position: relative; }
.shelf-container {
  border: 2px solid #e0e0e0;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
}
.shelf-container:hover {
  border-color: #bdbdbd;
  background-color: #fafafa;
}
.shelf-container.selected {
  border-color: #1976D2;
  background-color: rgba(25, 118, 210, 0.08);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);
  z-index: 2;
}
.product-transition {
  transition: border-color 0.1s ease-in-out, box-shadow 0.1s;
  box-sizing: border-box;
}
.default-border { border: 3px solid black; }
.is-decorative {
  border-style: solid !important;
  opacity: 0.9;
}
.selected-product {
  border: 3px solid #1867C0 !important;
  background-color: rgba(24, 103, 192, 0.1) !important;
  z-index: 100 !important;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
</style>
