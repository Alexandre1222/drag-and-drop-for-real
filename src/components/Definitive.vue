<script setup>
import {onMounted, ref, shallowRef, toRef} from "vue";
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import cmToPixel from "@/plugins/helper/cmToPixel.js";
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
import {stringToColour} from "@/plugins/helper/stringToColour.js";
import DragAndDropShelf from "@/components/dragAndDropShelf.vue";

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

function editShelf(newHeight, index) {
  if (!canAddShelf(newHeight)) {
    return
  }
  shelf.value[index].height = newHeight
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
                                @click="shelf.splice(index, 1)"></v-icon>
                      </template>
                    </v-data-table>
                  </v-sheet>
                </v-expansion-panel-text>
              </v-expansion-panel>
          </v-expansion-panels>
        </v-col>
        <v-col cols="12">
          <v-switch label="Exibir Ilustrações" hide-details color="primary" v-model="showAssets"/>
        </v-col>
        <v-col cols="3">
          <v-row>
            <v-col cols="12">
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
                    draggable="true"
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
            <v-col cols="12">
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
        <v-col cols="9" class="overflow-x-auto">
          <drag-and-drop-shelf v-model:shelf="shelf" :show-assets="showAssets"/>
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
