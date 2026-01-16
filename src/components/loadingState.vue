
<template>
  <v-empty-state icon="$success">
    <template v-slot:media>
      <v-img
        src="https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/9bd5a968-9a7d-4f21-8a59-a6cc6338f13b/ddn9q9e-f5e9335f-0821-452a-ace0-bc31a899ac9e.gif?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiIvZi85YmQ1YTk2OC05YTdkLTRmMjEtOGE1OS1hNmNjNjMzOGYxM2IvZGRuOXE5ZS1mNWU5MzM1Zi0wODIxLTQ1MmEtYWNlMC1iYzMxYTg5OWFjOWUuZ2lmIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.TObpuWcR8ur5PyNOL4KTMXxcmuSb71BJQlM6N4F-nTc"
        :height="400"
        :width="600"
      ></v-img>

    </template>

    <template v-slot:headline>
      <div class="text-h4">
        Fica tranquilo bro
      </div>
    </template>

    <template v-slot:title>
      <div class="text-h6">
        Estamos construindo a tela mais sensaciocrivel do mundo
      </div>
    </template>

    <template v-slot:text>
      <div class="text-medium-emphasis text-caption">
        Estamos buscando informações de produtos do nosso banco de dados, montando o canvas para que possa montar seus planogramas
      </div>
    </template>
  </v-empty-state>
</template>

<style scoped>

</style>
