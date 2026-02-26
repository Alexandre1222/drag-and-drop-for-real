const PIXELS_POR_CM = 8

function cmToPixel(alturaCm: number | null, larguraCm: number | null): { heightPx: number; widthPx: number } {
  const alturaFinal = (alturaCm ?? 0) * PIXELS_POR_CM
  const larguraFinal = (larguraCm ?? 0) * PIXELS_POR_CM

  return {
    heightPx: Math.round(alturaFinal),
    widthPx: Math.round(larguraFinal),
  }
}

export default cmToPixel
