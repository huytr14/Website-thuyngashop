import { ArrowUpRight, Menu, Search, ShoppingBag, X } from "lucide-react";

type HeaderProps = {
  menuOpen: boolean;
  searchOpen: boolean;
  query: string;
  count: number;
  setMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
  openCart: () => void;
  browseFromProduct?: boolean;
};

export default function Header({ menuOpen, searchOpen, query, count, setMenuOpen, setSearchOpen, setQuery, setCategory, openCart, browseFromProduct = false }: HeaderProps) {
  const sectionHref = (category: string) => browseFromProduct ? `/?category=${encodeURIComponent(category)}#deals` : "#deals";
  const searchHref = browseFromProduct ? `/?q=${encodeURIComponent(query.trim())}#deals` : "#deals";
  return <>
    <div className="store-note"><span>THUYNGA BEAUTY EDIT</span><span>Vẻ đẹp được chọn lọc cho bạn</span><a href={browseFromProduct ? "/#deals" : "#deals"}>KHÁM PHÁ NGAY <ArrowUpRight size={13}/></a></div>
    <header className="header">
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu"><Menu size={22}/></button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href={sectionHref("Tất cả")} onClick={() => {setCategory("Tất cả");setMenuOpen(false)}}>SẢN PHẨM</a>
        <a href={sectionHref("Chăm sóc da")} onClick={() => {setCategory("Chăm sóc da");setMenuOpen(false)}}>CHĂM SÓC DA</a>
        <a href={sectionHref("Trang điểm")} onClick={() => {setCategory("Trang điểm");setMenuOpen(false)}}>TRANG ĐIỂM</a>
        <a href={sectionHref("Tóc & cơ thể")} onClick={() => {setCategory("Tóc & cơ thể");setMenuOpen(false)}}>TÓC & CƠ THỂ</a>
      </nav>
      <a href={browseFromProduct ? "/" : "#deals"} className="logo brand-logo" aria-label="THUYNGA Shop"><img src="/thuynga-logo-wine.png" alt="THUYNGA Shop"/></a>
      <div className="header-actions">
        <label className="search">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (browseFromProduct && e.key === "Enter") location.assign(searchHref); }} placeholder="Tìm sản phẩm, thương hiệu..." />
          <Search size={17}/>
        </label>
        <button className="mobile-search-button" onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}>{searchOpen ? <X size={19}/> : <Search size={19}/>}</button>
        <a className="account-link" href="/tai-khoan">Tài khoản</a>
        <button className="cart-button" onClick={openCart} aria-label={`Mở túi hàng, ${count} sản phẩm`}><ShoppingBag size={18}/><span>Túi hàng</span><b>{count}</b></button>
      </div>
    </header>
    {searchOpen && <div className="mobile-search"><Search size={17}/><input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (browseFromProduct && e.key === "Enter") location.assign(searchHref); }} placeholder="Tìm sản phẩm, thương hiệu..."/><a href={searchHref} onClick={() => setSearchOpen(false)}>XEM KẾT QUẢ</a></div>}
  </>;
}
