import type { Product } from "./types";

type CartDrawerProps = {
  open: boolean;
  count: number;
  products: Product[];
  cart: Record<number, number>;
  subtotal: number;
  close: () => void;
  update: (id: number, delta: number) => void;
  checkout: () => void;
  format: (value: number) => string;
};

export default function CartDrawer({ open, count, products, cart, subtotal, close, update, checkout, format }: CartDrawerProps) {
  if (!open) return null;

  return <div className="overlay" onMouseDown={close}>
    <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
      <div className="drawer-head"><h2>Túi hàng <sup>{count}</sup></h2><button onClick={close}>×</button></div>
      <div className="cart-lines">
        {!count && <div className="empty"><span>◇</span><h3>Túi hàng đang trống</h3><p>Những món đồ đẹp đang chờ bạn khám phá.</p><button onClick={close}>TIẾP TỤC MUA SẮM</button></div>}
        {products.filter((p) => cart[p.id]).map((p) => <div className="cart-line" key={p.id}>
          <img src={p.image} alt=""/>
          <div><small>{p.brand}</small><h4>{p.name}</h4><div className="qty"><button onClick={() => update(p.id,-1)}>−</button><span>{cart[p.id]}</span><button onClick={() => update(p.id,1)}>+</button></div></div>
          <strong>{format(p.price * cart[p.id])}</strong>
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
