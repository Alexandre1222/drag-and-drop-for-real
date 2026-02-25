<template>
  <v-dialog v-model="dialog" max-width="550px" persistent>
    <v-card class="elevation-4">
      <v-card-title class="text-subtitle-1 font-weight-bold d-flex justify-space-between align-center border-b">
        <div class="d-flex align-center">
          <v-icon icon="mdi-shape-outline" size="small" class="mr-2 text-primary"></v-icon>
          Elemento decorativo
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" density="comfortable" @click="dialog = false"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4 custom-scrollbar" style="max-height: 75vh; overflow-y: auto;">
        
        <div class="preview-container d-flex justify-center align-center bg-grey-lighten-4 rounded border mb-4">
          <div :style="previewStyle" class="d-flex justify-center align-center overflow-hidden">
            <span v-if="form.tipo !== 'Linha'" class="text-truncate px-2" :style="{ color: textColor }">
              {{ form.texto }}
            </span>
          </div>
        </div>

        <v-row dense class="mb-2">
          <v-col cols="12">
            <v-text-field label="Nome" v-model="form.nome" density="compact" variant="outlined" hide-details></v-text-field>
          </v-col>
          <v-col cols="12">
            <v-select
              label="Selecione o tipo"
              :items="['rectangle', 'circle', 'line']"
              v-model="form.tipo"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
          </v-col>
        </v-row>

        <fieldset class="custom-fieldset">
          <legend class="custom-legend">Tamanho</legend>
          
          <v-row dense>
            <v-col cols="6">
              <v-text-field v-model="form.largura" label="Largura" suffix="cm" density="compact" variant="outlined" type="number" min="1" hide-details></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model="form.altura" :disabled="form.tipo === 'Linha'" label="Altura" suffix="cm" density="compact" variant="outlined" type="number" min="1" hide-details></v-text-field>
            </v-col>
          </v-row>   
        </fieldset>

        <fieldset class="custom-fieldset">
          <legend class="custom-legend">Opções</legend>
          <v-row justify="space-around" no-gutters class="py-2">
            
            <v-col cols="auto" class="text-center">
              <v-menu :close-on-content-click="false" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" stacked variant="text" size="large" class="rounded-lg hover-bg">
                    <v-icon :color="form.corLimite" size="x-large" class="mb-1 border rounded pa-1">mdi-border-all</v-icon>
                    <span class="text-caption text-none">Limite</span>
                  </v-btn>
                </template>
                <v-card>
                  <v-color-picker v-model="form.corLimite" elevation="0"></v-color-picker>
                </v-card>
              </v-menu>
            </v-col>

            <v-col cols="auto" class="text-center">
              <v-menu :close-on-content-click="false" location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" stacked variant="text" size="large" class="rounded-lg hover-bg">
                    <v-icon :color="form.corPreenchimento" size="x-large" class="mb-1 border rounded pa-1">mdi-format-color-fill</v-icon>
                    <span class="text-caption text-none">Preenchimento</span>
                  </v-btn>
                </template>
                <v-card>
                  <v-color-picker v-model="form.corPreenchimento" elevation="0"></v-color-picker>
                </v-card>
              </v-menu>
            </v-col>

            <v-col cols="auto" class="text-center">
              <v-menu :close-on-content-click="false" location="bottom" width="250">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" stacked variant="text" size="large" class="rounded-lg hover-bg">
                    <v-icon color="indigo-lighten-1" size="x-large" class="mb-1">mdi-format-text</v-icon>
                    <span class="text-caption text-none">Texto</span>
                  </v-btn>
                </template>
                <v-card class="pa-3">
                  <v-text-field v-model="form.texto" label="Texto do elemento" density="compact" variant="outlined" hide-details autofocus></v-text-field>
                </v-card>
              </v-menu>
            </v-col>
          </v-row>
        </fieldset>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="justify-end px-4 py-3">
        <v-btn color="error" variant="text" @click="dialog = false" class="text-none font-weight-bold px-4">
          <v-icon size="large" class="mr-2">mdi-close-thick</v-icon> Cancelar
        </v-btn>
        <v-btn color="success" variant="elevated" @click="save" class="text-none font-weight-bold px-4">
          <v-icon size="large" class="mr-2">mdi-check-bold</v-icon> Aceitar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import cmToPixel from "@/plugins/helper/cmToPixel.js";
const dialog = defineModel()
const emits = defineEmits(['save-product'])

const form = ref({
  nome: 'Elemento decorativo 1',
  tipo: 'Rectângulo',
  largura: 20,
  altura: 20,
  corPreenchimento: '#2196F3', // Azul padrão
  corLimite: '#000000',        // Borda preta
  texto: 'Preview'
})

// Calcula estilos visuais dinâmicos
const previewStyle = computed(() => {
  // Escala para caber na div de preview (ex: 1cm = 2px no preview, para caber bem visualmente)
  const scale = 2
  const { heightPx, widthPx } = cmToPixel(form.value.altura, form.value.largura);
  
  const baseStyle = {
    transition: 'all 0.3s ease',
    maxWidth: '100%',
    maxHeight: '100%',
  }

  if (form.value.tipo === 'line') {
    return {
      ...baseStyle,
      width: `${widthPx}px`,
      height: '4px', // Linhas têm altura fixa visualmente
      backgroundColor: form.value.corPreenchimento,
      borderRadius: '2px'
    }
  }

  return {
    ...baseStyle,
    width: `${widthPx}px`,
    height: `${heightPx}px`,
    backgroundColor: form.value.corPreenchimento,
    border: `3px solid ${form.value.corLimite}`,
    borderRadius: form.value.tipo === 'circle' ? '50%' : '4px',
  }
})

// Define se o texto será branco ou preto dependendo do quão escura é a cor de fundo
const textColor = computed(() => {
  const hex = form.value.corPreenchimento.replace('#', '')
  if (hex.length !== 6) return '#000000'
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return yiq >= 128 ? '#000000' : '#ffffff'
})

const save = () => {
  // Monta o objeto com as informações para emitir para a view principal
  emits('save-decorative-element', [{
    title: form.value.nome,
    type: 'decorative',
    isPhysical: false,
    width: Number(form.value.largura),
    height: form.value.tipo === 'Linha' ? 0.5 : Number(form.value.altura),
    color: form.value.corPreenchimento,
    borderColor: form.value.corLimite,
    text: form.value.texto,
    shape: form.value.tipo.toLowerCase(),
    dimensions: {
      fontSize:'15pt',
      width: Number(form.value.largura),
      height: form.value.tipo === 'Linha' ? 0.5 : Number(form.value.altura)
    }
  }])
  dialog.value = false
}
</script>

<style scoped>
.preview-container {
  height: 180px;
  background-image: radial-gradient(#d7d7dc 1px, transparent 1px);
  background-size: 10px 10px;
}

.custom-fieldset {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 16px 12px 12px;
  margin-bottom: 20px;
  position: relative;
  background-color: transparent;
}

.custom-legend {
  font-size: 0.75rem;
  font-weight: 700;
  color: #757575;
  padding: 0 6px;
  width: auto;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.hover-bg:hover {
  background-color: #f5f5f5 !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #bdbdbd;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #9e9e9e;
}
</style>