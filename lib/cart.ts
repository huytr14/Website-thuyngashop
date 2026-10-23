export const CART_STORAGE_KEY = "thuynga_cart_v1";
export const cartKey = (productId: number, variantName?: string | null) => variantName ? `${productId}|${encodeURIComponent(variantName)}` : String(productId);
export const cartItem = (key: string) => { const [id, variant] = key.split("|"); return { productId: Number(id), variantName: variant ? decodeURIComponent(variant) : undefined }; };
export const cartLines = <T extends { id: number }>(cart: Record<string, number>, products: T[]) => Object.entries(cart).map(([key, quantity]) => ({ key, quantity, variantName: cartItem(key).variantName, product: products.find(({ id }) => id === cartItem(key).productId) })).filter((line): line is typeof line & { product: T } => !!line.product);

export function parseCart(value: string | null): Record<string, number> {
  try {
    const parsed = JSON.parse(value ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([key, quantity]) => { try { if (!/^\d+(?:\|[^|]+)?$/.test(key)) return false; cartItem(key); return Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 99; } catch { return false; } })) as Record<string, number>;
  } catch { return {}; }
}

export function storeCart(cart: Record<string, number>) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  // shortcut: customer accounts do not exist yet; merge this payload into the server cart when login is added.
}
