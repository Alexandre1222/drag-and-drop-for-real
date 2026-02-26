<script setup lang="ts">
import { ref } from "vue";
import type { Shelf } from '@/types'

const model = defineModel<boolean>()
const emit = defineEmits<{
  editShelf: [height: number, index: number]
}>()
const props = defineProps<{
  currentShelf: Shelf | null
  currentShelfIndex: number | null
}>()
const formData = ref({
  height: 0,
})

function editProduct () {
  emit('editShelf', formData.value.height, props.currentShelfIndex!)
  reset()
  model.value = false
}

function cancel(){
  reset()
  model.value = false
}

function reset(){
  formData.value = {
    height: 0,
  }
}

function initialize(){
  formData.value.height = props.currentShelf!.height
}
</script>

<template>
  <v-dialog
    v-model="model"
    @afterEnter="initialize"
    width="300"
  >
    <v-card title="Editar Produto">
      <v-card-text>
        <v-form ref="form">
          <v-row>
            <v-col cols="12">
              <v-number-input
                label="Altura"
                v-model="formData.height"
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
        <v-btn color="primary" @click="editProduct">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
