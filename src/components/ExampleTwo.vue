<template>
  <v-row class="pa-4" dense>
    <!-- Shelf A -->
    <v-col cols="6">
      <v-card outlined>
        <v-card-title>Shelf A</v-card-title>
        <v-card-text>
          <v-list
            class="drop-area"
            @dragover.prevent="onDragOverEmpty('A')"
            @drop="onDropEmpty('A')"
          >
            <template v-if="shelfA.length">
              <v-list-item
                v-for="(item, index) in shelfA"
                :key="item.id"
                class="draggable-item"
                :class="{ dragging: draggedItem && draggedItem.id === item.id }"
                draggable="true"
                @dragstart="onDragStart(item, index, 'A')"
                @dragend="onDragEnd"
                @dragover.prevent="onDragOver(index, 'A')"
                @drop="onDrop('A', index)"
              >
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item>
            </template>
            <template v-else>
              <div class="empty-placeholder">Arraste itens aqui</div>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Shelf B -->
    <v-col cols="6">
      <v-card outlined>
        <v-card-title>Shelf B</v-card-title>
        <v-card-text>
          <v-list
            class="drop-area"
            @dragover.prevent="onDragOverEmpty('B')"
            @drop="onDropEmpty('B')"
          >
            <template v-if="shelfB.length">
              <v-list-item
                v-for="(item, index) in shelfB"
                :key="item.id"
                class="draggable-item"
                :class="{ dragging: draggedItem && draggedItem.id === item.id }"
                draggable="true"
                @dragstart="onDragStart(item, index, 'B')"
                @dragend="onDragEnd"
                @dragover.prevent="onDragOver(index, 'B')"
                @drop="onDrop('B', index)"
              >
                <v-list-item-title>{{ item.label }}</v-list-item-title>
              </v-list-item>
            </template>
            <template v-else>
              <div class="empty-placeholder">Arraste itens aqui</div>
            </template>
          </v-list>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref } from 'vue'

// Duas listas independentes
const shelfA = ref([
  { id: 1, label: 'Item A1', position: 0 },
  { id: 2, label: 'Item A2', position: 1 },
  { id: 3, label: 'Item A3', position: 2 }
])

const shelfB = ref([
  { id: 4, label: 'Item B1', position: 0 },
  { id: 5, label: 'Item B2', position: 1 }
])

// Estado do drag
const draggedItem = ref(null)
const draggedItemIndex = ref(null)
const draggedShelf = ref(null)
let targetIndex = null
let targetShelfName = null

// Drag start
function onDragStart(item, index, shelfName) {
  draggedItem.value = item
  draggedItemIndex.value = index
  draggedShelf.value = shelfName
}

// Drag end
function onDragEnd() {
  draggedItem.value = null
  draggedItemIndex.value = null
  draggedShelf.value = null
  targetIndex = null
  targetShelfName = null
}

// Drag over sobre item existente
function onDragOver(index, shelfName) {
  targetIndex = index
  targetShelfName = shelfName
}

// Drop sobre item existente
function onDrop(dropShelfName, dropIndex) {
  if (!draggedItem.value) return
  const sourceShelf = draggedShelf.value === 'A' ? shelfA.value : shelfB.value
  const destShelf = dropShelfName === 'A' ? shelfA.value : shelfB.value

  // Remove da shelf de origem
  const removedItem = sourceShelf.splice(draggedItemIndex.value, 1)[0]

  // Ajusta índice se estiver na mesma shelf e o item veio antes do dropIndex
  let insertIndex = dropIndex
  if (draggedShelf.value === dropShelfName && draggedItemIndex.value < dropIndex) {
    insertIndex--
  }

  // Insere no índice desejado
  destShelf.splice(insertIndex, 0, removedItem)

  // Atualiza posições
  destShelf.forEach((item, i) => (item.position = i))
  if (draggedShelf.value === dropShelfName) {
    sourceShelf.forEach((item, i) => (item.position = i))
  }

  onDragEnd()
}

// Drag over shelf vazia
function onDragOverEmpty(shelfName) {
  targetShelfName = shelfName
}

// Drop em shelf vazia
function onDropEmpty(shelfName) {
  if (!draggedItem.value) return
  const sourceShelf = draggedShelf.value === 'A' ? shelfA.value : shelfB.value
  const destShelf = shelfName === 'A' ? shelfA.value : shelfB.value

  // Remove da shelf de origem
  const removedItem = sourceShelf.splice(draggedItemIndex.value, 1)[0]

  // Insere no início da shelf vazia
  destShelf.splice(0, 0, removedItem)

  // Atualiza posições
  destShelf.forEach((item, i) => (item.position = i))
  if (draggedShelf.value === shelfName) {
    sourceShelf.forEach((item, i) => (item.position = i))
  }

  onDragEnd()
}
</script>

<style scoped>
.draggable-item {
  cursor: grab;
  user-select: none;
  margin-bottom: 6px;
  padding: 8px;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  transition: background 0.15s ease;
}

.draggable-item.dragging {
  opacity: 0.5;
  background-color: #d0ebff;
}

.drop-area {
  min-height: 60px; /* garante espaço para drop mesmo vazia */
  display: flex;
  flex-direction: column;
}

.empty-placeholder {
  padding: 16px;
  text-align: center;
  color: #999;
  font-style: italic;
  border: 2px dashed #ccc;
  border-radius: 4px;
  margin-bottom: 6px;
}
</style>
