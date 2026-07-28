"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./admin.module.css";

type Product = { id:number; name:string; brand:string; sku:string; price:number; stock:number; status:string; image:string };
type Order = { id:number; code:string; customer:string; email:string; total:number; payment:string; status:string; createdAt:string };
type Customer = { id:number; name:string; email:string; orders:number; spent:number; createdAt:string };
type Section = "overview"|"orders"|"products"|"customers"|"promotions";

const money = (n:number) => `${n.toLocaleString("vi-VN")}₫`;
const labels:Record<string,string> = {new:"Đơn mới",confirmed:"Đã xác nhận",shipping:"Đang giao",completed:"Hoàn thành",cancelled:"Đã hủy",active:"Đang bán",draft:"Bản nháp"};

export default function AdminDashboard({user}:{user:{name:string;email:string}}) {
  const [section,setSection]=useState<Section>("overview");
  const [products,setProducts]=useState<Product[]>([]);
  const [orders,setOrders]=useState<Order[]>([]);
  const [customers,setCustomers]=useState<Customer[]>([]);
  const [loading,setLoading]=useState(true);
  const [modal,setModal]=useState(false);
  const [search,setSearch]=useState("");
  const [notice,setNotice]=useState("");

  const load=async()=>{
    setLoading(true);
    const res=await fetch("/api/admin");
    const data=await res.json();
    setProducts(data.products||[]); setOrders(data.orders||[]); setCustomers(data.customers||[]);
    setLoading(false);
  };
  useEffect(()=>{load()},[]);
  const revenue=orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+o.total,0);
  const filteredProducts=useMemo(()=>products.filter(p=>`${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(search.toLowerCase())),[products,search]);
  const filteredOrders=useMemo(()=>orders.filter(o=>`${o.code} ${o.customer} ${o.email}`.toLowerCase().includes(search.toLowerCase())),[orders,search]);

  const flash=(text:string)=>{setNotice(text);setTimeout(()=>setNotice(""),2400)};
  const updateOrder=async(id:number,status:string)=>{
    await fetch(`/api/admin/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    setOrders(v=>v.map(o=>o.id===id?{...o,status}:o)); flash("Đã cập nhật trạng thái đơn hàng");
  };
  const deleteProduct=async(id:number)=>{
    await fetch(`/api/admin/products/${id}`,{method:"DELETE"});
    setProducts(v=>v.filter(p=>p.id!==id)); flash("Đã xóa sản phẩm");
  };
  const addProduct=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault(); const fd=new FormData(e.currentTarget);
    const payload=Object.fromEntries(fd.entries());
    const res=await fetch("/api/admin/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await res.json(); if(data.product){setProducts(v=>[data.product,...v]);setModal(false);flash("Sản phẩm mới đã được tạo")}
  };
  const navigate=(s:Section)=>{setSection(s);setSearch("")};

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <a href="/" className={styles.logo}>OLALA <span>SELECT</span></a>
      <p className={styles.adminLabel}>ADMIN CONSOLE</p>
      <nav>
        <button className={section==="overview"?styles.active:""} onClick={()=>navigate("overview")}><i>⌂</i>Tổng quan</button>
        <button className={section==="orders"?styles.active:""} onClick={()=>navigate("orders")}><i>▤</i>Đơn hàng <b>{orders.filter(o=>o.status==="new").length}</b></button>
        <button className={section==="products"?styles.active:""} onClick={()=>navigate("products")}><i>◇</i>Sản phẩm</button>
        <button className={section==="customers"?styles.active:""} onClick={()=>navigate("customers")}><i>♙</i>Khách hàng</button>
        <button className={section==="promotions"?styles.active:""} onClick={()=>navigate("promotions")}><i>％</i>Khuyến mãi</button>
      </nav>
      <div className={styles.sideBottom}><a href="/">← Xem cửa hàng</a><a href="/">Trang bán hàng</a></div>
    </aside>
    <main className={styles.main}>
      <header className={styles.topbar}>
        <div><p>TRUNG TÂM VẬN HÀNH</p><h1>{section==="overview"?"Chào buổi sáng":section==="orders"?"Quản lý đơn hàng":section==="products"?"Danh mục sản phẩm":section==="customers"?"Khách hàng":"Chương trình khuyến mãi"}</h1></div>
        <div className={styles.user}><span>{user.name.slice(0,1).toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small></div></div>
      </header>
      {notice&&<div className={styles.notice}>✓ {notice}</div>}
      {loading?<div className={styles.loading}>Đang tải dữ liệu quản trị...</div>:<>
      {section==="overview"&&<>
        <div className={styles.metrics}>
          <article><span>DOANH THU</span><h2>{money(revenue)}</h2><p className={styles.up}>↑ 18,4% so với tháng trước</p><i>01</i></article>
          <article><span>ĐƠN HÀNG</span><h2>{orders.length}</h2><p>{orders.filter(o=>o.status==="new").length} đơn đang chờ xử lý</p><i>02</i></article>
          <article><span>KHÁCH HÀNG</span><h2>{customers.length}</h2><p className={styles.up}>↑ 12 khách hàng mới</p><i>03</i></article>
          <article><span>SẢN PHẨM SẮP HẾT</span><h2>{products.filter(p=>p.stock<10).length}</h2><p>Cần bổ sung tồn kho</p><i>04</i></article>
        </div>
        <div className={styles.overviewGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}><div><p>HIỆU SUẤT 7 NGÀY</p><h2>Doanh thu</h2></div><b>{money(revenue)}</b></div>
            <div className={styles.chart}>{[38,52,44,70,61,86,74].map((h,i)=><div key={i}><span style={{height:`${h}%`}}></span><small>{["T2","T3","T4","T5","T6","T7","CN"][i]}</small></div>)}</div>
          </section>
          <section className={styles.panel}>
            <div className={styles.panelHead}><div><p>PHÂN BỔ ĐƠN HÀNG</p><h2>Trạng thái</h2></div></div>
            <div className={styles.donutRow}><div className={styles.donut}><b>{orders.length}</b><span>Tổng đơn</span></div><div className={styles.legend}>{["new","confirmed","shipping","completed"].map(s=><p key={s}><i className={styles[s]}></i><span>{labels[s]}</span><b>{orders.filter(o=>o.status===s).length}</b></p>)}</div></div>
          </section>
        </div>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><p>CẦN XỬ LÝ</p><h2>Đơn hàng gần đây</h2></div><button onClick={()=>navigate("orders")}>Xem tất cả →</button></div>
          <OrderTable orders={orders.slice(0,5)} updateOrder={updateOrder}/>
        </section>
      </>}
      {section==="orders"&&<section className={styles.panel}>
        <div className={styles.toolbar}><label>⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã đơn, khách hàng..."/></label><button onClick={()=>flash("Đã xuất danh sách đơn hàng")}>↓ XUẤT DỮ LIỆU</button></div>
        <OrderTable orders={filteredOrders} updateOrder={updateOrder}/>
      </section>}
      {section==="products"&&<section className={styles.panel}>
        <div className={styles.toolbar}><label>⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm sản phẩm, SKU..."/></label><button className={styles.primary} onClick={()=>setModal(true)}>＋ THÊM SẢN PHẨM</button></div>
        <div className={styles.productTable}><div className={styles.tableHeader}><span>SẢN PHẨM</span><span>SKU</span><span>GIÁ BÁN</span><span>TỒN KHO</span><span>TRẠNG THÁI</span><span></span></div>
        {filteredProducts.map(p=><div className={styles.productRow} key={p.id}><span><img src={p.image||"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=120&q=70"} alt=""/><i><b>{p.name}</b><small>{p.brand}</small></i></span><span>{p.sku}</span><span>{money(p.price)}</span><span className={p.stock<10?styles.low:""}>{p.stock} {p.stock<10&&<small>Sắp hết</small>}</span><span><em className={styles.status}>{labels[p.status]}</em></span><span><button onClick={()=>deleteProduct(p.id)}>×</button></span></div>)}</div>
      </section>}
      {section==="customers"&&<section className={styles.panel}>
        <div className={styles.toolbar}><label>⌕<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm khách hàng..."/></label><button onClick={()=>flash("Đã xuất danh sách khách hàng")}>↓ XUẤT DỮ LIỆU</button></div>
        <div className={styles.customerGrid}>{customers.filter(c=>`${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())).map(c=><article key={c.id}><span>{c.name.slice(0,1)}</span><h3>{c.name}</h3><p>{c.email}</p><div><b>{c.orders}<small>ĐƠN HÀNG</small></b><b>{money(c.spent)}<small>ĐÃ CHI TIÊU</small></b></div></article>)}</div>
      </section>}
      {section==="promotions"&&<div className={styles.promoGrid}>
        {[["SUMMER26","Summer Beauty Edit","Giảm 20% đơn từ 2 triệu","Đang hoạt động"],["WELCOME10","Ưu đãi khách hàng mới","Giảm 10% đơn hàng đầu tiên","Đang hoạt động"],["FREESHIP","Miễn phí vận chuyển","Áp dụng đơn từ 1 triệu","Đang hoạt động"]].map((p,i)=><article key={p[0]}><div><span>{p[0]}</span><em>{p[3]}</em></div><h2>{p[1]}</h2><p>{p[2]}</p><footer><span>Đã dùng <b>{[86,142,208][i]}</b> lượt</span><button onClick={()=>flash("Đã sao chép mã ưu đãi")}>SAO CHÉP MÃ</button></footer></article>)}
        <button className={styles.addPromo} onClick={()=>flash("Tính năng tạo chiến dịch đã sẵn sàng")}>＋<b>Tạo chương trình mới</b></button>
      </div>}
      </>}
    </main>
    {modal&&<div className={styles.modalBack} onMouseDown={()=>setModal(false)}><form className={styles.modal} onSubmit={addProduct} onMouseDown={e=>e.stopPropagation()}><div><h2>Thêm sản phẩm</h2><button type="button" onClick={()=>setModal(false)}>×</button></div><label>TÊN SẢN PHẨM<input required name="name"/></label><div className={styles.two}><label>THƯƠNG HIỆU<input required name="brand"/></label><label>SKU<input required name="sku"/></label></div><div className={styles.two}><label>GIÁ BÁN<input required type="number" name="price"/></label><label>TỒN KHO<input required type="number" name="stock"/></label></div><label>ĐƯỜNG DẪN HÌNH ẢNH<input name="image" placeholder="https://..."/></label><label>TRẠNG THÁI<select name="status"><option value="active">Đang bán</option><option value="draft">Bản nháp</option></select></label><button className={styles.primary} type="submit">TẠO SẢN PHẨM</button></form></div>}
  </div>
}

function OrderTable({orders,updateOrder}:{orders:Order[];updateOrder:(id:number,status:string)=>void}){
  return <div className={styles.orderTable}><div className={styles.tableHeader}><span>MÃ ĐƠN</span><span>KHÁCH HÀNG</span><span>NGÀY ĐẶT</span><span>THANH TOÁN</span><span>TỔNG TIỀN</span><span>TRẠNG THÁI</span></div>{orders.map(o=><div className={styles.orderRow} key={o.id}><span><b>{o.code}</b></span><span><b>{o.customer}</b><small>{o.email}</small></span><span>{o.createdAt}</span><span>{o.payment}</span><span><b>{money(o.total)}</b></span><span><select value={o.status} onChange={e=>updateOrder(o.id,e.target.value)}><option value="new">Đơn mới</option><option value="confirmed">Đã xác nhận</option><option value="shipping">Đang giao</option><option value="completed">Hoàn thành</option><option value="cancelled">Đã hủy</option></select></span></div>)}</div>
}
