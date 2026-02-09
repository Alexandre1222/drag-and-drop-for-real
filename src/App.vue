<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <custom-snackbar v-model="snackbar.show" :snackbar-color="snackbar.color" :snackbar-text="snackbar.text"/>
        <definitive/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import Definitive from "@/components/Definitive.vue";
import CustomSnackbar from "@/components/CustomSnackbar.vue";
import {snackbarState} from "@/plugins/helper/customSnackbar.js";
const snackbar = snackbarState;
</script>
