export const CART_STORAGE_KEY = "thuynga_cart_v1";

export function parseCart(value: string | null) {
  try {
    const parsed = JSON.parse(value ?? "{}") as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([id, quantity]) => /^\d+$/.test(id) && Number.isInteger(quantity) && Number(quantity) > 0 && Number(quantity) <= 99).map(([id, quantity]) => [Number(id), Number(quantity)]));
  } catch { return {}; }
}

export function storeCart(cart: Record<number, number>) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  // shortcut: customer accounts do not exist yet; merge this payload into the server cart when login is added.
}
