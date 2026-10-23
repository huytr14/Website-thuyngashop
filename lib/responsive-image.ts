export function responsiveImage(src: string, sizes: string) {
  if (src.startsWith("/media-file/")) return { srcSet: [480, 800, 1200].map((width) => `${src}?w=${width} ${width}w`).join(", "), sizes };
  if (src.startsWith("https://images.unsplash.com/")) return { srcSet: [480, 800, 1200].map((width) => { const url = new URL(src); url.searchParams.set("w", String(width)); url.searchParams.set("q", "80"); url.searchParams.set("fm", "webp"); return `${url} ${width}w`; }).join(", "), sizes };
  return {};
}
