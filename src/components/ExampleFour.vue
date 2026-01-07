<script setup>
import {ref} from "vue";

const productList = ref([
  {
    "title": "Maionese Heinz 390g",
    "previewUrl": "https://phygital-files.mercafacil.com/comercial-big-oferta/uploads/produto/heinz_maionese_390g_1684dc84-5ab9-4d35-a4f6-db95408160ee.png",
    "sku": "19194518234"
  },
  {
    "title": "Ketchup Cepera 400g",
    "previewUrl": "https://phygital-files.mercafacil.com/primato/uploads/produto/ketchup_cepera_400g_tradicional_6f642c91-029c-4976-a93d-4d81393e9ca8.png",
    "sku": "8951428573583"
  },
  {
    "title": "Mobil Super 20W50",
    "previewUrl": "https://moovelub.com/mobil/storage/uploads/00000000139.png?v=1723689740035",
    "sku": "8951428573583"
  },
  {
    "title": "Chocolate",
    "previewUrl": "https://m.media-amazon.com/images/I/61yosrWwbdL._AC_UF350,350_QL80_.jpg",
    "sku": "89514285733583",
    stackable: true,
  },
])
const selectedItem = ref(null)
const draggableProductList = ref([])

function addProduct(productItem) {
  const copyProduct = JSON.parse(JSON.stringify(productItem))
  copyProduct.position = draggableProductList.value.length
  draggableProductList.value.push(copyProduct)
}


function onDragStart(event, item) {
  console.log('Dragging')
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.effectAllowed = 'move'
  selectedItem.value = event.currentTarget
}


function onDragEnd() {
  console.log("On onDragEnd");
}

function onDragLeave() {
  console.log("On onDragLeave");
}

function onDragOver(event, currentItem, index) {
  const dragged = selectedItem.value
  const target = event.currentTarget
  if (dragged === target) return

  if (dragged.contains(target)) return

  if (isBefore(dragged, target)) {
    console.log(index)
    currentItem.position = index
    target.parentNode.insertBefore(dragged, target)
  } else {
    currentItem.position = index
    target.parentNode.insertBefore(dragged, target.nextSibling)
  }
}

function isBefore(el1, el2) {
  let cur
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true
    }
  }
  return false;
}

function onDragEnter() {
  console.log("On onDragEnter");
}

</script>

<template>
  <v-container>
    <v-row>
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
          <v-row class="drop-zone w-100" no-gutters>
            <template v-if="draggableProductList.length > 0" v-for="(draggableProduct, index) in draggableProductList"
                      :key="draggableProduct.sku">
              <v-col
                draggable="true"
                cols="2"
                align-self="end"
                class="drag-el text-black cursor-grab"
                @dragstart="onDragStart($event, draggableProduct)"
                @dragover="onDragOver($event, draggableProduct, index)"
              >
                <v-img :src="draggableProduct.previewUrl" />
                <span class="text-white text-subtitle-1">{{ draggableProduct.position }}</span>
              </v-col>

            </template>
            <v-col v-else>
              <v-empty-state
                headline="Nem tem produto kkkkk"
                title="Adicione algo"
                text="Ou não né"
                image="https://i.imgflip.com/8fo1d9.png"
              ></v-empty-state>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

</template>

<style scoped>
.drop-zone {
  width: 60%;
  margin: 50px auto;
}

.drag-el {
  color: white;
}
</style>
