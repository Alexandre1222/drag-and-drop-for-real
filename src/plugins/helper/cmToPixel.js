function cmToPixel(alturaCm, larguraCm) {
  const PIXELS_POR_CM = 8;

  let alturaFinal = alturaCm * PIXELS_POR_CM;
  let larguraFinal = larguraCm * PIXELS_POR_CM;

  return {
    heightPx: Math.round(alturaFinal),
    widthPx: Math.round(larguraFinal)
  };
}
export default cmToPixel
