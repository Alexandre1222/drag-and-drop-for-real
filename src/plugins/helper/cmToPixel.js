function cmToPixel(alturaCm, larguraCm) {
  const PIXELS_POR_CM = 6;

  const MAX_HEIGHT_PX = 400;

  let alturaFinal = alturaCm * PIXELS_POR_CM;
  let larguraFinal = larguraCm * PIXELS_POR_CM;

  if (alturaFinal > MAX_HEIGHT_PX) {
    const razaoReducao = MAX_HEIGHT_PX / alturaFinal;
    alturaFinal = MAX_HEIGHT_PX;
    larguraFinal = larguraFinal * razaoReducao;
  }
  return {
    heightPx: Math.round(alturaFinal),
    widthPx: Math.round(larguraFinal)
  };
}
export default cmToPixel
