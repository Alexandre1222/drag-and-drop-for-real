<template>
  <div class="container">
    <h2>Drag & Drop</h2>

    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="item"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragenter.prevent="onDragEnter(index)"
      @dragend="onDragEnd"
    >
      {{ item.name }} — position: {{ item.position }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, name: 'Item A', position: 0 },
  { id: 2, name: 'Item B', position: 1 },
  { id: 3, name: 'Item C', position: 2 },
  { id: 4, name: 'Item D', position: 3 }
])

const draggedIndex = ref(null)

function moveItem(list, from, to) {
  if (from === to) return

  const item = list.splice(from, 1)[0]
  list.splice(to, 0, item)

  list.forEach((item, index) => {
    item.position = index
  })
}

function onDragStart(index) {
  draggedIndex.value = index
}

function onDragEnter(index) {
  if (draggedIndex.value === null) return

  moveItem(items.value, draggedIndex.value, index)
  draggedIndex.value = index
}

function onDragEnd() {
  draggedIndex.value = null
}
</script>

<style scoped>
.container {
  width: 300px;
  margin: 40px auto;
}

.item {
  padding: 10px;
  margin-bottom: 6px;
  border: 1px solid #ccc;
  background: #f9f9f9;
  color: blue;
  cursor: grab;
  user-select: none;
}

.item:active {
  cursor: grabbing;
  background: #eaeaea;
}
</style>
