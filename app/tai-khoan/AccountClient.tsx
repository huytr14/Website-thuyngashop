"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { formatPrice } from "@/catalog/products";
import { useWishlist } from "@/lib/wishlist";

type Address = { id: number; recipientName: string; phone: string; address: string; district: string; city: string; isDefault: boolean };
type Order = { id: number; code: string; total: number; status: string; createdAt: Date | string };
type Item = { id: number; orderId: number; productId: number | null; productName: string; price: number; quantity: number };
type Review = { id: number; orderId: number; productId: number; status: string };

export default function AccountClient({ user, addresses: initialAddresses, orders, items, reviews: initialReviews, products }: { user: { id: string; name?: string | null; email?: string | null }; addresses: Address[]; orders: Order[]; items: Item[]; reviews: Review[]; products: { id: number; name: string; slug: string; image: string }[] }) {
  const wishlist = useWishlist();
  const [addresses, setAddresses] = useState(initialAddresses); const [reviews, setReviews] = useState(initialReviews); const [message, setMessage] = useState("");
  const addAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/addresses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form.entries())) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error ?? "Không thể lưu địa chỉ");
    setAddresses((value) => [...value, data.address]); event.currentTarget.reset(); setMessage("Đã thêm địa chỉ");
  };
  const deleteAddress = async (id: number) => { const response = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" }); if (response.ok) setAddresses((value) => value.filter((item) => item.id !== id)); };
  const addReview = async (event: React.FormEvent<HTMLFormElement>, orderId: number, productId: number) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, productId, rating: form.get("rating"), title: form.get("title"), content: form.get("content") }) });
    const data = await response.json(); if (!response.ok) return setMessage(data.error ?? "Không thể gửi đánh giá");
    setReviews((value) => [...value, data.review]); setMessage("Đánh giá đã gửi và đang chờ duyệt");
  };
  return <div className="account-page"><div className="page-heading"><p className="eyebrow">TÀI KHOẢN</p><h1>Xin chào, {user.name}</h1><p>{user.email}</p><button onClick={() => void signOut({ callbackUrl: "/" })}>Đăng xuất</button></div>
    {message && <p className="form-message">{message}</p>}
    <section><h2>Sản phẩm yêu thích</h2><div className="address-grid">{products.filter((product) => wishlist.ids.includes(product.id)).map((product) => <article key={product.id}><a href={`/san-pham/${product.slug}`}><img src={product.image} alt={product.name} width={90}/><p>{product.name}</p></a><button onClick={() => void wishlist.toggle(product.id)}>Bỏ thích</button></article>)}</div>{!wishlist.ids.length && <p>Chưa có sản phẩm yêu thích.</p>}</section>
    <section><h2>Sổ địa chỉ</h2><div className="address-grid">{addresses.map((item) => <article key={item.id}><b>{item.recipientName}</b><p>{item.phone}</p><p>{item.address}, {item.district}, {item.city}</p><button onClick={() => void deleteAddress(item.id)}>Xóa</button></article>)}</div>
      <form className="simple-form" onSubmit={addAddress}><input name="recipientName" required placeholder="Người nhận"/><input name="phone" required pattern="0[0-9]{8,10}" placeholder="Số điện thoại"/><input name="address" required placeholder="Địa chỉ"/><input name="district" required placeholder="Quận / Huyện"/><input name="city" required placeholder="Tỉnh / Thành phố"/><label><input type="checkbox" name="isDefault" value="true"/> Địa chỉ mặc định</label><button>THÊM ĐỊA CHỈ</button></form>
    </section>
    <section><h2>Lịch sử đơn hàng</h2>{orders.length ? orders.map((order) => <article className="account-order" key={order.id}><header><b>{order.code}</b><span>{order.status} · {formatPrice(order.total)}</span></header>{items.filter((item) => item.orderId === order.id).map((item) => <div key={item.id}><p>{item.productName} × {item.quantity} — {formatPrice(item.price * item.quantity)}</p>{order.status === "HOAN_THANH" && item.productId && !reviews.some((review) => review.orderId === order.id && review.productId === item.productId) && <form className="review-form" onSubmit={(event) => void addReview(event, order.id, item.productId!)}><select name="rating" defaultValue="5"><option value="5">5 sao</option><option value="4">4 sao</option><option value="3">3 sao</option><option value="2">2 sao</option><option value="1">1 sao</option></select><input name="title" maxLength={150} placeholder="Tiêu đề"/><textarea name="content" required minLength={10} maxLength={2000} placeholder="Chia sẻ trải nghiệm"/><button>GỬI ĐÁNH GIÁ</button></form>}</div>)}</article>) : <p>Bạn chưa có đơn hàng nào.</p>}</section>
  </div>;
}
