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
};

export default function ProductDetailModal({ product, quantity, setQuantity, close, add, buyNow, categoryOf, format }: ProductDetailModalProps) {
  const [reviews, setReviews] = useState<{ id: number; rating: number; title: string; content: string; customerName: string | null }[]>([]);
  useEffect(() => { if (product) fetch(`/api/products/${product.id}/reviews`).then((response) => response.json()).then((data) => setReviews(data.reviews ?? [])).catch(() => setReviews([])); }, [product]);
  if (!product) return null;

  return <div className="overlay product-overlay" onMouseDown={close}>
    <section className="product-detail" onMouseDown={(e) => e.stopPropagation()} aria-modal="true" role="dialog" aria-label={`Chi tiết ${product.name}`}>
      <button className="detail-close" onClick={close} aria-label="Đóng">×</button>
      <div className="detail-image"><img src={product.image} alt={product.name}/></div>
      <div className="detail-copy">
        <div className="breadcrumb">TRANG CHỦ / SẢN PHẨM / {product.brand}</div>
        <p className="eyebrow">{product.brand}</p>
        <h2>{product.name}</h2>
        <p className="detail-sku">Mã sản phẩm: TNG-{String(product.id).padStart(3, "0")}</p>
        <div className="detail-price"><strong>{format(product.price)}</strong><del>{format(product.oldPrice)}</del><span>Tiết kiệm {Math.round((1 - product.price / product.oldPrice) * 100)}%</span></div>
        <div className="detail-information"><h3>Thông tin sản phẩm</h3><p>Danh mục: {categoryOf(product)}</p><p>Mã tham khảo: TNG-{String(product.id).padStart(3, "0")}</p><p>Hình ảnh, giá bán, dung tích và mô tả chi tiết cần được xác nhận theo danh mục hàng thật trước khi vận hành.</p></div>
        <div className="detail-quantity"><span>Số lượng</span><div className="qty"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Giảm số lượng">−</button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)} aria-label="Tăng số lượng">+</button></div></div>
        <div className="detail-actions"><button className="add-detail" onClick={() => { add(product.id, quantity); close(); }}>THÊM VÀO TÚI</button><button className="buy-now" onClick={() => buyNow(product.id, quantity)}>MUA NGAY</button></div>
        <div className="detail-benefits"><span>Giao hàng: tính ở bước thanh toán</span><span>Đổi trả và bảo hành: cập nhật theo chính sách cửa hàng khi vận hành</span><span>Tư vấn sản phẩm: thông tin liên hệ sẽ được bổ sung</span></div>
        <div className="product-reviews"><h3>Đánh giá đã mua</h3>{reviews.map((review) => <article key={review.id}><b>{"★".repeat(review.rating)} {review.title}</b><p>{review.content}</p><small>{review.customerName ?? "Khách hàng"}</small></article>)}{!reviews.length && <p>Chưa có đánh giá được duyệt.</p>}</div>
      </div>
    </section>
  </div>;
}
