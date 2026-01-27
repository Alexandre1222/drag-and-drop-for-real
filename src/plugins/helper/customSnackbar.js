// src/snackbar.js
import {reactive} from 'vue';

export const snackbarState = reactive({
  show: false,
  color: 'error',
  text: null
});
export function showSnackbar(text, color = 'error') {
  snackbarState.text = text;
  snackbarState.color = color;
  snackbarState.show = true;
}
