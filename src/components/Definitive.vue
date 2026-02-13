<script setup>
import {onMounted, onUnmounted, ref} from "vue";
import {useSound} from '@vueuse/sound';
import AddProductDialog from "@/components/dialog/addProductDialog.vue";
import EditProductDialog from "@/components/dialog/editProductDialog.vue";
import EditShelfDialog from "@/components/dialog/editShelfDialog.vue";
import ImportProductDialog from "@/components/dialog/importProductDialog.vue";
import ResultDialog from "@/components/dialog/resultDialog.vue";
import DragAndDropShelf from "@/components/dragAndDropShelf.vue";
import LoadingState from "@/components/loadingState.vue";
import productsDb from '@/plugins/database/products.json';
import decorativeElementDb from '@/plugins/database/decorativeElement.json';
import cmToPixel from "@/plugins/helper/cmToPixel.js";
import {showSnackbar} from "@/plugins/helper/customSnackbar.js";
import minecraftClick from '@/assets/sounds/minecraftClick.mp3';

const {play: addProductSound} = useSound(minecraftClick, {volume: 1, interrupt: true});

const showExpansion = ref(false);
const showProducts = ref(false);
const showAssets = ref(false);
const loading = ref(false);
const decorativeElementDialog = ref(false);

const addProductModel = ref(false);
const editProductModel = ref(false);
const editShelfModel = ref(false);
const importProductModel = ref(false);
const resultModel = ref(false);

const dragAndDropRef = ref(null);
const canvasRef = ref(null);

const currentShelf = ref(null);
const selectedShelf = ref(null);
const selectedProduct = ref(null);
const shelfIndexToDelete = ref(null);

const productList = ref(null);
const decorativeElementList = ref(null);
const shelf = ref([
  {mobiliaryElement: 'Prateleira', height: 40, depth: 0, width: 150, tickness: 2, color: '#A3C4BC', products: []},
  {mobiliaryElement: 'Prateleira', height: 40, depth: 0, width: 150, tickness: 2, color: '#E9C46A', products: []}
]);

const standSize = ref({height: 160, width: 92});

const headers = [
  {title: 'Nivel', key: 'level', align: 'start'},
  {title: 'Elemento do mobiliário', key: 'mobiliaryElement'},
  {title: 'Altura', key: 'height', align: 'center', width: 150},
  {title: 'Largura', key: 'width', align: 'center', width: 150},
  {title: 'Espessura', key: 'tickness', align: 'center', width: 150},
  {title: 'Profundidade', key: 'depth', align: 'end'},
  {title: 'Cor', key: 'color', align: 'end', width: 50},
  {title: 'Action', key: 'action', align: 'end', width: 50},
];

function editShelf(newHeight, index) {
  if (canAddShelf(newHeight)) {
    shelf.value[index].height = newHeight;
  }
}

function saveProduct(product) {
  product.forEach(p => {
    p.x = 0;
    p.y = 0;
    productList.value.push(p);
  });
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  const widthAccumulated = currentShelfProducts.reduce((acc, p) => acc + p.width, 0);
  return (productWidth + widthAccumulated) > currentShelfWidth;
}

function canAddShelf(newShelfHeight) {
  const totalHeight = shelf.value.reduce((sum, {height}) => sum + height, 0);
  const availableSpace = standSize.value.height - totalHeight;

  if (newShelfHeight > availableSpace) {
    showSnackbar(availableSpace === 0
      ? 'Não cabe! Esquece fi, já gastou todo o espaço'
      : `Não cabe! Espaço disponível: ${availableSpace} cm`);
    return false;
  }
  return true;
}

function addProduct(productItem) {
  if (productItem.label === 'category') return;

  const shelfRef = shelf.value[selectedShelf?.value ?? 0];
  const physicalProducts = shelfRef.products.filter(p => p.isPhysical !== false);
  const {width, height} = productItem;

  if (canAddProduct(physicalProducts, shelfRef.width, width)) {
    showSnackbar('Limite atingido, não é possível adicionar mais produtos');
    return;
  }

  const shelfWidthPx = cmToPixel(null, shelfRef.width).widthPx;
  const productWidthPx = cmToPixel(null, width).widthPx;
  const shelfHeightPx = cmToPixel(shelfRef.height, null).heightPx;
  const productHeightPx = cmToPixel(height, null).heightPx;

  const sortedProducts = [...physicalProducts].sort((a, b) => a.x - b.x);
  let foundX = null;

  if (sortedProducts.length === 0) {
    if (productWidthPx <= shelfWidthPx) foundX = 0;
  } else {
    if (sortedProducts[0].x >= productWidthPx) {
      foundX = 0;
    } else {
      for (let i = 0; i < sortedProducts.length; i++) {
        const current = sortedProducts[i];
        const currentWidthPx = cmToPixel(null, current.width).widthPx;
        const candidateX = current.x + currentWidthPx;
        const nextX = (i + 1 < sortedProducts.length) ? sortedProducts[i + 1].x : shelfWidthPx;

        if (nextX - candidateX >= productWidthPx) {
          foundX = candidateX;
          break;
        }
      }
    }
  }

  if (foundX === null) {
    showSnackbar('Não há espaço contínuo suficiente para encaixar este produto.');
    return;
  }

  addProductSound();
  const product = JSON.parse(JSON.stringify(productItem));
  product.position = shelfRef.products.length;
  product.x = foundX;
  product.y = shelfHeightPx - productHeightPx;

  shelfRef.products.push(product);
}

function addDecorativeElement(item) {
  const shelfRef = shelf.value[selectedShelf?.value ?? 0];
  const width = item.width ?? item.dimensions?.width ?? 0;
  const height = item.height ?? item.dimensions?.height ?? 0;

  if (!width || !height) {
    showSnackbar('Elemento decorativo inválido.');
    return;
  }

  const shelfWidthPx = cmToPixel(null, shelfRef.width).widthPx;
  const elementWidthPx = cmToPixel(null, width).widthPx;
  const shelfHeightPx = cmToPixel(shelfRef.height, null).heightPx;
  const elementHeightPx = cmToPixel(height, null).heightPx;

  let posX = 0;
  const isPhysical = item.isPhysical === true;

  if (isPhysical) {
    posX = shelfRef.products.reduce((acc, p) => {
      return acc + (p.isPhysical !== false ? cmToPixel(null, p.width).widthPx : 0);
    }, 0);

    if (canAddProduct(shelfRef.products, shelfRef.width, width)) {
      showSnackbar('Sem espaço físico na prateleira.');
      return;
    }
  } else {
    posX = (shelfWidthPx - elementWidthPx) / 2;
  }

  addProductSound();

  const newElement = {
    ...JSON.parse(JSON.stringify(item)),
    width,
    height,
    x: posX,
    y: shelfHeightPx - elementHeightPx,
    isPhysical: isPhysical,
    type: 'decorative'
  };

  shelfRef.products.push(newElement);
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
  const currentShelfData = shelf.value[index];
  const shelfHeight = cmToPixel(currentShelfData.height, null).heightPx;
  currentShelfData.products.forEach(product => {
    product.y = shelfHeight - cmToPixel(product.height, null).heightPx;
  });
}

function handleKeydown(e) {
  if (e.ctrlKey && e.key === 'k') {
    e.preventDefault();
    resultModel.value = true;
  }
}

function doHomeAction(actionMethod) {
  const actions = {
    'hide-expansion': () => showExpansion.value = !showExpansion.value,
    'hide-products': () => showProducts.value = !showProducts.value,
    'reset-position': () => dragAndDropRef.value?.resetPosition(),
    'hide-asset': () => showAssets.value = !showAssets.value
  };
  actions[actionMethod]?.();
}

function isColorDark(colorHex) {
  if (!colorHex) return false;
  const hex = colorHex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq < 128;
}

onMounted(() => {
  loading.value = true;
  productList.value = productsDb.items;
  decorativeElementList.value = decorativeElementDb.items;
  window.addEventListener('keydown', handleKeydown);
  setTimeout(() => loading.value = false, 2000);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <v-container fluid>
    <template v-if="!loading">
      <v-row>
        <v-col class="pa-0" cols="12">
          <v-card border>
            <div class="d-flex px-2 py-2 w-100 overflow-x-auto">
              <div class="d-flex flex-column justify-space-between align-center px-4">
                <div class="d-flex mb-1 gap-1">
                  <v-btn :color="showExpansion ? 'success' : 'error'" icon="mdi-form-select" title="Ocultar Expansão" variant="text" @click="doHomeAction('hide-expansion')"></v-btn>
                  <v-btn :color="showProducts ? 'success' : 'error'" icon="mdi-shopping" title="Ocultar Produtos" variant="text" @click="doHomeAction('hide-products')"></v-btn>
                  <v-btn :color="showAssets ? 'success' : 'error'" :icon="showAssets ? 'mdi-eye-off' : 'mdi-eye'" title="Exibir Ilustração" variant="text" @click="doHomeAction('hide-asset')"></v-btn>
                  <v-btn icon="mdi-auto-fix" title="Exibir Elementos Decorativos" variant="text" @click="decorativeElementDialog = true"></v-btn>
                </div>
                <span class="text-caption text-medium-emphasis text-uppercase" style="font-size: 0.65rem !important;">Exibição</span>
              </div>

              <v-divider class="my-1 mx-2" vertical></v-divider>

              <div class="d-flex flex-column justify-space-between align-center px-4">
                <div class="d-flex mb-1">
                  <v-btn-group density="compact" divided variant="outlined">
                    <v-btn icon="mdi-restore" title="Resetar Posição" variant="text" @click="doHomeAction('reset-position')"/>
                    <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-left" @click.stop="dragAndDropRef?.doFormatAlign('left', selectedShelf)"/>
                    <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-center" @click.stop="dragAndDropRef?.doFormatAlign('center', selectedShelf)"/>
                    <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-right" @click.stop="dragAndDropRef?.doFormatAlign('right', selectedShelf)"/>
                    <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-justify" @click.stop="dragAndDropRef?.doFormatAlign('justify', selectedShelf)"/>
                  </v-btn-group>
                </div>
                <span class="text-caption text-medium-emphasis text-uppercase" style="font-size: 0.65rem !important;">Canvas</span>
              </div>

              <v-divider class="my-1 mx-2" vertical></v-divider>

              <div class="d-flex flex-column justify-space-between align-center px-4">
                <div class="d-flex mb-1">
                  <v-btn icon="mdi-content-save-outline" variant="text"></v-btn>
                </div>
                <span class="text-caption text-medium-emphasis text-uppercase" style="font-size: 0.65rem !important;">Ações</span>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col v-if="showExpansion" cols="12">
          <v-expansion-panels>
            <v-expansion-panel>
              <v-expansion-panel-title v-slot="{ expanded }">
                <v-row no-gutters>
                  <v-col class="d-flex justify-start" cols="4">Desenho do módulo</v-col>
                  <v-col class="text--secondary" cols="8">
                    <v-fade-transition leave-absolute>
                      <span v-if="expanded">Customize e adicione prateleiras</span>
                      <v-row v-else no-gutters style="width: 100%">
                        <v-col class="d-flex justify-start" cols="6">Possui {{ shelf.length }} colunas</v-col>
                      </v-row>
                    </v-fade-transition>
                  </v-col>
                </v-row>
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-sheet border rounded>
                  <v-data-table :headers="headers" :items="shelf" density="compact">
                    <template v-slot:top>
                      <v-toolbar flat>
                        <v-toolbar-title>
                          <v-icon color="medium-emphasis" icon="mdi-cart-check" size="x-small" start></v-icon>
                          Módulo
                        </v-toolbar-title>
                        <v-btn @click.stop="addShelf">Adicionar prateleira</v-btn>
                      </v-toolbar>
                    </template>
                    <template v-slot:item.level="{ index }">{{ index + 1 }}</template>
                    <template v-slot:item.height="{ index }">
                      <v-text-field v-model="shelf[index].height" controlVariant="split" density="compact" hide-details type="number" @update:model-value="updateProductsPosition(index)"/>
                    </template>
                    <template v-slot:item.width="{ index }">
                      <v-text-field v-model="shelf[index].width" controlVariant="split" density="compact" hide-details type="number"/>
                    </template>
                    <template v-slot:item.tickness="{ index }">
                      <v-text-field v-model="shelf[index].tickness" controlVariant="split" density="compact" hide-details type="number"/>
                    </template>
                    <template v-slot:item.color="{ value, index }">
                      <v-dialog max-width="500">
                        <template v-slot:activator="{ props: activatorProps }">
                          <div :style="{'background-color': value}" class="pa-2" v-bind="activatorProps"/>
                        </template>
                        <template v-slot:default>
                          <v-card title="Dialog">
                            <v-card-text>
                              <v-color-picker v-model="shelf[index].color" hide-inputs></v-color-picker>
                            </v-card-text>
                          </v-card>
                        </template>
                      </v-dialog>
                    </template>
                    <template v-slot:item.action="{ index }">
                      <v-icon color="medium-emphasis" icon="mdi-delete" size="small" @click="shelf.splice(index, 1)"></v-icon>
                    </template>
                  </v-data-table>
                </v-sheet>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-col>

        <v-slide-y-transition>
          <v-card v-if="selectedProduct" border class="product-detail-card ma-4" elevation="4" max-width="350" rounded="lg">
            <div class="d-flex flex-no-wrap justify-space-between align-center">
              <v-img :src="selectedProduct.imageItem.previewUrl" height="50" width="50"></v-img>
              <div class="d-flex flex-column justify-center py-2 pr-2 w-100">
                <div>
                  <div class="text-subtitle-1 font-weight-bold text-truncate" style="max-width: 200px">
                    {{ selectedProduct.imageItem.title }}
                  </div>
                  <div class="text-caption text-medium-emphasis mb-2">
                    <template v-if="selectedProduct.imageItem.label === 'product'">
                      <v-icon icon="mdi-barcode" size="small" start/>{{ selectedProduct.imageItem.ean }}
                    </template>
                    <template v-else>
                      <div class="d-flex flex-column">
                        <div class="d-flex align-center"><v-icon icon="mdi-palette" size="small" class="mr-1" />{{ selectedProduct.imageItem.color }}</div>
                        <div class="d-flex align-center"><v-icon icon="mdi-brush" size="small" class="mr-1" />{{ selectedProduct.imageItem.dimensions.fontSize }}</div>
                      </div>
                    </template>
                  </div>
                </div>
                <div class="d-flex gap-1">
                  <v-chip class="px-1" color="primary" label size="x-small" variant="tonal">A: {{ selectedProduct.imageItem.height }}cm</v-chip>
                  <v-chip class="px-1 ml-1" color="primary" label size="x-small" variant="tonal">L: {{ selectedProduct.imageItem.width }}cm</v-chip>
                  <v-chip class="px-1 ml-1" color="primary" label size="x-small" variant="tonal">P: {{ selectedProduct.imageItem.depth ?? 0 }}cm</v-chip>
                </div>
              </div>
              <div class="pa-1 align-self-start">
                <v-btn color="grey" density="compact" icon="mdi-close" size="small" variant="text" @click="selectedProduct = null"></v-btn>
              </div>
            </div>
          </v-card>
        </v-slide-y-transition>

        <v-col cols="12">
          <v-row>
            <v-col v-if="showProducts" cols="2">
              <v-card :disabled="shelf.length === 0" color="white">
                <v-text-field bg-color="white" density="compact" hide-details label="Selecione o produto" prepend-inner-icon="mdi-magnify" single-line variant="outlined"/>
                <v-treeview :items="productList ?? []" activatable bg-color="white" border color="primary" density="compact" fluid open-on-click rounded>
                  <template v-slot:prepend="{ item }">
                    <v-icon v-if="!item?.previewUrl" :icon="item?.icon ?? 'mdi-magnify'"></v-icon>
                    <v-img v-else :src="item.previewUrl" height="50" width="50"></v-img>
                  </template>
                  <template v-slot:title="{ item }">
                    <div :draggable="!item.children" class="draggable-node" @click.stop="addProduct(item)">
                      <p :class="item.label === 'category'? 'text-subtitle-1' : 'text-subtitle-1 custom-line'">{{ item.title }}</p>
                      <p v-if="item.width && item.height" class="text-caption font-italic">{{ item.width }}cm/{{ item.height }}cm</p>
                    </div>
                  </template>
                </v-treeview>
                <v-btn block color="success" prepend-icon="mdi-plus" @click.stop="addProductModel = true">Adicionar produto</v-btn>
                <v-btn block color="warning" prepend-icon="mdi-import" @click.stop="importProductModel = true">Exportar produto</v-btn>
              </v-card>

              <v-card :disabled="shelf.length === 0" color="white">
                <v-text-field bg-color="white" density="compact" hide-details label="Selecione o elemento decorativo" prepend-inner-icon="mdi-magnify" single-line variant="outlined"/>
                <v-treeview :items="decorativeElementList ?? []" activatable bg-color="white" border color="primary" density="compact" item-value="text" open-on-click rounded>
                  <template v-slot:prepend="{ item }">
                    <v-avatar :style="{ backgroundColor: item.color || '#e0e0e0' }" class="mr-2 border" rounded="lg" size="32">
                      <v-icon :color="isColorDark(item.color) ? 'white' : 'grey-darken-3'" :icon="item.isPhysical ? 'mdi-cube-outline' : 'mdi-sticker-outline'" size="x-small"/>
                    </v-avatar>
                  </template>
                  <template v-slot:title="{ item }">
                    <div class="draggable-node py-1" @click.stop="addDecorativeElement(item)">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-subtitle-2 font-weight-bold text-truncate">{{ item.title }}</span>
                      </div>
                      <div class="d-flex align-center text-caption text-medium-emphasis mt-1">
                        <v-icon class="mr-1 opacity-60" icon="mdi-ruler-square" size="12" start/>
                        <span>{{ item.dimensions?.width }}cm <span class="text-disabled">x</span> {{ item.dimensions?.height }}cm</span>
                      </div>
                    </div>
                  </template>
                  <template v-slot:append>
                    <v-icon color="grey-lighten-1" icon="mdi-drag-vertical" size="small"></v-icon>
                  </template>
                </v-treeview>
              </v-card>
            </v-col>

            <template v-if="shelf && shelf.length > 0">
              <v-col>
                <v-sheet ref="canvasRef" class="custom-border pa-2 polka-dot" max-height="800" min-height="800">
                  <drag-and-drop-shelf ref="dragAndDropRef" v-model:selectedProduct="selectedProduct" v-model:selectedShelf="selectedShelf" v-model:shelf="shelf" :show-assets="showAssets"/>
                </v-sheet>
              </v-col>
            </template>
            <template v-else>
              <v-col>
                <v-card>
                  <v-empty-state headline="Nenhuma prateleira adicionada" icon="mdi-cart-off" title="Como você quer planogramar sem prateleiras">
                    <template v-slot:media>
                      <v-img :height="300" :width="500" class="ma-auto" src="https://mystickermania.com/cdn/stickers/spongebob/sb-upset-fish-meme-512x512.png"></v-img>
                    </template>
                  </v-empty-state>
                </v-card>
              </v-col>
            </template>
          </v-row>
        </v-col>
      </v-row>
    </template>
    <template v-else>
      <v-container class="d-flex justify-center align-center" height="90vh">
        <loading-state/>
      </v-container>
    </template>
  </v-container>

  <add-product-dialog v-model="addProductModel" @save-product="saveProduct"/>
  <edit-product-dialog v-model="editProductModel"/>
  <edit-shelf-dialog v-model="editShelfModel" :current-shelf="currentShelf" :currentShelfIndex="shelfIndexToDelete" @edit-shelf="editShelf"/>
  <import-product-dialog v-model="importProductModel" @update-products="saveProduct"/>
  <result-dialog v-model="resultModel" :products="productList" :shelf="shelf"/>
</template>

<style scoped>
.custom-line { line-height: 1.0; }
.custom-border { border: 2px solid white; }

.polka-dot {
  position: relative;
  background-color: rgba(255, 255, 255, 1);
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

.polka-dot > * { position: relative; z-index: 1; }

.product-detail-card {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 100;
}
</style>
