import { useEffect, useState } from "react";
import type { Product } from "./types";

type ProductDetailModalProps = {
  product: Product | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  close: () => void;
  add: (id: number, quantity: number) => void;
  buyNow: (id: number, quantity: number) => void;
  categoryOf: (product: Product) => string;
  format: (value: number) => string;
  policies: { shipping: string; returns: string; contact: string };
};

const brief = (value: string) => value.trim().split(/\n|(?<=[.!?])\s/)[0];

export default function ProductDetailModal({ product, quantity, setQuantity, close, add, buyNow, categoryOf, format, policies }: ProductDetailModalProps) {
  const [reviews, setReviews] = useState<{ id: number; rating: number; title: string; content: string; customerName: string | null }[]>([]);
  useEffect(() => { if (product) { setReviews([]); fetch(`/api/products/${product.id}/reviews`).then((response) => response.json()).then((data) => setReviews(data.reviews ?? [])).catch(() => setReviews([])); } }, [product]);
  if (!product) return null;

  return <div className="overlay product-overlay" onMouseDown={close}>
    <section className="product-detail" onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-label={`Chi tiết ${product.name}`}>
      <button className="detail-close" onClick={close} aria-label="Đóng">×</button>
      <div className="detail-image"><img src={product.image} alt={`${product.brand} ${product.name}`}/></div>
      <div className="detail-copy">
        <div className="breadcrumb">TRANG CHỦ / SẢN PHẨM / {product.brand}</div>
        <p className="eyebrow">{product.brand}</p>
        <h2>{product.name}</h2>
        <p className="detail-sku">Mã sản phẩm: TNG-{String(product.id).padStart(3, "0")}</p>
        {reviews.length > 0 && <p className="product-rating">★ {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} <span>({reviews.length} lượt đánh giá)</span></p>}
        <p className="stock-state">{product.inStock ? "● Còn hàng" : "● Hết hàng"}</p>
        <div className="detail-price"><strong>{format(product.price)}</strong>{product.oldPrice > product.price && <><del>{format(product.oldPrice)}</del><span>-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span></>}</div>
        <div className="detail-information"><h3>Thông tin sản phẩm</h3><p>Danh mục: {categoryOf(product)}</p>{product.shortDescription && <p>{product.shortDescription}</p>}</div>
        <div className="detail-quantity"><span>Số lượng</span><div className="qty"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button onClick={() => setQuantity(Math.min(99, quantity + 1))} aria-label="Tăng số lượng">+</button></div></div>
        <div className="detail-actions"><button className="add-detail" disabled={!product.inStock} onClick={() => { if (product.variantRows?.length) location.assign(`/san-pham/${product.slug}`); else { add(product.id, quantity); close(); } }}>{product.variantRows?.length ? "CHỌN BIẾN THỂ" : "THÊM VÀO TÚI"}</button><button className="buy-now" disabled={!product.inStock} onClick={() => product.variantRows?.length ? location.assign(`/san-pham/${product.slug}`) : buyNow(product.id, quantity)}>MUA NGAY</button></div>
        <a className="full-detail-link" href={`/san-pham/${product.slug}`}>Xem chi tiết đầy đủ →</a>
        <div className="detail-benefits"><span>Giao hàng: {brief(policies.shipping)}</span><span>Đổi trả: {brief(policies.returns)}</span><span>Tư vấn: {brief(policies.contact)}</span></div>
        <div className="product-reviews"><h3>Đánh giá đã mua</h3>{reviews.map((review) => <article key={review.id}><b>{"★".repeat(review.rating)} {review.title}</b><p>{review.content}</p><small>{review.customerName ?? "Khách hàng"}</small></article>)}{!reviews.length && <p>Chưa có đánh giá được duyệt.</p>}</div>
      </div>
    </section>
  </div>;
}
