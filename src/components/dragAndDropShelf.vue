<script setup>
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import {stringToColour} from "@/plugins/helper/stringToColour.js";
import {computed, reactive, ref, watch} from "vue";
import {showSnackbar} from "@/plugins/helper/customSnackbar.js";
import {useSound} from "@vueuse/sound";
import bonk from "@/assets/sounds/bonk.mp3";
import magic from "@/assets/sounds/magic.mp3";

const props = defineProps({
  showAssets: {
    default: false,
    required: true
  }
})
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
const selectedShelf = ref({x: 0, y: 0})
const standSize = ref({
  height: 160,
  width: 92
})

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
  for (const currentShelfProduct of currentShelfProducts) {
    widthAcummulated += currentShelfProduct.width
  }
  return (productWidth + widthAcummulated) > currentShelfWidth;

}

function onDragStart(item, itemIndex, shelfIndex, event) {
  const rect = event.target.getBoundingClientRect();
  const {widthPx, heightPx} = cmToPixel(item.height, item.width);
  dragShow.value[shelfIndex] = true

  dragPreview.width = widthPx;
  dragPreview.height = heightPx;
  dragPreview.ean = item.ean;
  draggedItem.value = {
    item: item,
    index: itemIndex,
    shelfIndex: shelfIndex,
    offsetY: event.clientY - rect.top,
    offsetX: event.clientX - rect.left
  }

}

function doFormatAlign(align, shelfIndex) {
  addMagicSound()

  const currentShelf = shelf.value[shelfIndex]
  const shelfWidth = cmToPixel(null, standSize.value.width).widthPx

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
    canAddProduct(destShelf.products, standSize.value.width, draggedProduct.width)
  ) {
    showSnackbar(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }

  const removedItem = sourceShelf.products[draggedIndex]

  const container = event.currentTarget
  const containerRect = container.getBoundingClientRect()
  const removedItemHeight = cmToPixel(removedItem.height, null).heightPx

  const newX = event.clientX - containerRect.left - draggedItem.value.offsetX
  if (hasHorizontalCollision(destShelf.products, removedItem, newX)) {
    showSnackbar('Não é possível soltar o produto sobre outro')
    return
  }

  removedItem.x = Math.max(0, newX)
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
</script>

<template>
  <v-card v-if="shelf && shelf.length > 0" class="polka-dot pa-0 ma-0">
    <v-card-item class="pa-0">
      <template v-for="(shelfItem, index) in shelf">
        <v-btn-toggle density="compact" border divided>
          <v-btn size="x-small" @click.stop="doFormatAlign('left', index)">
            <span class="hidden-sm-and-down">Left</span>

            <v-icon end>
              mdi-format-align-left
            </v-icon>
          </v-btn>

          <v-btn size="x-small" @click.stop="doFormatAlign('center', index)">
            <span class="hidden-sm-and-down">Center</span>

            <v-icon end>
              mdi-format-align-center
            </v-icon>
          </v-btn>

          <v-btn size="x-small" @click.stop="doFormatAlign('right', index)">
            <span class="hidden-sm-and-down">Right</span>

            <v-icon end>
              mdi-format-align-right
            </v-icon>
          </v-btn>

          <v-btn size="x-small" @click.stop="doFormatAlign('justify', index)">
            <span class="hidden-sm-and-down">Justify</span>

            <v-icon end>
              mdi-format-align-justify
            </v-icon>
          </v-btn>
        </v-btn-toggle>
        <div class="flex-nowrap droppable-area menu-area"
             @contextmenu.prevent.stop="openShelfMenu(index, $event)"
             @drop="onDrop(index, $event, cmToPixel(shelfItem.height, null).heightPx)"
             @dragover.prevent="onDragOver($event, cmToPixel(shelfItem.height, null).heightPx, index)"
             :style="{'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px'}">
          <v-menu
            v-model="shelfMenu"
            location="end"
            scroll-strategy="close"
            :target="[selectedShelf.x, selectedShelf.y]"
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
          <div class="position-absolute" v-for="(imageItem, itemIndex) in shelfItem.products"
               @dragstart.stop="onDragStart(imageItem, itemIndex, index, $event)"
               @dragend.stop="onDragEnd"
               @drop="onDragEnd"
               @contextmenu.prevent.stop="openMenu(itemIndex, index, $event)"
               @focus="onFocus(imageItem)"
               @focusout="onFocusOut"
               draggable="true"
               tabindex="0"
          >
            <v-img
              class="cursor-move image-item menuContext"
              v-if="showAssets && imageItem.previewUrl"
              :src="imageItem.previewUrl"
              :height="cmToPixel(imageItem.height, imageItem.width).heightPx"
              :width="cmToPixel(imageItem.height, imageItem.width).widthPx"
              :style="{top: `${imageItem.y}px`,left: `${imageItem.x}px`}"
            />
            <v-sheet
              v-else
              class="cursor-move image-item position-absolute imageless menuContext"
              :height="cmToPixel(imageItem.height, imageItem.width).heightPx"
              :width="cmToPixel(imageItem.height, imageItem.width).widthPx"
              :style="{top: `${imageItem.y}px`,left: `${imageItem.x}px`, 'background-color': stringToColour(imageItem.ean)}"
            />
            <div
              v-if="dragShow[index]"
              :style="previewStyle"
              class="drag-preview-ghost"
            />
          </div>
          <v-menu
            v-model="menu"
            location="end"
            scroll-strategy="close"
            :target="menuTarget"
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
      </template>
    </v-card-item>
  </v-card>

  <v-card v-else>
    <v-empty-state icon="mdi-cart-off">
      <template v-slot:media>
        <v-img
          class="ma-auto"
          src="https://mystickermania.com/cdn/stickers/spongebob/sb-upset-fish-meme-512x512.png"
          :height="300"
          :width="500"
        ></v-img>

      </template>

      <template v-slot:headline>
        <div class="text-h4">
          Nenhuma prateleira adicionada
        </div>
      </template>

      <template v-slot:title>
        <div class="text-h6">
          Como você quer planogramar sem prateleiras
        </div>
      </template>
    </v-empty-state>
  </v-card>
</template>

<style scoped>
.image-item {
  transition: box-shadow 0.2s;
}

.polka-dot {
  position: relative;
  background-color: #fcfcfd;
  background-image: radial-gradient(#dfdfe4 2px, transparent 2px);
  background-size: 15px 15px;
}

.polka-dot::before {
  position: absolute;
  inset: 0;
  font-family: "Comic Sans MS", "Comic Sans", cursive, sans-serif;
  font-size: 40px;
  font-weight: bold;
  color: rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
}

.polka-dot > * {
  position: relative;
  z-index: 1;
}

.droppable-area {
  position: relative;
}

.imageless {
  position: absolute;
  width: 200px;
  height: 100px;
  border: 3px solid black;
}
</style>
