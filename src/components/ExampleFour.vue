<script setup>
import {onMounted, ref} from "vue";
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import productsDb from '@/plugins/database/products.json'
import LoadingState from "@/components/loadingState.vue";
import CustomSnackbar from "@/components/CustomSnackbar.vue";
import EditProductDialog from "@/components/dialog/editProductDialog.vue";
import EditShelfDialog from "@/components/dialog/editShelfDialog.vue";

const menu = ref(false)
const shelfMenu = ref(false)
const menuTarget = ref(null)
const shelfIndexToDelete = ref(null)
const indexProductToDelete = ref(null)
const indexShelfToDelete = ref(null)
const loading = ref(false)
const shelfMenuPosition = ref({
  x: 0,
  y: 0
})
const currentShelf = ref(null)
const addProductModel = ref(false)
const editProductModel = ref(false)
const editShelfModel = ref(false)
const productList = ref(null)
const standSize = ref({
  height: 160,
  width: 92
})
const shelf = ref([{height: 40, products: []}, {height: 80, products: []}])
const shelfHeight = ref(null)
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

function editShelf(newHeight, index){
  if (!canAddShelf(newHeight)){
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
  menuTarget.value = event.target.closest('.v-img')
  menu.value = true
}

function action(method) {
  switch (method){
    case "delete":
      shelf.value[indexShelfToDelete.value].products.splice(indexProductToDelete.value, 1)
      menu.value = false
      break;
    case "edit":
      editProductModel.value = true
      break;
    default:
      console.warn("method not recognized")
  }
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
  switch (method){
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
  productList.value.push(product)
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  let widthAcummulated = 0
  for (const currentShelfProduct of currentShelfProducts) {
    widthAcummulated += currentShelfProduct.width
  }
  return (productWidth + widthAcummulated) > currentShelfWidth;

}

function canAddShelf(newShelfHeight){
  const actualHeightTotal = shelf.value.reduce((acc, item) => acc + item.height, 0);
  if (actualHeightTotal + newShelfHeight > standSize.value.height) {
    if (standSize.value.height - actualHeightTotal === 0) {
      showFeedback(`Não cabe! Esquece fi, ja gastou todo o espaço`)
      return false
    }
    showFeedback(`Não cabe! Espaço disponível: ${standSize.value.height - actualHeightTotal} cm`)
    return false
  }
  return true
}

function addProduct(productItem) {
  const currentProductWidth = productItem.width
  if (canAddProduct(shelf.value[0].products, standSize.value.width, currentProductWidth)) {
    showFeedback(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }
  const copyProduct = JSON.parse(JSON.stringify(productItem))
  const shelfPixel = cmToPixel(shelf.value[0].height, null).heightPx
  copyProduct.position = shelf.value[0].products.length
  const allPositionsX = shelf.value[0].products.map(item => item.x);
  const maxX = Math.max(...allPositionsX, 0);

  copyProduct.x = maxX > 0 ? maxX + cmToPixel(null, copyProduct.width).widthPx : cmToPixel(null, copyProduct.width).widthPx
  console.log(copyProduct.x)
  copyProduct.y = shelfPixel - cmToPixel(copyProduct.height, null).heightPx
  shelf.value[0].products.push(copyProduct)
}

function addShelf() {
  if (!shelfHeight.value) return;
  if (!canAddShelf(shelfHeight.value)){
    return
  }

  shelf.value.push({
    height: shelfHeight.value,
    products: []
  });

  shelfHeight.value = null;
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

function onDrop(index, event, shelfHeight = 0) {
  if (!draggedItem.value.item) return
  const sourceShelf = shelf.value[draggedShelfIndex.value]
  const destShelf = shelf.value[index]

  if (sourceShelf.products[draggedItem.value.index].height > destShelf.height) {
    showFeedback(`Opa maninho, o produto tem ${sourceShelf.products[draggedItem.value.index].height}cm de altura  e a estante tem ${destShelf.height}cm, não rola né`)
    return
  }

  let insertIndex = index
  const container = event.currentTarget;
  const item = event.target;

  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  const productsCopy = [...sourceShelf.products];

  const removedItem = productsCopy.splice(draggedItem.value.index, 1)[0];
  const removedItemHeight = cmToPixel(removedItem.height, null).heightPx
  if (draggedShelfIndex.value !== index && canAddProduct(shelf.value[index].products, standSize.value.width, removedItem.width)) {
    showFeedback(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }
  sourceShelf.products.splice(draggedItem.value.index, 1);

  const newX = event.clientX - containerRect.left - draggedItem.value.offsetX;
  const newY = event.clientY - containerRect.top - draggedItem.value.offsetY;

  removedItem.x = newX < 0 ? 0 : newX
  removedItem.y = shelfHeight - removedItemHeight;

  if (draggedShelfIndex.value === index && draggedItem.value.index < index) {
    insertIndex--
  }

  destShelf.products.splice(insertIndex, 0, removedItem)
  destShelf.products.forEach((item, i) => {
    item.position = i
  })
  if (draggedShelfIndex.value === index) {
    sourceShelf.products.forEach((item, i) => (item.position = i))
  }
  onDragEnd()
}

onMounted(() => {
  loading.value = true
  productList.value = productsDb
  setTimeout(() => {
    loading.value = false
  }, 4000)
})
</script>

<template>
  <v-container>
    <template v-if="!loading">
      <v-row>
        <v-col cols="6">
          <v-number-input :precision="2" label="Altura (CM)" variant="outlined" color="white" v-model="shelfHeight"/>
        </v-col>
        <v-col cols="6">
          <v-btn :color="shelfHeight? 'primary' : 'error'" @click.stop="addShelf" :disabled="!shelfHeight">Adicionar
            Prateleira
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-banner
            avatar="https://m.media-amazon.com/images/I/51CGhVom7HL._AC_UF1000,1000_QL80_.jpg"
            color="success"
            :text="`A altura pré definida da estante é de ${standSize.height}x${standSize.width} (medida em centimetros)`"
            :stacked="false"
          >
          </v-banner>
        </v-col>
        <v-col cols="4" class="h-100">
          <v-card color="white" :disabled="shelf.length === 0">
            <v-text-field variant="outlined" bg-color="white" density="compact" label="Selecione o produto" single-line
                          prepend-inner-icon="mdi-magnify" hide-details/>
            <v-list lines="one" bg-color="transparent">
              <v-list-item
                v-for="product in productList"
                :key="product.sku"
                :title="product.title"
                :subtitle="product.sku"
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
                    <v-img :src="product.previewUrl"></v-img>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
            <v-btn block prepend-icon="mdi-plus" color="success" @click.stop="addProductModel = true">Adicionar produto
            </v-btn>
          </v-card>
        </v-col>
        <v-col cols="8" class="overflow-x-auto">
          <v-card class="polka-dot pa-0 ma-0">
            <v-card-item class="pa-0">
              <template v-for="(shelfItem, index) in shelf">
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
                  <div class="position-absolute" v-for="(imageItem, itemIndex) in shelfItem.products">
                    <v-img
                      @contextmenu.prevent.stop="openMenu(itemIndex, index, $event)"
                      class="cursor-move image-item"
                      draggable="true"
                      @dragstart="onDragStart(shelfItem, itemIndex, index, $event)"
                      @dragend="onDragEnd"
                      :src="imageItem.previewUrl"
                      :height="cmToPixel(imageItem.height, imageItem.width).heightPx"
                      :width="cmToPixel(imageItem.height, imageItem.width).widthPx"
                      :style="{top: `${imageItem.y}px`,left: `${imageItem.x}px`}"
                    >
                    </v-img>
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
                </div>
                <v-divider thickness="5" color="black" variant="solid" class="border-opacity-100"/>
              </template>
            </v-card-item>
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

  <edit-shelf-dialog v-model="editShelfModel" :current-shelf="currentShelf" :currentShelfIndex="shelfIndexToDelete" @edit-shelf="editShelf"/>

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
</style>
