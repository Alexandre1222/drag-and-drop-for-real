<script setup>
import {ref} from "vue";
import * as Excel from "exceljs";
const model = defineModel()
const emit = defineEmits(['updateProducts'])
const form = ref(null)
const productExcel = ref(null)
const extractedProducts = ref([])
const tableHeader = ref([])
const headerTranslateMap = {
  'nome': 'name',
  'marca': 'brand',
  'categoria': 'category',
  'subcategoria': 'subcategory',
  'altura': 'height',
  'largura': 'width',
  'profundidade': 'depth',
}
function stripedRows(row){
  return row.index % 2 === 0 ? {class: 'bg-blue-grey-lighten-5'} : {}
}

async function doImportProduct(excelFile) {
  const workbook = new Excel.Workbook()
  const buffer = await excelFile.arrayBuffer()

  await workbook.xlsx.load(buffer)

  const worksheet = workbook.getWorksheet(1)
  if (!worksheet) return

  tableHeader.value = []
  extractedProducts.value = []

  worksheet.eachRow((row, rowNumber) => {

    // HEADER
    if (rowNumber === 1) {
      row.eachCell((cell) => {
        const original = String(cell.value).trim()

        const normalized = original
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, '_')

        const translated =
          headerTranslateMap[normalized] || normalized

        tableHeader.value.push({
          title: original,
          value: translated
        })
      })
      return
    }

    // LINHAS
    const rowData = {}

    row.eachCell((cell, colNumber) => {
      const headerKey = tableHeader.value[colNumber - 1]?.value
      if (!headerKey) return

      rowData[headerKey] = cell.value
    })

    extractedProducts.value.push(rowData)
  })

  console.log(extractedProducts.value)
}

function doUpdateList(){
  emit('updateProducts', extractedProducts.value)
  reset()
  model.value = false
}

function cancel(){
  reset()
  model.value = false
}

function reset(){
  productExcel.value = null
  extractedProducts.value = []
  tableHeader.value = []
}
</script>

<template>
  <v-dialog
    v-model="model"
    width="1200"
  >
    <v-card title="Importar produtos">
      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-file-input @update:modelValue="doImportProduct($event)" v-model="productExcel" persistent-hint hint=".xlsx apenas" label="File input"></v-file-input>
            </v-col>
          </v-row>
        </v-form>
        <v-data-table density="compact" :row-props="stripedRows" :headers="tableHeader" :items="extractedProducts">
          <template v-slot:no-data>
            <v-empty-state icon="mdi-cart-off">
              <template v-slot:media>
                <v-img
                  class="ma-auto"
                  src="https://mystickermania.com/cdn/stickers/spongebob/sb-upset-fish-meme-512x512.png"
                  :height="300"
                  :width="500"
                ></v-img>

              </template>

              <template v-slot:headline>
                <div class="text-h4">
                  Não tem nada pra mostrar ainda
                </div>
              </template>

              <template v-slot:title>
                <div class="text-h6">
                  Pode adicionar um arquivo se quiser
                </div>
              </template>
            </v-empty-state>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn color="error" @click="cancel">
          Cancelar
        </v-btn>
        <v-btn color="primary" @click="doUpdateList">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
:deep() .v-table .v-table__wrapper > table > thead > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

:deep() .v-table .v-table__wrapper > table > tbody > tr > td:not(:last-child), .v-table .v-table__wrapper > table > tbody > tr > th:not(:last-child) {
  border-right: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
