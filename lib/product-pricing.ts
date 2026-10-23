type VariantRow = { name: string; price: number; quantity: number; image?: string };
type PricedProduct = { price: number; inStock: boolean; variant?: string; trackInventory?: boolean; inventoryQuantity?: number; variantRows?: VariantRow[]; flashPrice?: number | null; flashStock?: number | null };
type FlashSettings = { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null };

export function flashActive(settings: FlashSettings, now = new Date()) {
  return !!settings.flashSaleStart && !!settings.flashSaleEnd && new Date(settings.flashSaleStart) <= now && now < new Date(settings.flashSaleEnd);
}

export function pricedLine(product: PricedProduct, variantName: string | undefined, settings: FlashSettings, now = new Date()) {
  const rows = product.variantRows ?? [];
  const row = rows.find((item) => item.name === variantName);
  if (rows.length && !row) return null;
  if (!rows.length && variantName && variantName !== product.variant) return null;
  const flash = flashActive(settings, now) && product.flashPrice != null && (product.flashStock == null || product.flashStock > 0);
  return { price: flash ? product.flashPrice! : row?.price ?? product.price, inStock: product.inStock && (!product.trackInventory || (product.inventoryQuantity! > 0 && (!row || row.quantity > 0))), variantName: (row?.name ?? product.variant) || null, image: row?.image, flashApplied: flash };
}

export function canBuy(product: PricedProduct, variantName: string | undefined, quantity: number, productQuantity: number, settings: FlashSettings, now = new Date()) {
  const line = pricedLine(product, variantName, settings, now);
  if (!line?.inStock) return false;
  const row = product.variantRows?.find((item) => item.name === variantName);
  if (product.trackInventory && productQuantity > (product.inventoryQuantity ?? 0)) return false;
  if (product.trackInventory && quantity > (row?.quantity ?? product.inventoryQuantity ?? 0)) return false;
  if (line.flashApplied && product.flashStock != null && productQuantity > product.flashStock) return false;
  return true;
}
