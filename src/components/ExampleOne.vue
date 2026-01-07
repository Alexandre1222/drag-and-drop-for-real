<script setup>
import { useDraggable } from '@vueuse/core'
import { useTemplateRef } from 'vue'
import vinho from '@/assets/alcool.png'

const el = useTemplateRef('el')

const { x, y, style } = useDraggable(el, {
  preventDefault: true,
  initialValue: { x: 10, y: 10 },
})
</script>

<template>
  <div ref="el" :style="style" style="position: fixed ;z-index: 9999">
    <v-img :src="vinho" width="300" height="300"/>
  </div>

  <v-img
    src="https://png.pngtree.com/thumb_back/fh260/background/20220617/pngtree-empty-fridge-refrigerator-empty-container-photo-image_8472930.jpg"
    width="1000"
    height="1000"/>
</template>
