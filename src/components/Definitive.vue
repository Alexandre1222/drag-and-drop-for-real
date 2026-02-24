<script setup>
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import { useSound } from '@vueuse/sound';
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
import { showSnackbar } from "@/plugins/helper/customSnackbar.js";
import minecraftClick from '@/assets/sounds/minecraftClick.mp3';

const { play: addProductSound } = useSound(minecraftClick, { volume: 1, interrupt: true });

const leftTab = ref('products');
const showExpansion = ref(false);
const showProducts = ref(false);
const showAssets = ref(false);
const loading = ref(false);

const addProductModel = ref(false);
const editProductModel = ref(false);
const editShelfModel = ref(false);
const importProductModel = ref(false);
const resultModel = ref(false);

const dragAndDropRef = ref(null);
const currentShelf = ref(null);
const shelfIndexToDelete = ref(null);
const productList = ref(null);
const decorativeElementList = ref(null);

const shelf = ref([
  { mobiliaryElement: 'Prateleira', height: 40, depth: 0, width: 150, tickness: 2, color: '#A3C4BC', products: [] },
  { mobiliaryElement: 'Prateleira', height: 40, depth: 0, width: 150, tickness: 2, color: '#E9C46A', products: [] }
]);
const selectedShelf = ref(null);
const selectedProduct = ref(null);

const standSize = ref({ height: 160, width: 92 });

function getShelfMinWidth(index) {
  if (!shelf.value[index]) return 1;
  const physicalProducts = shelf.value[index].products.filter(p => p.isPhysical !== false);
  return physicalProducts.reduce((sum, p) => sum + p.width, 0) || 1;
}

function getShelfMinHeight(index) {
  if (!shelf.value[index]) return 1;
  const physicalProducts = shelf.value[index].products.filter(p => p.isPhysical !== false);
  return physicalProducts.length > 0 ? Math.max(...physicalProducts.map(p => p.height)) : 1;
}

function validateShelfDimension(index, field, val) {
  const newValue = Number(val);
  if (isNaN(newValue) || newValue <= 0) return;

  const currentShelfData = shelf.value[index];

  if (field === 'width') {
    const minWidth = getShelfMinWidth(index);
    if (newValue < minWidth) {
      showSnackbar(`A largura mínima é ${minWidth}cm devido aos produtos.`);
      currentShelfData.width = -1;
      nextTick(() => currentShelfData.width = minWidth);
    } else {
      currentShelfData.width = newValue;
    }
  } else if (field === 'height') {
    const minHeight = getShelfMinHeight(index);

    if (newValue < minHeight) {
      showSnackbar(`A altura mínima é ${minHeight}cm devido aos produtos.`);
      currentShelfData.height = -1;
      nextTick(() => {
        currentShelfData.height = minHeight;
        updateProductsPosition(index);
      });
    }else {
      currentShelfData.height = newValue;
      updateProductsPosition(index);
    }
  }
}

function editShelf(newHeight, index) {
  validateShelfDimension(index, 'height', newHeight);
}

function addShelf() {
  shelf.value.push({
    mobiliaryElement: 'Prateleira', height: 40, depth: 0, width: 40, tickness: 2, color: '#E9C46A', products: []
  });
}

function updateProductsPosition(index) {
  const currentShelfData = shelf.value[index];
  const shelfHeight = cmToPixel(currentShelfData.height, null).heightPx;
  currentShelfData.products.forEach(product => {
    product.y = shelfHeight - cmToPixel(product.height, null).heightPx;
  });
}

function canAddProduct(currentShelfProducts, currentShelfWidth, productWidth) {
  const widthAccumulated = currentShelfProducts.reduce((acc, p) => acc + p.width, 0);
  return (productWidth + widthAccumulated) > currentShelfWidth;
}

function addProduct(productItem) {
  if (productItem.label === 'category') return;

  const shelfRef = shelf.value[selectedShelf.value ?? 0];
  const physicalProducts = shelfRef.products.filter(p => p.isPhysical !== false);
  const { width, height } = productItem;

  if (height > shelfRef.height) {
    return showSnackbar(`O produto tem ${height}cm, mas a prateleira tem apenas ${shelfRef.height}cm de altura.`);
  }

  if (canAddProduct(physicalProducts, shelfRef.width, width)) {
    return showSnackbar('Limite de espaço atingido na prateleira.');
  }

  const shelfWidthPx = cmToPixel(null, shelfRef.width).widthPx;
  const productWidthPx = cmToPixel(null, width).widthPx;
  const shelfHeightPx = cmToPixel(shelfRef.height, null).heightPx;
  const productHeightPx = cmToPixel(height, null).heightPx;

  const sortedProducts = [...physicalProducts].sort((a, b) => a.x - b.x);
  let foundX = null;

  if (sortedProducts.length === 0 || sortedProducts[0].x >= productWidthPx) {
    foundX = 0;
  } else {
    for (let i = 0; i < sortedProducts.length; i++) {
      const current = sortedProducts[i];
      const candidateX = current.x + cmToPixel(null, current.width).widthPx;
      const nextX = sortedProducts[i + 1]?.x ?? shelfWidthPx;

      if (nextX - candidateX >= productWidthPx) {
        foundX = candidateX;
        break;
      }
    }
  }

  if (foundX === null) {
    return showSnackbar('Não há espaço contínuo suficiente para encaixar este produto.');
  }

  addProductSound();
  shelfRef.products.push({
    ...JSON.parse(JSON.stringify(productItem)),
    position: shelfRef.products.length,
    x: foundX,
    y: shelfHeightPx - productHeightPx,
    isPhysical: true
  });
}

function addDecorativeElement(item) {
  const shelfRef = shelf.value[selectedShelf.value ?? 0];
  const width = item.width ?? item.dimensions?.width ?? 0;
  const height = item.height ?? item.dimensions?.height ?? 0;

  if (!width || !height) return showSnackbar('Elemento decorativo inválido.');
  if (height > shelfRef.height) {
    return showSnackbar(`O elemento tem ${height}cm, mas a prateleira tem apenas ${shelfRef.height}cm de altura.`);
  }

  const shelfWidthPx = cmToPixel(null, shelfRef.width).widthPx;
  const elementWidthPx = cmToPixel(null, width).widthPx;
  const shelfHeightPx = cmToPixel(shelfRef.height, null).heightPx;
  const elementHeightPx = cmToPixel(height, null).heightPx;

  let posX = 0;
  const isPhysical = item.isPhysical === true;

  if (isPhysical) {
    posX = shelfRef.products.reduce((acc, p) => acc + (p.isPhysical !== false ? cmToPixel(null, p.width).widthPx : 0), 0);
    if (canAddProduct(shelfRef.products, shelfRef.width, width)) {
      return showSnackbar('Sem espaço físico na prateleira.');
    }
  } else {
    posX = (shelfWidthPx - elementWidthPx) / 2;
  }

  addProductSound();
  shelfRef.products.push({
    ...JSON.parse(JSON.stringify(item)),
    width,
    height,
    x: posX,
    y: shelfHeightPx - elementHeightPx,
    isPhysical,
    type: 'decorative'
  });
}

function saveProduct(product) {
  product.forEach(p => {
    p.x = 0;
    p.y = 0;
    productList.value.push(p);
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
  return ((r * 299) + (g * 587) + (b * 114)) / 1000 < 128;
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
  <v-container fluid class="pa-0 h-screen d-flex flex-column">
    <template v-if="!loading">

      <v-toolbar density="compact" border elevation="1" class="bg-black">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold ml-2">Planoghini</v-toolbar-title>
        <v-divider vertical class="mx-4 my-2"></v-divider>

        <v-btn-group density="compact" variant="flat">
          <v-btn :color="showProducts ? 'primary' : 'default'" @click="doHomeAction('hide-products')" prepend-icon="mdi-library">Biblioteca</v-btn>
          <v-btn :color="showExpansion ? 'primary' : 'default'" @click="doHomeAction('hide-expansion')" prepend-icon="mdi-tune">Propriedades</v-btn>
          <v-btn :color="showAssets ? 'primary' : 'default'" @click="doHomeAction('hide-asset')" :prepend-icon="showAssets ? 'mdi-eye' : 'mdi-eye-off'">Ilustração</v-btn>
        </v-btn-group>

        <v-spacer></v-spacer>

        <v-btn-group density="compact" variant="outlined" class="mr-4">
          <v-btn icon="mdi-restore" title="Resetar Posição" @click="doHomeAction('reset-position')"/>
          <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-left" @click.stop="dragAndDropRef?.doFormatAlign('left', selectedShelf)"/>
          <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-center" @click.stop="dragAndDropRef?.doFormatAlign('center', selectedShelf)"/>
          <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-right" @click.stop="dragAndDropRef?.doFormatAlign('right', selectedShelf)"/>
          <v-btn :disabled="selectedShelf == null" icon="mdi-format-align-justify" @click.stop="dragAndDropRef?.doFormatAlign('justify', selectedShelf)"/>
        </v-btn-group>

        <v-btn color="success" prepend-icon="mdi-content-save" variant="flat" class="mr-2">Salvar</v-btn>
      </v-toolbar>

      <v-row no-gutters class="flex-grow-1 overflow-hidden">

        <v-col v-if="showProducts" cols="3" md="2">
          <v-tabs v-model="leftTab" color="primary" grow density="compact" class="border-b">
            <v-tab value="products"><v-icon start>mdi-shopping</v-icon> Produtos</v-tab>
            <v-tab value="decor"><v-icon start>mdi-auto-fix</v-icon> Decoração</v-tab>
          </v-tabs>

          <v-window v-model="leftTab" class="flex-grow-1 overflow-y-auto">
            <v-window-item value="products">
              <v-text-field bg-color="grey-lighten-4" density="compact" hide-details label="Buscar produto" prepend-inner-icon="mdi-magnify" single-line variant="outlined" class="mb-2"/>
              <div class="flex-grow-1 overflow-y-auto">
                <v-treeview :items="productList ?? []" activatable color="primary" density="compact" item-value="title" open-on-click rounded>
                  <template v-slot:prepend="{ item }">
                    <v-icon v-if="!item?.previewUrl" :icon="item?.icon ?? 'mdi-package-variant-closed'"></v-icon>
                    <v-img v-else :src="item.previewUrl" height="40" width="40" class="rounded"></v-img>
                  </template>
                  <template v-slot:title="{ item }">
                    <div :draggable="!item.children" class="draggable-node py-1" @click.stop="addProduct(item)">
                      <div class="text-subtitle-2 text-truncate font-weight-medium">{{ item.title }}</div>
                      <div v-if="item.width && item.height" class="text-caption text-medium-emphasis">{{ item.width }}x{{ item.height }}cm</div>
                    </div>
                  </template>
                </v-treeview>
              </div>
              <div class="mt-auto pt-2">
                <v-btn block color="success" variant="tonal" prepend-icon="mdi-plus" class="mb-2" @click.stop="addProductModel = true">Adicionar</v-btn>
                <v-btn block color="warning" variant="tonal" prepend-icon="mdi-import" @click.stop="importProductModel = true">Importar</v-btn>
              </div>
            </v-window-item>

            <v-window-item value="decor">
              <v-text-field bg-color="grey-lighten-4" density="compact" hide-details label="Buscar decoração" prepend-inner-icon="mdi-magnify" single-line variant="outlined" class="mb-2"/>
              <v-treeview :items="decorativeElementList ?? []" activatable color="primary" density="compact" item-value="title" open-on-click rounded>
                <template v-slot:prepend="{ item }">
                  <v-avatar :style="{ backgroundColor: item.color || '#e0e0e0' }" class="mr-2 border" rounded="lg" size="32">
                    <v-icon :color="isColorDark(item.color) ? 'white' : 'grey-darken-3'" :icon="item.isPhysical ? 'mdi-cube-outline' : 'mdi-sticker-outline'" size="x-small"/>
                  </v-avatar>
                </template>
                <template v-slot:title="{ item }">
                  <div class="draggable-node py-1" @click.stop="addDecorativeElement(item)">
                    <div class="text-subtitle-2 font-weight-medium text-truncate">{{ item.title }}</div>
                    <div class="text-caption text-medium-emphasis">
                      <v-icon icon="mdi-ruler-square" size="small" class="mr-1"/>{{ item.dimensions?.width }}x{{ item.dimensions?.height }}cm
                    </div>
                  </div>
                </template>
              </v-treeview>
            </v-window-item>
          </v-window>
        </v-col>

        <v-col class="h-100 position-relative overflow-hidden d-flex justify-center bg-grey-lighten-3 polka-dot">
          <template v-if="shelf && shelf.length > 0">
            <v-sheet class="pa-4 w-100 h-100 polka-dot">
              <drag-and-drop-shelf ref="dragAndDropRef" v-model:selectedProduct="selectedProduct" v-model:selectedShelf="selectedShelf" v-model:shelf="shelf" :show-assets="showAssets"/>
            </v-sheet>
          </template>
          <template v-else>
            <div class="ma-auto text-center">
              <v-img :height="200" :width="200" class="mx-auto" src="https://mystickermania.com/cdn/stickers/spongebob/sb-upset-fish-meme-512x512.png"></v-img>
              <h2 class="text-h6 mt-2">Nenhuma prateleira adicionada</h2>
              <v-btn color="primary" class="mt-4" prepend-icon="mdi-plus" @click="addShelf">Criar Prateleira</v-btn>
            </div>
          </template>
        </v-col>

        <v-slide-x-reverse-transition>
          <v-col v-if="showExpansion || selectedProduct" cols="3" md="3" lg="2" class="border-s bg-white h-100 d-flex flex-column overflow-y-auto">

            <template v-if="selectedProduct">
              <v-toolbar density="compact" color="black" class="text-white">
                <v-toolbar-title class="text-subtitle-2">Propriedades do Item</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-close" variant="text" size="small" @click="selectedProduct = null"></v-btn>
              </v-toolbar>

              <div class="pa-4 text-center">
                <v-img :src="selectedProduct.imageItem.previewUrl" height="120" class="bg-grey-lighten-4 rounded border mb-3 mx-auto"></v-img>
                <h3 class="text-subtitle-1 font-weight-bold">{{ selectedProduct.imageItem.title }}</h3>

                <div class="text-caption text-medium-emphasis mt-1">
                  <template v-if="selectedProduct.imageItem.label === 'product'">
                    <v-icon icon="mdi-barcode" size="small" class="mr-1"/>{{ selectedProduct.imageItem.ean }}
                  </template>
                  <template v-else>
                    <div class="d-flex flex-column">
                      <div class="d-flex align-center justify-center"><v-icon icon="mdi-palette" size="small" class="mr-1" />{{ selectedProduct.imageItem.color }}</div>
                      <div class="d-flex align-center justify-center"><v-icon icon="mdi-brush" size="small" class="mr-1" />{{ selectedProduct.imageItem.dimensions.fontSize }}</div>
                    </div>
                  </template>
                </div>
              </div>
              <v-divider></v-divider>
              <div class="pa-4">
                <div class="text-caption font-weight-bold text-uppercase mb-2">Dimensões (cm)</div>
                <v-row dense>
                  <v-col cols="6"><span class="font-weight-bold">Altura:</span> {{ selectedProduct.imageItem.height }}</v-col>
                  <v-col cols="6"><span class="font-weight-bold">Largura:</span> {{ selectedProduct.imageItem.width }}</v-col>
                  <v-col cols="6"><span class="font-weight-bold">Profundidade:</span> {{ selectedProduct.imageItem.depth }}</v-col>
                </v-row>
              </div>
            </template>

            <template v-else-if="showExpansion">
              <v-toolbar density="compact" color="blue-grey-lighten-5">
                <v-toolbar-title class="text-subtitle-2">Gerenciar Módulo</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn icon="mdi-plus" variant="text" size="small" color="success" @click.stop="addShelf" title="Adicionar Prateleira"></v-btn>
              </v-toolbar>

              <div class="pa-2 h-100 bg-black">
                <v-expansion-panels variant="accordion" class="border rounded">
                  <v-expansion-panel v-for="(shelfItem, index) in shelf" :key="index">
                    <v-expansion-panel-title class="px-3 py-2">
                      <div class="d-flex align-center w-100">
                        <v-avatar size="16" :color="shelfItem.color" class="mr-2"></v-avatar>
                        <span class="text-body-2 font-weight-medium">Nível {{ index + 1 }}</span>
                        <v-spacer></v-spacer>
                        <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click.stop="shelf.splice(index, 1)"></v-btn>
                      </div>
                    </v-expansion-panel-title>
                    <v-expansion-panel-text class="px-0 py-2 bg-grey-lighten-4">
                      <v-row dense class="px-2">
                        <v-col cols="6">
                          <v-text-field v-model="shelfItem.height" label="Altura" density="compact" bg-color="white" variant="outlined" hide-details type="number" :min="getShelfMinHeight(index)" @update:model-value="validateShelfDimension(index, 'height', $event)"/>
                        </v-col>
                        <v-col cols="6">
                          <v-text-field v-model="shelfItem.width" label="Largura" density="compact" bg-color="white" variant="outlined" hide-details type="number" :min="getShelfMinWidth(index)" @update:model-value="validateShelfDimension(index, 'width', $event)"/>
                        </v-col>
                        <v-col cols="6">
                          <v-text-field v-model="shelfItem.tickness" label="Espessura" density="compact" bg-color="white" variant="outlined" hide-details type="number"/>
                        </v-col>
                        <v-col cols="6">
                          <v-menu :close-on-content-click="false">
                            <template v-slot:activator="{ props }">
                              <v-btn v-bind="props" block height="40" variant="outlined" :color="shelfItem.color" class="bg-white">Cor</v-btn>
                            </template>
                            <v-color-picker v-model="shelfItem.color" hide-inputs></v-color-picker>
                          </v-menu>
                        </v-col>
                      </v-row>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </div>
            </template>
            
          </v-col>
        </v-slide-x-reverse-transition>

      </v-row>
    </template>

    <template v-else>
      <v-container class="d-flex justify-center align-center h-100">
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
.h-screen { height: 100vh; }
.custom-line { line-height: 1.1; }
.grayscale { filter: grayscale(100%); }

.polka-dot {
  background-color: #f5f5f5;
  background-image: radial-gradient(#d7d7dc 2px, transparent 1px);
  background-size: 20px 20px;
}

.draggable-node {
  cursor: grab;
  transition: background-color 0.2s;
  border-radius: 4px;
}
.draggable-node:hover {
  background-color: rgba(25, 118, 210, 0.05);
}
.draggable-node:active {
  cursor: grabbing;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}
</style>