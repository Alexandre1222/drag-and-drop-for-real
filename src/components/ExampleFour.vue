<script setup>
import {onMounted, ref} from "vue";
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import cmToPixel from "@/plugins/helper/cmToPixel.js";

const menu = ref(false)
const menuTarget = ref(null)
const indexProductToDelete = ref(null)
const indexShelfToDelete = ref(null)

function openMenu(index, shelfIndex, event) {
  indexShelfToDelete.value = shelfIndex
  indexProductToDelete.value = index
  menuTarget.value = event.target.closest('.v-img')
  menu.value = true
}

function action() {
  console.log(shelf.value[indexShelfToDelete.value].products[indexProductToDelete.value])
  shelf.value[indexShelfToDelete.value].products.splice(indexProductToDelete.value, 1)
  menu.value = false
}

const addProductModel = ref(false)
const productList = ref([
  {
    "title": "Maionese Heinz 390g",
    "previewUrl": "https://phygital-files.mercafacil.com/comercial-big-oferta/uploads/produto/heinz_maionese_390g_1684dc84-5ab9-4d35-a4f6-db95408160ee.png",
    "sku": "19194518234",
    "height": 16.9,
    "width": 10,
    "depth": 5.5,
    "y": 40,
    "x": 40,
  },
  {
    "title": "Ketchup Cepera 400g",
    "previewUrl": "https://phygital-files.mercafacil.com/primato/uploads/produto/ketchup_cepera_400g_tradicional_6f642c91-029c-4976-a93d-4d81393e9ca8.png",
    "sku": "8951428573583",
    "height": 15,
    "width": 8,
    "depth": 5.5,
    "y": 50,
    "x": 50,
  },
  {
    "title": "Mobil Super 20W50",
    "previewUrl": "https://pngfre.com/wp-content/uploads/Monster-24-300x300.png",
    "sku": "8951428573583",
    "height": 15.7,
    "width": 6.5,
    "depth": 7,
    "y": 0,
    "x": 0,
  },
])
const standSize = ref({
  height: 160,
  width: 92
})
const shelf = ref([{height: 40, products: []}, {height: 80, products: []}])
const shelfHeight = ref(null)
const draggedItem = ref(null)
const draggedItemIndex = ref(null)
const draggedShelfIndex = ref(null)

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("error");

function showFeedback(msg, color = 'error') {
  snackbarText.value = msg;
  snackbarColor.value = color;
  snackbar.value = true;
}

function saveProduct(product) {
  productList.value.push(product)
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  console.log(currentShelfProducts, currentShelfWidth, productWidth)
  let widthAcummulated = 0
  for (const currentShelfProduct of currentShelfProducts) {
    widthAcummulated += currentShelfProduct.width
  }
  console.log(`Tenho ${(productWidth + widthAcummulated)} acumulado e nao pode ser maior que ${currentShelfWidth}`)
  return (productWidth + widthAcummulated) > currentShelfWidth;

}

function addProduct(productItem) {
  const currentProductWidth = productItem.width
  if (canAddProduct(shelf.value[0].products, standSize.value.width, currentProductWidth)) {
    showFeedback(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }
  const copyProduct = JSON.parse(JSON.stringify(productItem))
  copyProduct.position = shelf.value[0].products.length
  shelf.value[0].products.push(copyProduct)
}

function addShelf() {
  if (!shelfHeight.value) return;
  const newHeight = Number(shelfHeight.value);
  const actualHeightTotal = shelf.value.reduce((acc, item) => acc + item.height, 0);
  if (actualHeightTotal + newHeight > standSize.value.height) {
    if (standSize.value.height - actualHeightTotal === 0) {
      showFeedback(`Não cabe! Esquece fi, ja gastou todo o espaço`)
      return
    }
    showFeedback(`Não cabe! Espaço disponível: ${standSize.value.height - actualHeightTotal} cm`)
    return;
  }

  shelf.value.push({
    height: newHeight,
    products: []
  });

  shelfHeight.value = null;
}

function onDragStart(item, itemIndex, shelfIndex, event) {
  draggedItem.value = item
  draggedItemIndex.value = itemIndex
  draggedItemIndex.value = itemIndex
  draggedShelfIndex.value = shelfIndex
  const rect = event.target.getBoundingClientRect();
  draggedItem.value.offsetY = event.clientY - rect.top;
  draggedItem.value.offsetX = event.clientX - rect.left;
}

function onDragEnd() {
  draggedItem.value = null
  draggedItemIndex.value = null
  draggedShelfIndex.value = null
}

function onDrop(index, event) {
  if (!draggedItem.value) return
  const sourceShelf = shelf.value[draggedShelfIndex.value]
  const destShelf = shelf.value[index]

  if (sourceShelf.products[draggedItemIndex.value].height > destShelf.height) {
    showFeedback(`Opa maninho, o produto tem ${sourceShelf.products[draggedItemIndex.value].height}cm de altura  e a estante tem ${destShelf.height}cm, não rola né`)
    return
  }

  let insertIndex = index
  const container = event.currentTarget;
  const item = event.target;

  const containerRect = container.getBoundingClientRect();
  const itemRect = item.getBoundingClientRect();

  const productsCopy = [...sourceShelf.products];

  const removedItem = productsCopy.splice(draggedItemIndex.value, 1)[0];
  if (draggedShelfIndex.value !== index && canAddProduct(shelf.value[index].products, standSize.value.width, removedItem.width)) {
    showFeedback(`Limite atingido não é possivel adicionar mais produtos`)
    return
  }
  sourceShelf.products.splice(draggedItemIndex.value, 1);

  const newX = event.clientX - containerRect.left - draggedItem.value.offsetX;
  const newY = event.clientY - containerRect.top - draggedItem.value.offsetY;

  removedItem.x = newX < 0 ? 0 : newX
  removedItem.y = newY;

  if (draggedShelfIndex.value === index && draggedItemIndex.value < index) {
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
</script>

<template>
  <v-snackbar
    v-model="snackbar"
    location="top right"
    :color="snackbarColor"
    timeout="3000"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
      {{ snackbarText }}
    </div>

    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="snackbar = false"
      >
        Fechar
      </v-btn>
    </template>
  </v-snackbar>

  <v-container>
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
              <div class="flex-nowrap droppable-area menu-area" @contextmenu.prevent="openMenu(0, index, $event)" @drop="onDrop(index, $event, 'shelf')" @dragover.prevent
                   :style="{'min-height': cmToPixel(shelfItem.height, null).heightPx + 'px'}">
                <div class="position-absolute" v-for="(imageItem, itemIndex) in shelfItem.products">
                  <v-img
                    @contextmenu.prevent="openMenu(itemIndex, index, $event)"
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
                      <v-list-item density="compact" @click="action(itemIndex, index)">
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
  </v-container>

  <add-product-dialog v-model="addProductModel" @save-product="saveProduct"/>
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
