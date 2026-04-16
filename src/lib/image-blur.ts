/**
 * Лёгкий blur-placeholder как data URL.
 * Используется с <Image placeholder="blur" blurDataURL={...} />.
 * 10x10 SVG-прямоугольник со слегка затенённым лиловым оттенком —
 * достаточно, чтобы next/image показал плавный blur-up до загрузки.
 */
const svg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="${color}"/></svg>`;

const toBase64 = (s: string) =>
  typeof window === "undefined"
    ? Buffer.from(s).toString("base64")
    : window.btoa(s);

/** Нейтральный blur-placeholder в теме проекта. */
export const defaultBlurDataURL = `data:image/svg+xml;base64,${toBase64(
  svg("#EADCF7")
)}`;

/** Позволяет сгенерировать placeholder нужного оттенка. */
export const blurDataURL = (color: string) =>
  `data:image/svg+xml;base64,${toBase64(svg(color))}`;
