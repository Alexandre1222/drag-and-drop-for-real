<script setup>
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import {stringToColour} from "@/plugins/helper/stringToColour.js";
import {computed, onMounted, reactive, ref, watch} from "vue";
import {showSnackbar} from "@/plugins/helper/customSnackbar.js";
import {useSound} from "@vueuse/sound";
import bonk from "@/assets/sounds/bonk.mp3";
import magic from "@/assets/sounds/magic.mp3";
import Panzoom from '@panzoom/panzoom'
import WelcomeDialog from "@/components/dialog/welcomeDialog.vue";
const panzoomRef = ref(null)
const isPanningCanva = ref(false)
defineProps({
  showAssets: {
    default: false,
    required: true
  }
})
defineExpose({
  resetPosition,
  doFormatAlign
})
const welcomeDialogRef = ref(false)
const {play: deleteSound} = useSound(bonk, {
  volume: 0.4,
  interrupt: true
})
const {play: addMagicSound} = useSound(magic, {
  volume: 0.5,
  interrupt: true
})
const draggedItem = ref(null)
const menu = ref(false)
const shelf = defineModel("shelf")
const selectedShelf = defineModel("selectedShelf")
const selectedProduct = defineModel("selectedProduct")

const dragShow = ref([])
const dragPreview = reactive([{
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  ean: ''
}]);
const shelfMenu = ref(false)
const menuTarget = ref(null)
const currentFocus = ref(null)
const previewStyle = computed(() => {
  return {
    top: `${dragPreview.y}px`,
    left: `${dragPreview.x}px`,
    width: `${dragPreview.width}px`,
    height: `${dragPreview.height}px`,
    position: 'absolute',
    opacity: 0.4,
    border: '2px dashed #000',
    pointerEvents: 'none',
    borderRadius: '4px'
  };
});

function hasHorizontalCollision(products, itemToIgnore, newX) {
  const previewWidthPx = dragPreview.width;

  const draggedStart = newX;
  const draggedEnd = newX + previewWidthPx;

  if (!products) return false;

  return products.some(item => {
    if (!item) return false;
    if (itemToIgnore && item === itemToIgnore) return false;

    const itemWidthPx = cmToPixel(null, item.width).widthPx;
    const itemStart = item.x;
    const itemEnd = item.x + itemWidthPx;

    return draggedStart < itemEnd && draggedEnd > itemStart;
  })
}

function openShelfMenu(shelfIndex, event) {
  if (menu.value) {
    menu.value = false
  }
  selectedShelf.value = {
    x: event.clientX,
    y: event.clientY,
    index: shelfIndex
  }
  shelfMenu.value = true
}

function actionShelf(method) {
  switch (method) {
    case 'delete':
      shelf.value.splice(selectedShelf.value.index, 1)
      shelfMenu.value = false
      break;
  }
}

function openMenu(index, shelfIndex, event) {
  if (shelfMenu.value) {
    shelfMenu.value = false
  }
  draggedItem.value = {
    index: index,
    shelfIndex: shelfIndex
  }
  menuTarget.value = event.target.closest('.menuContext')
  menu.value = true
}

function action(method) {
  switch (method) {
    case "delete":
      shelf.value[draggedItem.value.shelfIndex].products.splice(draggedItem.value.index, 1)
      menu.value = false
      deleteSound()
      break;
    default:
      console.warn("method not recognized")
  }
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  let widthAcummulated = 0
  for (const currentShelfProduct of currentShelfProducts) {
    widthAcummulated += currentShelfProduct.width
  }
  console.log(`${productWidth + widthAcummulated} é maior que ${currentShelfWidth}`)
  return (productWidth + widthAcummulated) > currentShelfWidth;

}

function onDragStart(item, itemIndex, shelfIndex, event) {
  const element = event.target.closest('.image-item') || event.target
  const rect = element.getBoundingClientRect()

  const {widthPx, heightPx} = cmToPixel(item.height, item.width);
  const currentScale = panzoomRef.value.getScale() // Pega o zoom atual

  dragShow.value[shelfIndex] = true
  dragPreview.width = widthPx;
  dragPreview.height = heightPx;
  dragPreview.ean = item.ean;

  draggedItem.value = {
    item: item,
    index: itemIndex,
    shelfIndex: shelfIndex,
    offsetX: (event.clientX - rect.left) / currentScale,
    offsetY: (event.clientY - rect.top) / currentScale
  }

  event.dataTransfer.effectAllowed = 'move';
}

function doFormatAlign(align, shelfIndex) {
  addMagicSound()

  const currentShelf = shelf.value[shelfIndex]
  const shelfWidth = cmToPixel(null, shelf.value[shelfIndex].width).widthPx

  const sortedProducts = [...currentShelf.products].sort(
    (a, b) => a.x - b.x
  )

  const productsWithWidth = sortedProducts.map(product => ({
    product,
    widthPx: cmToPixel(null, product.width).widthPx
  }))

  const totalProductsWidth = productsWithWidth.reduce(
    (acc, item) => acc + item.widthPx,
    0
  )

  const count = productsWithWidth.length

  let start = 0
  let gap = 0

  switch (align) {
    case 'left':
      start = 0
      gap = 0
      break

    case 'right':
      start = shelfWidth - totalProductsWidth
      gap = 0
      break

    case 'center':
      start = (shelfWidth - totalProductsWidth) / 2
      gap = 0
      break

    case 'justify':
      if (count > 1) {
        start = 0
        gap = (shelfWidth - totalProductsWidth) / (count - 1)
      }
      break

    default:
      showSnackbar(`método não criado ainda para o ${align}`)
      return
  }

  let position = start

  for (const {product, widthPx} of productsWithWidth) {
    product.x = position
    position += widthPx + gap
  }
}

function onDrop(index, event, shelfHeight = 0) {
  if (!draggedItem.value.item) return

  const sourceIndex = draggedItem.value.shelfIndex
  const sourceShelf = shelf.value[sourceIndex]
  const destShelf = shelf.value[index]
  const draggedIndex = draggedItem.value.index

  const draggedProduct = sourceShelf.products[draggedIndex]

  if (draggedProduct.height > destShelf.height) {
    showSnackbar(
      `Opa maninho, o produto tem ${draggedProduct.height}cm de altura e a estante tem ${destShelf.height}cm, não rola né`
    )
    return
  }

  const isDifferentShelf = sourceIndex !== index
  if (
    isDifferentShelf &&
    canAddProduct(destShelf.products, destShelf.width, draggedProduct.width)
  ) {
    showSnackbar(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }

  const removedItem = sourceShelf.products[draggedIndex]

  const container = event.currentTarget
  const containerRect = container.getBoundingClientRect()
  const removedItemHeight = cmToPixel(removedItem.height, null).heightPx
  const currentScale = panzoomRef.value.getScale()
  const mouseRelX = (event.clientX - containerRect.left) / currentScale
  const finalX = mouseRelX - draggedItem.value.offsetX
  if (hasHorizontalCollision(destShelf.products, removedItem, finalX)) {
    showSnackbar('Não é possível soltar o produto sobre outro')
    return
  }

  removedItem.x = finalX
  removedItem.y = shelfHeight - removedItemHeight

  let insertIndex = index
  if (sourceIndex === index && draggedIndex < index) {
    insertIndex--
  }

  sourceShelf.products.splice(draggedIndex, 1)
  destShelf.products.splice(insertIndex, 0, removedItem)
  destShelf.products.forEach((item, i) => {
    item.position = i
  })
  if (sourceIndex === index) {
    sourceShelf.products.forEach((item, i) => {
      item.position = i
    })
  }
  onDragEnd()
}

function onDragEnd() {
  draggedItem.value = {
    item: null,
    index: null,
    shelfIndex: null
  }
  dragShow.value = []
}

const onDragOver = (event, shelfHeight, shelfIndex) => {
  const destShelf = shelf.value[shelfIndex];
  const heightPx = dragPreview.height;

  const draggedIndex = draggedItem.value.index;
  const sourceIndex = draggedItem.value.shelfIndex;

  const rect = event.currentTarget.getBoundingClientRect();
  dragPreview.x = event.clientX - rect.left - draggedItem.value.offsetX;
  dragPreview.y = shelfHeight - heightPx;
  dragShow.value.fill(false)

  dragShow.value[shelfIndex] = true
  let itemToIgnore = null;
  if (sourceIndex === shelfIndex) {
    itemToIgnore = destShelf.products[draggedIndex];
  }

  if (hasHorizontalCollision(destShelf.products, itemToIgnore, dragPreview.x)) {
    previewStyle.value.backgroundColor = "#ff2c2c";
  } else {
    previewStyle.value.backgroundColor = stringToColour(dragPreview.ean);
  }
};

function onFocus(currentImage) {
  currentFocus.value = currentImage
}

function onFocusOut() {
  currentFocus.value = null
}

onMounted(() => {
  let elem = document.getElementById('canvas');
  panzoomRef.value = Panzoom(elem, {
    maxScale: 5,
    excludeClass: 'exclude-area',
  })
  elem.parentElement.addEventListener('wheel', panzoomRef.value.zoomWithWheel)
})

function onMouseDown(event) {
  if (event.button === 1) {
    isPanningCanva.value = true;
    panzoomRef.value.setOptions({
      disablePan: true,
    })
  }
}

function onMouseLeave() {
  isPanningCanva.value = false;
  panzoomRef.value.setOptions({
    disablePan: false,
  })
}

function resetPosition() {
  panzoomRef.value.reset()
}

</script>

<template>
  <div id="canvas"
       @click.middle="onMouseDown"
       @mouseleave="onMouseLeave"
       :style="{ cursor: isPanningCanva ? 'grabbing' : 'default' }"
  >
  <template v-for="(shelfItem, index) in shelf">
    <v-sheet  :width="cmToPixel(null, shelfItem.width).widthPx + 'px'"
              class="shelf-container pa-0 ma-0"
              :class="{ 'selected': selectedShelf === index }"
    >
      <div class="flex-nowrap droppable-area"
           @click.stop="selectedShelf = index"
           @contextmenu.prevent.stop="openShelfMenu(index, $event)"
           @drop="onDrop(index, $event, cmToPixel(shelfItem.height, null).heightPx)"
           @dragover.prevent="onDragOver($event, cmToPixel(shelfItem.height, null).heightPx, index)"
           :style="{
               'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px',
             }">
        <v-menu
          v-model="shelfMenu"
          location="end"
          :target="[selectedShelf?.x ?? 0, selectedShelf?.y ?? 0]"
          close-on-back
          close-on-content-click
        >
          <v-list
            class="py-0"
            density="compact"
            slim
            nav
          >
            <v-list-item density="compact" @click="actionShelf('edit')">
              <v-list-item-title>
                Editar Prateleira
              </v-list-item-title>
            </v-list-item>
            <v-list-item density="compact" @click="actionShelf('delete')">
              <v-list-item-title>
                Deletar Prateleira
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <div class="position-absolute cursor-move image-item menuContext exclude-area"
             v-for="(imageItem, itemIndex) in shelfItem.products"
             @click.stop="selectedProduct = imageItem"
             @dragstart.stop="onDragStart(imageItem, itemIndex, index, $event)"
             @dragend.stop="onDragEnd"
             @drop="onDragEnd"
             @contextmenu.prevent.stop="openMenu(itemIndex, index, $event)"
             @focus="onFocus(imageItem)"
             @focusout="onFocusOut"
             draggable="true"
             tabindex="0"
             :style="{
                top: `${imageItem.y}px`,
                left: `${imageItem.x}px`,
                height: `${cmToPixel(imageItem.height, imageItem.width).heightPx}px`,
                width: `${cmToPixel(imageItem.height, imageItem.width).widthPx}px`,
                'background-color': showAssets && imageItem.previewUrl ? null : stringToColour(imageItem.ean),
                border: showAssets && imageItem.previewUrl ? null : '3px solid black'
               }"
        >
          <v-img
            v-if="showAssets"
            :src="imageItem?.previewUrl"
          />
        </div>
        <v-menu
          v-model="menu"
          location="end"
          :target="menuTarget"
          close-on-back
          close-on-content-click
        >
          <v-list
            class="py-0"
            density="compact"
            slim
            nav
          >
            <v-list-item density="compact" @click="action('edit')">
              <v-list-item-title>
                Editar
              </v-list-item-title>
            </v-list-item>
            <v-list-item density="compact" @click="action('delete')">
              <v-list-item-title>
                Excluir
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <v-divider :thickness="cmToPixel(shelfItem.tickness, null).heightPx" :color="shelfItem.color"
                 variant="solid" class="border-opacity-100"/>
    </v-sheet>
  </template>
  </div>
  <welcome-dialog v-model="welcomeDialogRef"/>
</template>

<style scoped>
.image-item {
  transition: box-shadow 0.2s;
}

.droppable-area {
  position: relative;
}

.shelf-container {
  /* Borda mais fina e em cinza suave em vez de preto sólido */
  border: 2px solid #e0e0e0;

  /* Fundo branco ou muito levemente cinza */
  background-color: rgba(255, 255, 255, 0.6);

  /* Cantos levemente arredondados */
  border-radius: 8px;

  /* A mágica da suavidade: anima todas as mudanças (cor, borda, sombra) */
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  cursor: pointer;
}

/* Estado de Hover (quando passa o mouse) */
.shelf-container:hover {
  border-color: #bdbdbd;
  background-color: #fafafa;
}

/* Estado Selecionado */
.shelf-container.selected {
  /* Borda na cor primária (Ex: Azul Vuetify ou sua marca) */
  border-color: #1976D2;

  /* Fundo com tintura da cor primária, bem suave */
  background-color: rgba(25, 118, 210, 0.08);

  /* Sombra colorida suave para dar destaque ("lift") */
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.2);

  /* Opcional: aumenta levemente o z-index para ficar sobre os outros */
  z-index: 2;
}
</style>
