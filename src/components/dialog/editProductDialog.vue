<script setup lang="ts">
import { ref } from "vue";

const model = defineModel<boolean>()
const emit = defineEmits<{
  saveProduct: [product: { quantity: string; stackable: boolean }]
}>()
const formData = ref({
  quantity: '',
  stackable: false,
  depth: null as number | null,
})

function editarProduto () {
  reset()
  model.value = false
}

function cancel(){
  reset()
  model.value = false
}

function reset(){
  formData.value = {
    quantity: '',
    stackable: false,
    depth: null
  }
}
</script>

<template>
  <v-dialog
    v-model="model"
    width="auto"
  >
    <v-card title="Editar Produto">
      <v-card-text>
        <v-form ref="form">
          <v-row>
<!--            <v-col cols="12">-->
<!--              <v-switch v-model="formData.stackable" label="Empilhavel?" color="primary"></v-switch>-->
<!--            </v-col>-->
            <v-col cols="12">
              <v-number-input
                label="Medida"
                :disabled="!formData.stackable"
                v-model.number="formData.depth"
                required
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
        <v-btn color="primary" @click="editarProduto">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
