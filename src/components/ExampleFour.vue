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

const productOne = ref(JSON.parse(JSON.stringify(productList.value)))
const productTwo = ref(JSON.parse(JSON.stringify(productList.value)))

const draggedSku = ref(null)
const draggedItem = ref(null)
const draggableProductList = ref([])
const shelf = ref([{height: 200, products: []}, {height: 200, products: []}])
const shelfHeight = ref(null)

function addProduct(productItem) {
  const copyProduct = JSON.parse(JSON.stringify(productItem))
  copyProduct.position = shelf.value[0].products.length
  shelf.value[0].products.push(copyProduct)
}


// function onDragStart(item) {
//   console.log(item)
//   draggedSku.value = item.sku
// }

function onDragEnter(index) {
  if (draggedSku.value === null) return
  moveItem(shelf.value[0].products, draggedSku.value, index)
}

function onDragEnd() {
  draggedSku.value = null
}

function moveItem(list, draggedId, toIndex) {
  const fromIndex = list.findIndex(i => i.sku === draggedId)
  if (fromIndex === -1 || fromIndex === toIndex) return

  const [item] = list.splice(fromIndex, 1)
  list.splice(toIndex, 0, item)

  list.forEach((item, index) => {
    item.position = index
  })
}

function addShelf() {
  shelf.value.push({height: shelfHeight.value, products: []})
  shelfHeight.value = null
}

function onDragStart(event, item) {
  draggedItem.value = item
}

function onDrop(targetList, list) {
  if (!draggedItem.value) return

  // adiciona na lista alvo
  list.push(draggedItem.value)
  console.log(list)
  draggedItem.value = null
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
            <v-col cols="12" class="bg-purple-accent-1 ma-2">
              <template v-for="(shelfItem, index) in shelf">
                <template v-for="imageItem in shelfItem.products">
                  <v-img
                    draggable="true"
                    @dragstart="onDragStart($event, imageItem)"
                    :src="imageItem.previewUrl"
                    :height="imageItem.height + 'px'"
                    :width="imageItem.width + 'px'"
                    class="ma-1"
                    contain
                  />
                </template>
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
