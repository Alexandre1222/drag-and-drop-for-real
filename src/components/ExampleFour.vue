<script setup>
import {ref} from "vue";

const productList = ref([
  {
    "title": "Maionese Heinz 390g",
    "previewUrl": "https://phygital-files.mercafacil.com/comercial-big-oferta/uploads/produto/heinz_maionese_390g_1684dc84-5ab9-4d35-a4f6-db95408160ee.png",
    "sku": "19194518234",
    "height": 190,
    "width": 70,
    "depth": 70
  },
  {
    "title": "Ketchup Cepera 400g",
    "previewUrl": "https://phygital-files.mercafacil.com/primato/uploads/produto/ketchup_cepera_400g_tradicional_6f642c91-029c-4976-a93d-4d81393e9ca8.png",
    "sku": "8951428573583",
    "height": 200,
    "width": 60,
    "depth": 60
  },
  {
    "title": "Mobil Super 20W50",
    "previewUrl": "https://moovelub.com/mobil/storage/uploads/00000000139.png?v=1723689740035",
    "sku": "8951428573583",
    "height": 250,
    "width": 100,
    "depth": 60
  },
])
const draggedItem = ref(null)
const draggedItemIndex = ref(null)
const shelf = ref([{height: 200, products: []}])
const shelfHeight = ref(null)

function addProduct(productItem) {
  const copyProduct = JSON.parse(JSON.stringify(productItem))
  copyProduct.position = shelf.value[0].products.length
  shelf.value[0].products.push(copyProduct)
}

function addShelf() {
  shelf.value.push({height: shelfHeight.value, products: [productList.value[1]]})
  shelfHeight.value = null
}

function onDragStart(event, item, shelfItemIndex) {
  console.log("Arrastando o item: ", item, shelfItemIndex)
  draggedItem.value = item
  draggedItemIndex.value = shelfItemIndex
}

function onDrop(event, currentShelf, currentShelfIndex){
  if (currentShelfIndex == draggedItemIndex.value){
    draggedItem.value = null
    draggedItemIndex.value = null
    return
  }
  currentShelf.products.push(draggedItem.value)
  draggedItem.value = null
  draggedItemIndex.value = null
}

function swapItems(list, from, to) {
  const temp = list[from]
  list[from] = list[to]
  list[to] = temp
}

function onDragEnter(index, itemIndex) {
  if (draggedItem.value === null) return

  swapItems(shelf.value[index].products, itemIndex, index)
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="6">
        <v-number-input label="Altura" variant="outlined" bg-color="white" density="compact" v-model="shelfHeight"/>
      </v-col>
      <v-col cols="6">
        <v-btn :color="shelfHeight? 'primary' : 'error'" @click.stop="addShelf" :disabled="!shelfHeight">Adicionar
          Prateleira
        </v-btn>
      </v-col>
      <v-col cols="4" class="h-100">
        <v-card color="white">
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
        </v-card>
      </v-col>
      <v-col cols="8">
        <v-card>
          <v-row>
            <v-col cols="12">
              <template v-for="(shelfItem, index) in shelf">
                <v-row class="bg-purple-accent-1 ma-2" @drop="onDrop($event, shelfItem, index)" @dragover.prevent>
                    <v-col cols="2" class="pa-0 ma-0" align-self="end" v-for="(imageItem, itemIndex) in shelfItem.products">
                      <v-img
                        draggable="true"
                        @dragstart="onDragStart($event, imageItem, index)"
                        @dragenter.prevent="onDragEnter(index, itemIndex)"
                        :src="imageItem.previewUrl"
                        :height="imageItem.height + 'px'"
                        :width="imageItem.width + 'px'"
                      />
                    </v-col>
                </v-row>
              </template>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

</template>

<style scoped>
.drag-over {
  background-color: #42b883;
}

.drag-el {
  color: white;
}
</style>
