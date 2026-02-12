<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useSound } from "@vueuse/sound";
import Panzoom from '@panzoom/panzoom';
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import { stringToColour } from "@/plugins/helper/stringToColour.js";
import { showSnackbar } from "@/plugins/helper/customSnackbar.js";
import WelcomeDialog from "@/components/dialog/welcomeDialog.vue";
import bonk from "@/assets/sounds/bonk.mp3";
import magic from "@/assets/sounds/magic.mp3";
import mine from "@/assets/sounds/mine.mp3";

const props = defineProps({
  showAssets: { default: false, required: true }
});

const shelf = defineModel("shelf");
const selectedShelf = defineModel("selectedShelf");
const selectedProduct = defineModel("selectedProduct");

const panzoomRef = ref(null);
const isPanningCanva = ref(false);
const welcomeDialogRef = ref(false);
const draggedItem = ref(null);
const menu = ref(false);
const shelfMenu = ref(false);
const menuTarget = ref(null);
const currentFocus = ref(null);
const dragShow = ref([]);
const dragPreview = reactive({ x: 0, y: 0, width: 0, height: 0, ean: '' });

const { play: deleteSound } = useSound(bonk, { volume: 0.4, interrupt: true });
const { play: addMagicSound } = useSound(magic, { volume: 0.5, interrupt: true });
const { play: deleteShelfSound } = useSound(mine, { volume: 0.5, interrupt: true });

defineExpose({ resetPosition, doFormatAlign });

const previewStyle = computed(() => ({
  top: `${dragPreview.y}px`,
  left: `${dragPreview.x}px`,
  width: `${dragPreview.width}px`,
  height: `${dragPreview.height}px`,
  position: 'absolute',
  opacity: 0.4,
  border: '2px dashed #000',
  pointerEvents: 'none',
  borderRadius: '4px'
}));

const getProductStyle = (imageItem) => {
  const { heightPx, widthPx } = cmToPixel(imageItem.height, imageItem.width);
  const hasImage = props.showAssets && imageItem.previewUrl;
  return {
    top: `${imageItem.y}px`,
    left: `${imageItem.x}px`,
    height: `${heightPx}px`,
    width: `${widthPx}px`,
    backgroundColor: hasImage ? 'transparent' : stringToColour(imageItem.ean)
  };
};

const getProductClasses = (imageItem, itemIndex, shelfIndex) => {
  const isSelected = selectedProduct.value?.itemIndex === itemIndex && selectedProduct.value?.index === shelfIndex;
  const hasImage = props.showAssets && imageItem.previewUrl;
  return {
    'selected-product': isSelected,
    'default-border': !hasImage
  };
};

function hasHorizontalCollision(products, itemToIgnore, newX) {
  if (!products) return false;
  const draggedStart = newX;
  const draggedEnd = newX + dragPreview.width;

  return products.some(item => {
    if (!item || (itemToIgnore && item === itemToIgnore)) return false;
    const itemWidthPx = cmToPixel(null, item.width).widthPx;
    const itemStart = item.x;
    const itemEnd = item.x + itemWidthPx;
    return draggedStart < itemEnd && draggedEnd > itemStart;
  });
}

function openShelfMenu(shelfIndex, event) {
  menu.value = false;
  selectedShelf.value = { x: event.clientX, y: event.clientY, index: shelfIndex };
  shelfMenu.value = true;
}

function actionShelf(method) {
  if (method === 'delete') {
    shelf.value.splice(selectedShelf.value.index, 1);
    shelfMenu.value = false;
    if (selectedProduct.value && selectedShelf.value.index === selectedProduct.value.index) {
      selectedProduct.value = null;
    }
    deleteShelfSound()
  }
}

function openMenu(index, shelfIndex, event) {
  shelfMenu.value = false;
  draggedItem.value = { index, shelfIndex };
  menuTarget.value = event.target.closest('.menuContext');
  menu.value = true;
}

function action(method) {
  if (method === "delete") {
    shelf.value[draggedItem.value.shelfIndex].products.splice(draggedItem.value.index, 1);
    menu.value = false;
    deleteSound();
  } else {
    console.warn("method not recognized");
  }
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  const widthAccumulated = currentShelfProducts.reduce((acc, p) => acc + p.width, 0);
  return (productWidth + widthAccumulated) > currentShelfWidth;
}

function onDragStart(item, itemIndex, shelfIndex, event) {
  const element = event.target.closest('.image-item') || event.target;
  const rect = element.getBoundingClientRect();
  const { widthPx, heightPx } = cmToPixel(item.height, item.width);
  const currentScale = panzoomRef.value.getScale();

  dragShow.value[shelfIndex] = true;
  dragPreview.width = widthPx;
  dragPreview.height = heightPx;
  dragPreview.ean = item.ean;

  draggedItem.value = {
    item,
    index: itemIndex,
    shelfIndex,
    offsetX: (event.clientX - rect.left) / currentScale,
    offsetY: (event.clientY - rect.top) / currentScale
  };
  event.dataTransfer.effectAllowed = 'move';
}

function doFormatAlign(align, shelfIndex) {
  addMagicSound();
  const currentShelf = shelf.value[shelfIndex];
  const shelfWidth = cmToPixel(null, shelf.value[shelfIndex].width).widthPx;
  const sortedProducts = [...currentShelf.products].sort((a, b) => a.x - b.x);

  const productsWithWidth = sortedProducts.map(product => ({
    product,
    widthPx: cmToPixel(null, product.width).widthPx
  }));

  const totalProductsWidth = productsWithWidth.reduce((acc, item) => acc + item.widthPx, 0);
  const count = productsWithWidth.length;

  let start = 0;
  let gap = 0;

  switch (align) {
    case 'left': break;
    case 'right': start = shelfWidth - totalProductsWidth; break;
    case 'center': start = (shelfWidth - totalProductsWidth) / 2; break;
    case 'justify':
      if (count > 1) gap = (shelfWidth - totalProductsWidth) / (count - 1);
      break;
    default:
      showSnackbar(`método não criado ainda para o ${align}`);
      return;
  }

  let position = start;
  productsWithWidth.forEach(({ product, widthPx }) => {
    product.x = position;
    position += widthPx + gap;
  });
}

function onDrop(index, event, shelfHeight = 0) {
  if (!draggedItem.value.item) return;

  const sourceIndex = draggedItem.value.shelfIndex;
  const sourceShelf = shelf.value[sourceIndex];
  const destShelf = shelf.value[index];
  const draggedIndex = draggedItem.value.index;
  const draggedProduct = sourceShelf.products[draggedIndex];

  if (draggedProduct.height > destShelf.height) {
    showSnackbar(`Opa maninho, o produto tem ${draggedProduct.height}cm de altura e a estante tem ${destShelf.height}cm, não rola né`);
    return;
  }

  if (sourceIndex !== index && canAddProduct(destShelf.products, destShelf.width, draggedProduct.width)) {
    showSnackbar(`Limite atingido não é possivel adicionar mais produtos`);
    return;
  }

  const container = event.currentTarget;
  const containerRect = container.getBoundingClientRect();
  const currentScale = panzoomRef.value.getScale();
  const mouseRelX = (event.clientX - containerRect.left) / currentScale;
  const finalX = mouseRelX - draggedItem.value.offsetX;

  if (hasHorizontalCollision(destShelf.products, sourceIndex === index ? draggedProduct : null, finalX)) {
    showSnackbar('Não é possível soltar o produto sobre outro');
    return;
  }

  const removedItem = sourceShelf.products[draggedIndex];
  console.log(removedItem)
  if (removedItem.label === "decorative"){
  removedItem.x = mouseRelX;
  }else{
  removedItem.x = finalX;
  }
  removedItem.y = shelfHeight - cmToPixel(removedItem.height, null).heightPx;

  let insertIndex = index;
  if (sourceIndex === index && draggedIndex < index) insertIndex--;

  sourceShelf.products.splice(draggedIndex, 1);
  destShelf.products.splice(insertIndex, 0, removedItem);

  const updatePositions = (s) => s.products.forEach((item, i) => item.position = i);
  updatePositions(destShelf);
  if (sourceIndex === index) updatePositions(sourceShelf);

  selectedProduct.value = null;
  onDragEnd();
}

function onDragEnd() {
  draggedItem.value = { item: null, index: null, shelfIndex: null };
  dragShow.value = [];
}

const onDragOver = (event, shelfHeight, shelfIndex) => {
  const destShelf = shelf.value[shelfIndex];
  const rect = event.currentTarget.getBoundingClientRect();

  dragPreview.x = event.clientX - rect.left - draggedItem.value.offsetX;
  dragPreview.y = shelfHeight - dragPreview.height;

  dragShow.value.fill(false);
  dragShow.value[shelfIndex] = true;

  const itemToIgnore = draggedItem.value.shelfIndex === shelfIndex ? destShelf.products[draggedItem.value.index] : null;
  previewStyle.value.backgroundColor = hasHorizontalCollision(destShelf.products, itemToIgnore, dragPreview.x) ? "#ff2c2c" : stringToColour(dragPreview.ean);
};

function onFocus(currentImage) { currentFocus.value = currentImage; }
function onFocusOut() { currentFocus.value = null; }

function onMouseDown(event) {
  if (event.button === 1) {
    isPanningCanva.value = true;
    panzoomRef.value.setOptions({ disablePan: true });
  }
}

function onMouseLeave() {
  isPanningCanva.value = false;
  panzoomRef.value.setOptions({ disablePan: false });
}

function resetPosition() { panzoomRef.value.reset(); }

onMounted(() => {
  const elem = document.getElementById('canvas');
  panzoomRef.value = Panzoom(elem, { maxScale: 5, excludeClass: 'exclude-area' });
  elem.parentElement.addEventListener('wheel', panzoomRef.value.zoomWithWheel);
});
</script>

<template>
  <div id="canvas" @click.middle="onMouseDown" @mouseleave="onMouseLeave" :style="{ cursor: isPanningCanva ? 'grabbing' : 'default' }">
    <template v-for="(shelfItem, index) in shelf">
      <v-sheet :width="cmToPixel(null, shelfItem.width).widthPx + 'px'" class="shelf-container pa-0 ma-0" :class="{ 'selected': selectedShelf === index }">
        <div class="flex-nowrap droppable-area"
             @click.stop="selectedShelf = index"
             @contextmenu.prevent.stop="openShelfMenu(index, $event)"
             @drop="onDrop(index, $event, cmToPixel(shelfItem.height, null).heightPx)"
             @dragover.prevent="onDragOver($event, cmToPixel(shelfItem.height, null).heightPx, index)"
             :style="{ 'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px' }">

          <v-menu v-model="shelfMenu" location="end" :target="[selectedShelf?.x ?? 0, selectedShelf?.y ?? 0]" close-on-back close-on-content-click>
            <v-list class="py-0" density="compact" slim nav>
              <v-list-item density="compact" @click="actionShelf('edit')"><v-list-item-title>Editar Prateleira</v-list-item-title></v-list-item>
              <v-list-item density="compact" @click="actionShelf('delete')"><v-list-item-title>Deletar Prateleira</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>

          <div v-for="(imageItem, itemIndex) in shelfItem.products" :key="itemIndex"
               class="position-absolute cursor-move image-item menuContext exclude-area product-transition"
               :class="getProductClasses(imageItem, itemIndex, index)"
               :style="getProductStyle(imageItem)"
               draggable="true" tabindex="0"
               @click.stop="selectedProduct = {imageItem, index, itemIndex}"
               @dragstart.stop="onDragStart(imageItem, itemIndex, index, $event)"
               @dragend.stop="onDragEnd"
               @drop="onDragEnd"
               @contextmenu.prevent.stop="openMenu(itemIndex, index, $event)"
               @focus="onFocus(imageItem)"
               @focusout="onFocusOut">
            <v-img v-if="showAssets" :src="imageItem?.previewUrl" />
          </div>

          <v-menu v-model="menu" location="end" :target="menuTarget" close-on-back close-on-content-click>
            <v-list class="py-0" density="compact" slim nav>
              <v-list-item density="compact" @click="action('edit')"><v-list-item-title>Editar</v-list-item-title></v-list-item>
              <v-list-item density="compact" @click="action('delete')"><v-list-item-title>Excluir</v-list-item-title></v-list-item>
            </v-list>
          </v-menu>
        </div>
        <v-divider :thickness="cmToPixel(shelfItem.tickness, null).heightPx" :color="shelfItem.color" variant="solid" class="border-opacity-100" />
      </v-sheet>
    </template>
  </div>
  <welcome-dialog v-model="welcomeDialogRef" />
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
.selected-product {
  border: 3px solid #1867C0 !important;
  background-color: rgba(24, 103, 192, 0.1) !important;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}
</style>
