import type { Product } from "./types";
import { cartLines } from "@/lib/cart";
import { pricedLine } from "@/lib/product-pricing";

type CartDrawerProps = {
  open: boolean;
  count: number;
  products: Product[];
  cart: Record<string, number>;
  subtotal: number;
  close: () => void;
  update: (key: string, delta: number) => void;
  flashSettings?: { flashSaleStart?: Date | string | null; flashSaleEnd?: Date | string | null };
  checkout: () => void;
  format: (value: number) => string;
};

export default function CartDrawer({ open, count, products, cart, subtotal, close, update, checkout, format, flashSettings = {} }: CartDrawerProps) {
  if (!open) return null;

  return <div className="overlay" onMouseDown={close}>
    <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
      <div className="drawer-head"><h2>Túi hàng <sup>{count}</sup></h2><button onClick={close}>×</button></div>
      <div className="cart-lines">
        {!count && <div className="empty"><span>◇</span><h3>Túi hàng đang trống</h3><p>Những món đồ đẹp đang chờ bạn khám phá.</p><button onClick={close}>TIẾP TỤC MUA SẮM</button></div>}
        {cartLines(cart, products).map(({ key, product: p, variantName, quantity }) => <div className="cart-line" key={key}>
          <img src={pricedLine(p, variantName, flashSettings)?.image || p.image} alt=""/>
          <div><small>{p.brand}</small><h4>{p.name}</h4>{(variantName || p.variant) && <small>{variantName || p.variant}</small>}<div className="qty"><button onClick={() => update(key,-1)}>−</button><span>{quantity}</span><button onClick={() => update(key,1)}>+</button></div></div>
          <strong>{format((pricedLine(p, variantName, flashSettings)?.price ?? p.price) * quantity)}</strong>
        </div>)}
      </div>
      {!!count && <div className="cart-footer">
        <div><span>Tạm tính</span><strong>{format(subtotal)}</strong></div>
        <p>Phí vận chuyển được tính ở bước thanh toán.</p>
        <button onClick={checkout}>THANH TOÁN · {format(subtotal)}</button>
      </div>}
    </aside>
  </div>;
}
