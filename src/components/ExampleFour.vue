<script setup>
import {onMounted, ref, shallowRef, toRef} from "vue";
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import cmToPixel from "@/plugins/helper/cmToPixel";
import productsDb from '@/plugins/database/products.json'
import LoadingState from "@/components/loadingState.vue";
import CustomSnackbar from "@/components/CustomSnackbar.vue";
import EditProductDialog from "@/components/dialog/editProductDialog.vue";
import EditShelfDialog from "@/components/dialog/editShelfDialog.vue";
import {useSound} from '@vueuse/sound'
import bonk from '@/assets/sounds/bonk.mp3'
import minecraftClick from '@/assets/sounds/minecraftClick.mp3'
import magic from '@/assets/sounds/magic.mp3'
import ImportProductDialog from "@/components/dialog/importProductDialog.vue";
import {stringToColour} from "@/plugins/helper/stringToColour";

const {play: deleteSound} = useSound(bonk, {
  volume: 0.4,
  interrupt: true
})

const {play: addProductSound} = useSound(minecraftClick, {
  volume: 1,
  interrupt: true
})

const {play: addMagicSound} = useSound(magic, {
  volume: 0.5,
  interrupt: true
})

const headers = [
  {title: 'Nivel', key: 'level', align: 'start'},
  {title: 'Elemento do mobiliário', key: 'mobiliaryElement'},
  {title: 'Altura', key: 'height', align: 'center', width: 150},
  {title: 'Largura', key: 'width', align: 'center', width: 150},
  {title: 'Espessura', key: 'tickness', align: 'center', width: 150},
  {title: 'Profundidade', key: 'depth', align: 'end'},
  {title: 'Cor', key: 'color', align: 'end', width: 50},
  {title: 'Action', key: 'action', align: 'end', width: 50},
]

const menu = ref(false)
const shelfMenu = ref(false)
const menuTarget = ref(null)
const shelfIndexToDelete = ref(null)
const indexProductToDelete = ref(null)
const indexShelfToDelete = ref(null)
const loading = ref(false)
const importProductModel = ref(false)
const shelfMenuPosition = ref({
  x: 0,
  y: 0
})
const showAssets = ref(false)
const currentFocus = ref(null)
const currentShelf = ref(null)
const addProductModel = ref(false)
const editProductModel = ref(false)
const editShelfModel = ref(false)
const productList = ref(null)
const standSize = ref({
  height: 160,
  width: 92
})
const modules = ref({})
const shelf = ref([
  {
    mobiliaryElement: 'Prateleira',
    height: 40,
    depth: 0,
    width: 40,
    tickness: 2,
    color: '#A3C4BC',
    products: []
  },
  {
    mobiliaryElement: 'Prateleira',
    height: 40,
    depth: 0,
    width: 40,
    tickness: 2,
    color: '#E9C46A',
    products: []
  }
])
const draggedItem = ref({
  item: null,
  index: null
})
const draggedShelfIndex = ref(null)

const snackbar = ref({
  show: false,
  text: null,
  color: "error"
});

function editShelf(newHeight, index) {
  if (!canAddShelf(newHeight)) {
    return
  }
  shelf.value[index].height = newHeight
}

function openMenu(index, shelfIndex, event) {
  if (shelfMenu.value) {
    shelfMenu.value = false
  }
  indexShelfToDelete.value = shelfIndex
  indexProductToDelete.value = index
  menuTarget.value = event.target.closest('.menuContext')
  menu.value = true
}

function action(method) {
  switch (method) {
    case "delete":
      shelf.value[indexShelfToDelete.value].products.splice(indexProductToDelete.value, 1)
      menu.value = false
      deleteSound()
      break;
    case "edit":
      editProductModel.value = true
      break;
    default:
      console.warn("method not recognized")
  }
}

function removeShelf(shelfIndex) {
  shelf.value.splice(shelfIndex, 1)
}

function openShelfMenu(shelfIndex, event) {
  if (menu.value) {
    menu.value = false
  }
  shelfMenuPosition.value.x = event.clientX
  shelfMenuPosition.value.y = event.clientY
  shelfIndexToDelete.value = shelfIndex
  shelfMenu.value = true
}

function actionShelf(method) {
  switch (method) {
    case 'delete':
      shelf.value.splice(shelfIndexToDelete.value, 1)
      shelfMenu.value = false
      break;
    case 'edit':
      currentShelf.value = shelf.value[shelfIndexToDelete.value]
      editShelfModel.value = true
  }
}

function showFeedback(msg, color = 'error') {
  snackbar.value = {
    show: true,
    text: msg,
    color: color
  }
}

function saveProduct(product) {
  for (const productElement of product) {
    productElement.x = 0
    productElement.y = 0
    productList.value.push(productElement)
  }
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  let widthAcummulated = 0
  console.log(currentShelfProducts)
  for (const currentShelfProduct of currentShelfProducts) {
    widthAcummulated += currentShelfProduct.width
  }
  return (productWidth + widthAcummulated) > currentShelfWidth;

}

function canAddShelf(newShelfHeight) {
  const totalHeight = shelf.value.reduce((sum, {height}) => sum + height, 0)
  const availableSpace = standSize.value.height - totalHeight
  if (newShelfHeight > availableSpace) {
    const message = availableSpace === 0
      ? 'Não cabe! Esquece fi, já gastou todo o espaço'
      : `Não cabe! Espaço disponível: ${availableSpace} cm`
    showFeedback(message)
    return false
  }
  return true
}

function addProduct(productItem) {
  const shelfRef = shelf.value[0]
  const {width, height} = productItem

  if (canAddProduct(shelfRef.products, standSize.value.width, width)) {
    showFeedback('Limite atingido, não é possível adicionar mais produtos')
    return
  }
  addProductSound()

  const product = JSON.parse(JSON.stringify(productItem))
  const shelfHeightPx = cmToPixel(shelfRef.height).heightPx
  const productHeightPx = cmToPixel(height).heightPx

  product.position = shelfRef.products.length

  const products = shelfRef.products
  const lastProduct = products.at(-1)
  product.x = lastProduct
    ? lastProduct.x + cmToPixel(null, lastProduct.width).widthPx
    : 0

  product.y = shelfHeightPx - productHeightPx

  shelfRef.products.push(product)
}

function addShelf() {
  shelf.value.push({
    mobiliaryElement: 'Prateleira',
    height: 40,
    depth: 0,
    width: 40,
    tickness: 2,
    color: '#E9C46A',
    products: []
  });
}

function onDragStart(item, itemIndex, shelfIndex, event) {
  const rect = event.target.getBoundingClientRect();
  draggedItem.value = {
    item: item,
    index: itemIndex,
    offsetY: event.clientY - rect.top,
    offsetX: event.clientX - rect.left
  }
  draggedShelfIndex.value = shelfIndex
}

function onDragEnd() {
  draggedItem.value = {
    item: null,
    index: null
  }
  draggedShelfIndex.value = null
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
      showFeedback(`método não criado ainda para o ${align}`)
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

  const sourceIndex = draggedShelfIndex.value
  const sourceShelf = shelf.value[sourceIndex]
  const destShelf = shelf.value[index]
  const draggedIndex = draggedItem.value.index

  const draggedProduct = sourceShelf.products[draggedIndex]

  if (draggedProduct.height > destShelf.height) {
    showFeedback(
      `Opa maninho, o produto tem ${draggedProduct.height}cm de altura e a estante tem ${destShelf.height}cm, não rola né`
    )
    return
  }

  const isDifferentShelf = sourceIndex !== index
  console.log(destShelf)
  if (
    isDifferentShelf &&
    canAddProduct(destShelf.products, standSize.value.width, draggedProduct.width)
  ) {
    showFeedback(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }

  const removedItem = sourceShelf.products[draggedIndex]

  const container = event.currentTarget
  const containerRect = container.getBoundingClientRect()
  const removedItemHeight = cmToPixel(removedItem.height, null).heightPx

  const newX = event.clientX - containerRect.left - draggedItem.value.offsetX

  if (hasHorizontalCollision(destShelf.products, removedItem, newX)) {
    showFeedback('Não é possível soltar o produto sobre outro')
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

function hasHorizontalCollision(products, draggedItem, newX) {
  const draggedWidthPx = cmToPixel(null, draggedItem.width).widthPx
  const draggedStart = newX
  const draggedEnd = newX + draggedWidthPx

  return products.some(item => {
    if (item === draggedItem) return false

    const itemWidthPx = cmToPixel(null, item.width).widthPx
    const itemStart = item.x
    const itemEnd = item.x + itemWidthPx

    return draggedStart < itemEnd && draggedEnd > itemStart
  })
}

function onFocus(currentImage) {
  currentFocus.value = currentImage
}

function onFocusOut() {
  currentFocus.value = null
}

onMounted(() => {
  loading.value = true
  productList.value = productsDb
  setTimeout(() => {
    loading.value = false
  }, 1000)
})
</script>

<template>
  <v-container>
    <template v-if="!loading">
      <v-row>
        <v-col cols="12">
          <v-expansion-panels>
            <v-col>
              <v-expansion-panel>
                <v-expansion-panel-title v-slot="{ expanded }">
                  <v-row no-gutters>
                    <v-col class="d-flex justify-start" cols="4">
                      Caracteristicas do móvel
                    </v-col>
                    <v-col
                      class="text--secondary"
                      cols="8"
                    >
                      <v-fade-transition leave-absolute>
                        <span v-if="expanded">Ajuste seu móvel como desejar</span>
                        <v-row
                          v-else
                          style="width: 100%"
                          no-gutters
                        >
                          <v-col class="d-flex justify-start" cols="6">
                            Rock music
                          </v-col>
                        </v-row>
                      </v-fade-transition>
                    </v-col>
                  </v-row>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense>
                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        v-model="modules.qtd"
                        label="N° de Módulos"
                        required
                      ></v-number-input>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        label="Altura"
                        required
                      ></v-number-input>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        label="Largura"
                        v-model="modules.width"
                        required
                      ></v-number-input>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        label="Base"
                        v-model="modules.base"
                        required
                      ></v-number-input>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        label="Profundidade"
                        v-model="modules.depth"
                        required
                      ></v-number-input>
                    </v-col>

                    <v-col
                      cols="12"
                      md="4"
                      sm="6"
                    >
                      <v-number-input
                        density="compact"
                        label="Linear ao solo"
                        v-model="modules.linear"
                        required
                      ></v-number-input>
                    </v-col>
                  </v-row>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-col>
            <v-col>
              <v-expansion-panel>
                <v-expansion-panel-title v-slot="{ expanded }">
                  <v-row no-gutters>
                    <v-col class="d-flex justify-start" cols="4">
                      Desenho do módulo
                    </v-col>
                    <v-col
                      class="text--secondary"
                      cols="8"
                    >
                      <v-fade-transition leave-absolute>
                        <span v-if="expanded">Customize e adicione prateleiras</span>
                        <v-row
                          v-else
                          style="width: 100%"
                          no-gutters
                        >
                          <v-col class="d-flex justify-start" cols="6">
                            Possui {{ shelf.length }} colunas
                          </v-col>
                        </v-row>
                      </v-fade-transition>
                    </v-col>
                  </v-row>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-sheet border rounded>
                    <v-data-table
                      density="compact"
                      :headers="headers"
                      :items="shelf"
                    >
                      <template v-slot:top>
                        <v-toolbar flat>
                          <v-toolbar-title>
                            <v-icon color="medium-emphasis" icon="mdi-cart-check" size="x-small" start></v-icon>
                            Módulo
                          </v-toolbar-title>
                          <v-btn @click.stop="addShelf">
                            Adicionar prateleira
                          </v-btn>
                        </v-toolbar>
                      </template>
                      <template v-slot:item.level="{ value, index }">
                        {{ index + 1 }}
                      </template>

                      <template v-slot:item.height="{ index }">
                        <v-text-field
                          controlVariant="split"
                          density="compact"
                          v-model="shelf[index].height"
                          hide-details
                        />
                      </template>

                      <template v-slot:item.width="{ index }">
                        <v-text-field
                          controlVariant="split"
                          density="compact"
                          v-model="shelf[index].width"
                          hide-details
                        />
                      </template>

                      <template v-slot:item.tickness="{ index }">
                        <v-text-field
                          controlVariant="split"
                          density="compact"
                          v-model="shelf[index].tickness"
                          hide-details
                        />
                      </template>

                      <template v-slot:item.color="{ value,index }">
                        <v-dialog max-width="500">
                          <template v-slot:activator="{ props: activatorProps }">
                            <div :style="{'background-color': value}" class="pa-2" v-bind="activatorProps"/>
                          </template>

                          <template v-slot:default="{ isActive }">
                            <v-card title="Dialog">
                              <v-card-text>
                                <v-color-picker hide-inputs v-model="shelf[index].color"></v-color-picker>
                              </v-card-text>
                            </v-card>
                          </template>
                        </v-dialog>
                      </template>

                      <template v-slot:item.action="{ index }">
                        <v-icon color="medium-emphasis" icon="mdi-delete" size="small"
                                @click="removeShelf(index)"></v-icon>
                      </template>
                    </v-data-table>
                  </v-sheet>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-col>
          </v-expansion-panels>
        </v-col>
        <v-col cols="12">
          <v-switch label="Exibir Ilustrações" hide-details color="primary" v-model="showAssets"/>
        </v-col>
        <v-col cols="4" class="h-100">
          <v-row>
            <v-col>
              <v-card color="white" :disabled="shelf.length === 0">
                <v-text-field variant="outlined" bg-color="white" density="compact" label="Selecione o produto"
                              single-line
                              prepend-inner-icon="mdi-magnify" hide-details/>
                <v-list lines="one" bg-color="transparent">
                  <v-list-item
                    v-for="product in productList"
                    :key="product.ean"
                    :title="product.subcategory"
                    :subtitle="product.category"
                    :prepend-avatar="product.previewUrl"
                    append-icon="mdi-plus"
                    @click.stop="addProduct(product)"
                  >
                    <template v-slot:prepend>
                      <v-avatar
                        color="grey"
                        rounded="0"
                        size="40"
                      >
                        <v-img v-if="product.previewUrl" :src="product.previewUrl"></v-img>
                        <v-icon v-else color="error">mdi-cancel</v-icon>
                      </v-avatar>
                    </template>
                  </v-list-item>
                </v-list>
                <v-btn block
                       prepend-icon="mdi-plus"
                       color="success"
                       @click.stop="addProductModel = true"

                >Adicionar produto
                </v-btn>

                <v-btn block
                       prepend-icon="mdi-import"
                       color="warning"
                       @click.stop="importProductModel = true"
                >Exportar produto
                </v-btn>
              </v-card>
            </v-col>
            <v-col>
              <v-card color="white" :disabled="shelf.length === 0">
                <v-text-field variant="outlined" bg-color="white" density="compact" label="Selecione o Elemento decorativo"
                              single-line
                              prepend-inner-icon="mdi-magnify" hide-details/>
                <v-list lines="one" bg-color="transparent">
                  <v-list-item
                    v-for="product in productList"
                    :key="product.ean"
                    :title="product.subcategory"
                    :subtitle="product.category"
                    :prepend-avatar="product.previewUrl"
                    append-icon="mdi-plus"
                    @click.stop="addProduct(product)"
                  >
                    <template v-slot:prepend>
                      <v-avatar
                        color="grey"
                        rounded="0"
                        size="40"
                      >
                        <v-img v-if="product.previewUrl" :src="product.previewUrl"></v-img>
                        <v-icon v-else color="error">mdi-cancel</v-icon>
                      </v-avatar>
                    </template>
                  </v-list-item>
                </v-list>
                <v-btn block
                       prepend-icon="mdi-plus"
                       color="success"
                       @click.stop="addProductModel = true"

                >Adicionar produto
                </v-btn>

                <v-btn block
                       prepend-icon="mdi-import"
                       color="warning"
                       @click.stop="importProductModel = true"
                >Exportar produto
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="8" class="overflow-x-auto">
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
                     @drop="onDrop(index, $event, cmToPixel(shelfItem.height, null).heightPx)" @dragover.prevent
                     :style="{'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px'}">
                  <v-menu
                    v-model="shelfMenu"
                    location="end"
                    scroll-strategy="close"
                    :target="[shelfMenuPosition.x, shelfMenuPosition.y]"
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
                       @dragstart.stop="onDragStart(shelfItem, itemIndex, index, $event)"
                       @dragend.stop="onDragEnd"
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
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <v-container height="90vh" class="d-flex justify-center align-center">
        <loading-state/>
      </v-container>
    </template>
  </v-container>

  <add-product-dialog v-model="addProductModel" @save-product="saveProduct"/>

  <edit-product-dialog v-model="editProductModel"/>

  <edit-shelf-dialog v-model="editShelfModel" :current-shelf="currentShelf" :currentShelfIndex="shelfIndexToDelete"
                     @edit-shelf="editShelf"/>

  <import-product-dialog v-model="importProductModel" @update-products="saveProduct"/>

  <custom-snackbar v-model="snackbar.show" :snackbar-color="snackbar.color" :snackbar-text="snackbar.text"/>
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
  top: 80px;
  right: 0;
  width: 200px;
  height: 100px;
  border: 3px solid black;
}
</style>
