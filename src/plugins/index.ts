/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import type { App } from 'vue'
import vuetify from './vuetify'

export function registerPlugins(app: App): void {
  app.use(vuetify)
}
