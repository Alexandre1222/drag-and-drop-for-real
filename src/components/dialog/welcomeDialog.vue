<script setup lang="ts">
import { onMounted, reactive } from "vue";
import oldMan from '@/assets/planoghini.png'
import gsap from "gsap";

const model = defineModel<boolean>()

const tweened = reactive({
  number: 0
})

const plans = [
  {
    title: 'Sou Liso',
    description: 'Provendo apenas o essencial para conhecer o produto',
    price: 300,
    features: [
      '2 planogramação por mês',
      'Possibilidade de exportar para pdf',
      'Possibilidade de vincular até 3 emails',
      '3 solicitações de suporte por mês',
    ],
    featured: false,
    cardClass: 'rounded-s-xl rounded-b-0',
  },
  {
    title: 'To começando',
    description: 'Tu tem tudo e mais um pouco',
    price: 500,
    features: [
      '15 planogramação por mês',
      '2 aperto de mão do CEO',
      '1 engradado de cerveja',
      'Um abraço dos devs',
      '20 solicitações de suporte',
    ],
    featured: true,
    cardClass: 'rounded-t-xl',
  },
  {
    title: 'Nivel multinacional',
    description: 'Meu fi, tu é o cara',
    price: 800,
    features: [
      'Planogramações infinitas',
      '2 almoço com o CEO',
      'Planogramação neural, só no pensamento',
      '1 hora toda semana com a equipe de suporte',
    ],
    featured: false,
    cardClass: 'rounded-e-xl rounded-b-0',
  },
]

onMounted(() => {
  gsap.to(tweened, {duration: 2, number: Number(1239123912) || 0})
})
</script>

<template>
  <v-dialog
    v-model="model"
    width="1400"
  >
    <v-card>
      <v-card-text>
        <v-row>
          <v-col>
            <p class="font-weight-medium text-primary">Assine</p>

            <h1 class="text-sm-h5 text-md-h4 font-weight-bold mb-4">
              Veja e escolhe o plano que mais encaixa com seu bolso
            </h1>

            <p class="text-subtitle-1 text-medium-emphasis">
              Todos os valores são acessiveis pensando na plebe
            </p>

            <v-col
              cols="12"
              class="d-flex justify-center align-center"
            >
              <div class="d-flex align-center">
                <v-img
                  class="spin mr-2"
                  :src="oldMan"
                  width="150"
                  height="90"
                  contain
                />

                <h1 class="mb-0">
                  Já somos mais de
                  <span class="text-h4 font-weight-black rainbow-text">
          {{ tweened.number.toLocaleString('pt-br') }}
        </span>
                  usuários ativos
                </h1>
              </div>
            </v-col>

            <v-row no-gutters align="end">
              <v-col
                v-for="plan in plans"
                :key="plan.title"
                cols="12"
                lg="4"
              >
                <v-card
                  :height="plan.featured ? 500 : 460"
                  max-width="450"
                  class="mx-auto pa-6 pa-md-8 d-flex flex-column"
                  :style="{border: '1px solid'}"
                  variant="flat"
                  theme="dark"
                  :class="plan.cardClass"
                >
                  <!-- Chips -->
                  <div class="d-flex justify-space-between align-center">
                    <v-chip
                      :color="plan.featured ? 'primary' : undefined"
                      :variant="plan.featured ? 'flat' : 'tonal'"
                      rounded="sm"
                      class="mb-4"
                    >
                      {{ plan.title }}
                    </v-chip>

                    <v-chip
                      v-if="plan.featured"
                      size="small"
                      variant="tonal"
                      color="primary"
                      class="mb-4"
                    >
                      Mais comprado
                    </v-chip>
                  </div>

                  <!-- Description -->
                  <p class="text-subtitle-2 pb-3">
                    {{ plan.description }}
                  </p>

                  <!-- Price -->
                  <div class="text-h4 mb-3 font-weight-bold">
                    R${{ plan.price }}
                    <small class="text-body-2">/mês</small>
                  </div>

                  <!-- Features -->
                  <v-list density="compact" class="px-0">
                    <v-list-item
                      v-for="feature in plan.features"
                      :key="feature"
                      class="px-0 text-body-2"
                    >
                      <template #prepend>
                        <v-icon color="primary" size="18">
                          mdi-check
                        </v-icon>
                      </template>

                      {{ feature }}
                    </v-list-item>
                  </v-list>

                  <!-- Button -->
                  <v-btn
                    :variant="plan.featured ? 'flat' : 'outlined'"
                    :color="plan.featured ? 'primary' : undefined"
                    class="mx-auto mb-5 text-none"
                    style="max-width: 260px"
                    block
                  >
                    Assina ae
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
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
.rainbow-text {
  background: linear-gradient(
    270deg,
    #ff0000,
    #ff9900,
    #ffee00,
    #33cc33,
    #00ccff,
    #6633ff,
    #ff33cc
  );
  background-size: 400% 400%;

  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;

  animation: rainbow .8s linear infinite;
}

@keyframes rainbow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
