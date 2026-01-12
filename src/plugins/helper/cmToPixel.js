function cmToPixel(height, width) {
  const MAX_PX = 180 // tamanho máximo visual (caixa imaginária)

  // usa o maior lado real como referência
  const maxRealSide = Math.max(height, width)

  const scale = MAX_PX / maxRealSide

  return {
    heightPx: Math.round(height * scale),
    widthPx: Math.round(width * scale)
  }
}
export default cmToPixel
