<script setup lang="ts">
const snackbarModel = defineModel<boolean>()
const props = defineProps<{
  snackbarColor: string
  snackbarText: string | null
}>()
</script>

<template>
  <v-snackbar
    v-model="snackbarModel"
    location="top right"
    :color="snackbarColor"
    timeout="3000"
    variant="elevated"
  >
    <div class="d-flex align-center">
      <v-icon icon="mdi-alert-circle-outline" class="mr-2"></v-icon>
      {{ snackbarText }}
    </div>

    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="snackbarModel = false"
      >
        Fechar
      </v-btn>
    </template>
  </v-snackbar>
</template>

<style scoped>

</style>
