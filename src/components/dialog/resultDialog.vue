<script setup>
const model = defineModel()
const props = defineProps({
  products: {
    default: []
  },
  shelf: {
    default: []
  }
})
</script>

<template>
  <v-dialog
    v-model="model"
    width="800"
  >
    <v-card title="Visão da TI">e
      <v-card-text>
        <v-expansion-panels color="error">
          <v-expansion-panel>
            <v-expansion-panel-title v-slot="{ expanded }">
              Products
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-code>
                <template v-for="(product, index) in products" :key="index">
                  {{ product }}
                  <span v-if="index < products.length - 1"><br><br></span>
                </template>
              </v-code>
            </v-expansion-panel-text>
          </v-expansion-panel>
          <v-expansion-panel>
            <v-expansion-panel-title v-slot="{ expanded }">
              Shelf
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-code>
                <template v-for="(shelfItem, index) in shelf" :key="index">
                  {{ shelfItem }}
                  <span v-if="index < shelf.length - 1"><br><br></span>
                </template>
              </v-code>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn color="error" @click="model = false">
          Sair
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>

</style>
