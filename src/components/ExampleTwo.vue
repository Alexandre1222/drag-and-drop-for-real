<script setup>
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

import {ref} from "vue";

const selectedItem = ref(null)
const colunas = ref(3)
const linhas = ref(2)
const marketRoi = 'https://png.pngtree.com/thumb_back/fh260/background/20220617/pngtree-empty-fridge-refrigerator-empty-container-photo-image_8472930.jpg'

const items = ref([
  {
    id: 1,
    title: '#1 Bulbassauro',
    url: "https://projectpokemon.org/images/normal-sprite/bulbasaur.gif",
    list: 1
  },
  {
    id: 2,
    title: '#2 Ivysaur',
    url: "https://projectpokemon.org/images/normal-sprite/ivysaur.gif",
    list: 1
  },
  {
    id: 3,
    title: '#3 Venusaur',
    url: "https://projectpokemon.org/images/normal-sprite/venusaur.gif",
    list: 1
  },
  {
    id: 5,
    title: '#4 Charmander',
    url: "https://projectpokemon.org/images/normal-sprite/charmander.gif",
    list: 1
  },
  {
    id: 6,
    title: '#5 Charmeleon',
    url: "https://projectpokemon.org/images/normal-sprite/charmeleon.gif",
    list: 1
  },
  {
    id: 7,
    title: '#6 Charizard',
    url: "https://projectpokemon.org/images/normal-sprite/charizard.gif",
    list: 1
  },
  {
    id: 8,
    title: '#7 Squirtle',
    url: "https://projectpokemon.org/images/normal-sprite/squirtle.gif",
    list: 1
  },
  {
    id: 9,
    title: '#8 Wartortle',
    url: "https://projectpokemon.org/images/normal-sprite/wartortle.gif",
    list: 1
  },
  {
    id: 10,
    title: '#9 Blastoise',
    url: "https://projectpokemon.org/images/normal-sprite/blastoise.gif",
    list: 1
  },
])

const draggableProductList = ref([])

function startDrag(event, item) {
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('skuData', item.sku)
  console.log('Comecei a mover')
  selectedItem.value = event.currentTarget
}

function onDrop(event) {
  const itemSku = event.dataTransfer.getData('skuData')
  console.log(event.dataTransfer)
  console.log(itemSku)
  const item = productList.value.find((item) => item.sku == itemSku)

  console.log('Larguei o item: ', item)
}

function handlerDragOver(e) {
  const dragged = selectedItem.value
  const target = e.currentTarget

  if (dragged === target) return

  if (dragged.contains(target)) return

  if (isBefore(dragged, target)) {
    target.parentNode.insertBefore(dragged, target)
  } else {
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

function addProduct(productItem) {

  productItem.position = draggableProductList.value?.length ?? 0
  productItem.order = draggableProductList.value?.length ?? 0

  draggableProductList.value.push(productItem)
}

function onDropProduct(event, targetProduct) {
  event.preventDefault();

  if (!selectedItem.value) return;
  if (targetProduct.stackable) {
    if (!targetProduct.stack) targetProduct.stack = [];
    targetProduct.stack.push(selectedItem.value);

    console.log('Produto empilhado:', targetProduct);
  } else {
    console.log('Produto não stackable, drop não permitido');
  }

  selectedItem.value = null;
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
      <v-col>
<!--                    <v-img :src="marketRoi"  aspect-ratio="1.2"/>-->
        <v-card>
          <v-row class="drop-zone w-100" no-gutters>
            <template v-if="draggableProductList.length > 0" v-for="draggableProduct in draggableProductList"
                      :key="draggableProduct.sku">
              <v-col
                draggable="true"
                cols="2"
                align-self="end"
                class="drag-el text-black cursor-grab"
                @dragstart="startDrag($event, draggableProduct)"
                @dragover="handlerDragOver"
              >
                <v-img :src="draggableProduct.previewUrl" />
                {{draggableProduct.position}}/{{draggableProduct.order}}
              </v-col>

            </template>
            <v-col v-else>
              <v-empty-state
                width="500"
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

  <!--  <v-row align="center" class="drop-zone" @drop="onDrop($event, 1)" no-gutters>
      <v-col
        draggable="true"
        cols="4"
        v-for="item in getList(1)"
        :key="item.id"
        class="drag-el text-black cursor-grab"
        style="font-size: 16pt"
        @dragstart="startDrag($event, item)"
        @dragenter="handleDragEnter"
        @dragend="handleDragEnd"
        @dragleave="handleDragEnd"
        @dragover="handlerDragOver"
      >
        <v-card>
          <v-card-title class="text-subtitle-1">
            {{ item.title }}
          </v-card-title>
          <v-card-item>
            <v-img  :src="item.url" height="150" width="150"/>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>-->
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
