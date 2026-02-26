import { reactive } from 'vue'
import type { SnackbarState } from '@/types'

export const snackbarState: SnackbarState = reactive({
  show: false,
  color: 'error',
  text: null,
})

export function showSnackbar(text: string, color: string = 'error'): void {
  snackbarState.text = text
  snackbarState.color = color
  snackbarState.show = true
}
