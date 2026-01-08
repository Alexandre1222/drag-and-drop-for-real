<template>
  <v-container fluid>
    <v-row>
      <v-col cols="3" class="bg-grey-lighten-3 pa-4">
        <h3 class="mb-4">Estante</h3>

        <div class="d-flex flex-wrap gap-2">
          <v-card
            v-for="item in shelfItems"
            :key="item.id"
            class="ma-2 cursor-grab"
            elevation="2"
            draggable="true"
            @dragstart="onDragStart($event, item, 'new')"
          >
            <v-img
              :src="item.previewUrl"
              height="80"
              width="80"
              cover
            />
          </v-card>
        </div>
      </v-col>

      <v-col
        cols="9"
        class="bg-purple-accent-1 position-relative"
        style="min-height: 600px; border: 2px dashed #ccc;"
        @dragover.prevent
        @drop="onDrop"
      >
        <h3 class="ma-4 text-white">Área de Trabalho</h3>

        <v-img
          v-for="item in canvasItems"
          :key="item.uniqueId"
          :src="item.previewUrl"
          :height="item.height"
          :width="item.width"
          class="canvas-item elevation-4"
          draggable="true"
          @dragstart="onDragStart($event, item, 'move')"
          :style="{
            top: `${item.y}px`,
            left: `${item.x}px`
          }"
          contain
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';

// --- Estado ---

// Itens disponíveis na Estante (Só dados básicos, sem X/Y)
const shelfItems = ref([
  { id: 1, previewUrl: 'https://cdn.vuetifyjs.com/images/parallax/material.jpg', height: 100, width: 100 },
  { id: 2, previewUrl: 'https://cdn.vuetifyjs.com/images/cards/cooking.png', height: 100, width: 100 },
  { id: 3, previewUrl: 'https://cdn.vuetifyjs.com/images/cards/sunshine.jpg', height: 100, width: 100 },
]);

// Itens soltos no Canvas (Têm X, Y e uniqueId)
const canvasItems = ref([]);

// Controle do arrasto
const draggedMeta = reactive({
  item: null,
  type: null, // 'new' (vindo da estante) ou 'move' (já no canvas)
  offsetX: 0,
  offsetY: 0
});

// --- Métodos ---

const onDragStart = (event, item, type) => {
  draggedMeta.item = item;
  draggedMeta.type = type;

  // Calcula onde clicamos na imagem para o arrasto ser suave
  const rect = event.target.getBoundingClientRect();
  draggedMeta.offsetX = event.clientX - rect.left;
  draggedMeta.offsetY = event.clientY - rect.top;
};

const onDrop = (event) => {
  if (!draggedMeta.item) return;

  const containerRect = event.currentTarget.getBoundingClientRect();

  // Cálculo da Posição Final
  const newX = event.clientX - containerRect.left - draggedMeta.offsetX;
  const newY = event.clientY - containerRect.top - draggedMeta.offsetY;

  if (draggedMeta.type === 'new') {
    // 1. Se veio da Estante: CRIA uma cópia no Canvas
    canvasItems.value.push({
      ...draggedMeta.item, // Copia dados da imagem
      uniqueId: Date.now(), // ID único para permitir múltiplas cópias da mesma imagem
      x: newX,
      y: newY
    });
  } else if (draggedMeta.type === 'move') {
    // 2. Se já estava no Canvas: Apenas ATUALIZA a posição
    const existingItem = canvasItems.value.find(i => i.uniqueId === draggedMeta.item.uniqueId);
    if (existingItem) {
      existingItem.x = newX;
      existingItem.y = newY;
    }
  }

  // Limpa
  draggedMeta.item = null;
  draggedMeta.type = null;
};
</script>

<style scoped>
/* Estilo para a Estante */
.cursor-grab {
  cursor: grab;
}

/* Estilo para o Canvas */
.position-relative {
  position: relative !important; /* Base para o absolute */
  overflow: hidden; /* Evita scrollbar se soltar na borda */
}

/* Estilo dos itens no Canvas */
.canvas-item {
  position: absolute !important;
  cursor: move;
  /* Transição suave ao soltar */
  transition: box-shadow 0.2s;
}

.canvas-item:active {
  z-index: 999; /* Fica por cima de tudo ao arrastar */
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}
</style>
