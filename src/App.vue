<template>
  <v-app>
    <v-main>
      <v-container fluid class="pa-0">
        <custom-snackbar v-model="snackbar.show" :snackbar-color="snackbar.color" :snackbar-text="snackbar.text"/>
<!--        <ExampleFour/>-->
        <definitive/>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import ExampleFour from "@/components/ExampleFour.vue";
import ExampleTwo from "@/components/ExampleTwo.vue";
import ExampleSix from "@/components/ExampleSix.vue";
import Definitive from "@/components/Definitive.vue";
import CustomSnackbar from "@/components/CustomSnackbar.vue";
import {snackbarState} from "@/plugins/helper/customSnackbar.js";
const snackbar = snackbarState;
</script>
