<template>
  <div class="canvas" @dragover.prevent @drop="onDrop">
    <div
      class="vertical-line"
      draggable="true"
      @dragstart="onDragStart"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    >
      <span class="handle">⋮</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Posição inicial
const position = ref({ x: 100, y: 50 });

// Armazena o deslocamento do clique dentro do item para o arraste ser fluido
let offset = { x: 0, y: 0 };

const onDragStart = (event) => {
  const rect = event.target.getBoundingClientRect();
  // Calcula onde o mouse clicou dentro do elemento
  offset.x = event.clientX - rect.left;
  offset.y = event.clientY - rect.top;

  // Define a imagem fantasma como transparente se quiser um arraste mais limpo
  event.dataTransfer.effectAllowed = "move";
};

const onDrop = (event) => {
  // Atualiza a posição final subtraindo o offset inicial
  position.value = {
    x: event.clientX - offset.x,
    y: event.clientY - offset.y
  };
};
</script>

<style scoped>
.canvas {
  width: 100vh;
  height: 400px;
  background-color: #f0f0f0;
  position: relative;
  overflow: hidden;
}

.vertical-line {
  position: absolute; /* O segredo para posicionar em qualquer lugar */
  width: 4px;
  height: 200px;
  background-color: #42b883;
  cursor: grab;
  display: flex;
  justify-content: center;
  transition: box-shadow 0.2s;
}

.vertical-line:active {
  cursor: grabbing;
}

.handle {
  background: #35495e;
  color: white;
  border-radius: 4px;
  padding: 2px 5px;
  font-size: 12px;
  position: absolute;
  top: -20px;
}
</style>
