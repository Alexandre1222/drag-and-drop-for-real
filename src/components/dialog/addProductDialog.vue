<script setup lang="ts">
import { ref } from "vue";

const model = defineModel<boolean>()
const emit = defineEmits<{
  saveProduct: [products: Array<{ title: string; previewUrl: string; sku: string; height: number | null; width: number | null; depth: number | null }>]
}>()
const formData = ref({
  title: '',
  previewUrl: '',
  sku: '',
  height: null as number | null,
  width: null as number | null,
  depth: null as number | null,
})

function salvarProduto () {
  const produto = {
    title: formData.value.title,
    previewUrl: formData.value.previewUrl,
    sku: formData.value.sku,
    height: formData.value.height,
    width: formData.value.width,
    depth: formData.value.depth
  }
  emit("saveProduct", [produto])
  reset()
  model.value = false
}

function cancel(){
  reset()
  model.value = false
}

function reset(){
  formData.value = {
    title: '',
    previewUrl: '',
    sku: '',
    height: null,
    width: null,
    depth: null
  }
}
</script>

<template>
  <v-dialog
    v-model="model"
    width="auto"
  >
    <v-card title="Cadastro de Produto">
      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-text-field
                label="Nome do produto"
                v-model="formData.title"
                required
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                label="Altura"
                v-model.number="formData.height"
                type="number"
                suffix="cm"
                required
              />
            </v-col>

            <v-col cols="6">
              <v-text-field
                label="Largura"
                v-model.number="formData.width"
                type="number"
                suffix="cm"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="Profundidade"
                v-model.number="formData.depth"
                type="number"
                suffix="cm"
                required
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                label="URL da imagem"
                v-model="formData.previewUrl"
                type="url"
              />
            </v-col>

            <!-- Preview da imagem -->
            <v-col cols="12" v-if="formData.previewUrl">
              <v-img
                :src="formData.previewUrl"
                :height="formData.height + 'px'"
                :width="formData.width + 'px'"
                class="mt-4"
                cover
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn color="error" @click="cancel">
          Cancelar
        </v-btn>
        <v-btn color="primary" @click="salvarProduto">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
