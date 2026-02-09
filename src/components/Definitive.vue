<script setup>
import {onMounted, reactive, ref} from "vue";
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import productsDb from '@/plugins/database/products.json'
import LoadingState from "@/components/loadingState.vue";
import EditProductDialog from "@/components/dialog/editProductDialog.vue";
import EditShelfDialog from "@/components/dialog/editShelfDialog.vue";
import {useSound} from '@vueuse/sound'
import minecraftClick from '@/assets/sounds/minecraftClick.mp3'
import ImportProductDialog from "@/components/dialog/importProductDialog.vue";
import DragAndDropShelf from "@/components/dragAndDropShelf.vue";
import ResultDialog from "@/components/dialog/resultDialog.vue";
import {showSnackbar} from "@/plugins/helper/customSnackbar.js";
import gsap from 'gsap'
import oldMan from '@/assets/oldMan.png'
const {play: addProductSound} = useSound(minecraftClick, {
  volume: 1,
  interrupt: true
})
const tweened = reactive({
  number: 0
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
const enablePanning = ref(true)
const resultModel = ref(false)
const shelfIndexToDelete = ref(null)
const loading = ref(false)
const importProductModel = ref(false)
const showAssets = ref(false)
const currentShelf = ref(null)
const addProductModel = ref(false)
const editProductModel = ref(false)
const editShelfModel = ref(false)
const productList = ref(null)
const standSize = ref({
  height: 160,
  width: 92
})

const shelf = ref([
  {
    mobiliaryElement: 'Prateleira',
    height: 40,
    depth: 0,
    width: 150,
    tickness: 2,
    color: '#A3C4BC',
    products: []
  },
  {
    mobiliaryElement: 'Prateleira',
    height: 40,
    depth: 0,
    width: 150,
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
    showSnackbar(message)
    return false
  }
  return true
}

function addProduct(productItem, index = 0) {
  if (productItem.label === 'category') return
  const shelfRef = shelf.value[0]
  const {width, height} = productItem

  if (canAddProduct(shelfRef.products, shelf.value[index].width, width)) {
    showSnackbar('Limite atingido, não é possível adicionar mais produtos')
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

function updateProductsPosition(index) {
  const currentShelf = shelf.value[index]
  const shelfHeight = cmToPixel(currentShelf.height, null).heightPx
  for (const product of currentShelf.products) {
    const productHeight = cmToPixel(product.height, null).heightPx
    product.y = shelfHeight - productHeight
  }
}

onMounted(() => {
  loading.value = true
  productList.value = productsDb.items
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      resultModel.value = true
    }
  })
  setTimeout(() => {
    loading.value = false
    gsap.to(tweened, {duration: 2, number: Number(1239123912) || 0})
  }, 2000)

})
</script>

<template>
  <v-container fluid>
    <template v-if="!loading">
      <v-row>
        <v-col cols="12">
          <v-alert
            density="compact"
            title="Ta esperando o que meu fi?"
            type="success"
            closable
          >
            <v-row class="d-flex justify-start align-center">
              <v-col cols="1">
                <v-img
                  class="spin"
                  :src="oldMan"
                   height="90"/>
              </v-col>
              <v-col>
                <p>Ja somos mais de <span class="text-h4 font-weight-black rainbow-text">{{
                    tweened.number.toLocaleString('pt-br')
                  }}</span> usuários
                  ativos</p>
              </v-col>
            </v-row>
          </v-alert>
        </v-col>
        <v-col cols="12">
          <v-expansion-panels>
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
                    <template v-slot:item.level="{ index }">
                      {{ index + 1 }}
                    </template>

                    <template v-slot:item.height="{ index }">
                      <v-text-field
                        controlVariant="split"
                        density="compact"
                        type="number"
                        v-model="shelf[index].height"
                        @update:model-value="updateProductsPosition(index)"
                        hide-details
                      />
                    </template>

                    <template v-slot:item.width="{ index }">
                      <v-text-field
                        controlVariant="split"
                        density="compact"
                        type="number"
                        v-model="shelf[index].width"
                        hide-details
                      />
                    </template>

                    <template v-slot:item.tickness="{ index }">
                      <v-text-field
                        controlVariant="split"
                        density="compact"
                        type="number"
                        v-model="shelf[index].tickness"
                        hide-details
                      />
                    </template>

                    <template v-slot:item.color="{ value,index }">
                      <v-dialog max-width="500">
                        <template v-slot:activator="{ props: activatorProps }">
                          <div :style="{'background-color': value}" class="pa-2" v-bind="activatorProps"/>
                        </template>

                        <template v-slot:default>
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
          <v-row>
            <v-col>
              <v-switch label="Exibir Ilustrações" hide-details color="primary" v-model="showAssets"/>
            </v-col>
            <v-col>
              <v-switch label="Mover tela" hide-details color="primary" v-model="enablePanning"/>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="3">
          <v-row>
            <v-col cols="12">
              <v-card color="white" :disabled="shelf.length === 0">
                <v-text-field variant="outlined" bg-color="white" density="compact" label="Selecione o produto"
                              single-line
                              prepend-inner-icon="mdi-magnify" hide-details/>
                <v-treeview
                  :items="productList ?? []"
                  density="compact"
                  color="primary"
                  bg-color="white"
                  activatable
                  border
                  fluid
                  open-on-click
                  rounded
                >
                  <template v-slot:prepend="{ item }">
                    <v-icon v-if="!item?.previewUrl" :icon="item?.icon ?? 'mdi-magnify'"></v-icon>
                    <v-img v-else :src="item.previewUrl" width="50" height="50"></v-img>
                  </template>

                  <template v-slot:title="{ item }">
                    <div
                      class="draggable-node"
                      :draggable="!item.children"
                      @click.stop="addProduct(item)"
                    >
                      <p :class="item.label === 'category'? 'text-subtitle-1' : 'text-subtitle-1 custom-line'">
                        {{ item.title }}
                      </p>
                      <p v-if="item.width && item.height" class="text-caption font-italic">
                        {{ item.width }}cm/{{ item.height }}cm
                      </p>
                    </div>
                  </template>
                </v-treeview>
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
        <v-col cols="9">
          <drag-and-drop-shelf v-model:shelf="shelf" v-model:allowPanning="enablePanning" :show-assets="showAssets"/>
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

  <result-dialog v-model="resultModel" :products="productList" :shelf="shelf"/>
</template>

<style scoped>
.custom-line {
  line-height: 1.0;
}

.rainbow-text {
  background: linear-gradient(
    270deg,
    #ff0000,
    #ff9900,
    #ffee00,
    #33cc33,
    #00ccff,
    #6633ff,
    #ff33cc
  );
  background-size: 400% 400%;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;

  animation: rainbow .5s ease infinite;
}

@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}


.spin {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
