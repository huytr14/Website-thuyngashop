import { ArrowUpRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { categories as fallbackCategories } from "@/catalog/products";
import { visibleCategories, type ShopCategory } from "@/lib/categories";

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
  site?: SiteContent;
  categoryTree?: ShopCategory[];
};

export default function Header({ menuOpen, searchOpen, query, count, setMenuOpen, setSearchOpen, setQuery, setCategory, openCart, browseFromProduct = false, site = defaultSiteContent, categoryTree = fallbackCategories }: HeaderProps) {
  const sectionHref = (category: string) => browseFromProduct ? `/?category=${encodeURIComponent(category)}#deals` : "#deals";
  const searchHref = browseFromProduct ? `/?q=${encodeURIComponent(query.trim())}#deals` : "#deals";
  const visible = visibleCategories(categoryTree);
  return <>
    {site.announcement.enabled && <div className="store-note"><span>{site.announcement.kicker}</span><span>{site.announcement.text}</span>{site.announcement.link ? <a href={browseFromProduct && site.announcement.link.startsWith("#") ? `/${site.announcement.link}` : site.announcement.link}>{site.announcement.linkText} <ArrowUpRight size={13}/></a> : <span>{site.announcement.linkText}</span>}</div>}
    <header className="header">
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu"><Menu size={22}/></button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href={sectionHref("Tất cả")} onClick={() => {setCategory("Tất cả");setMenuOpen(false)}}>SẢN PHẨM</a>
        {visible.filter(({ parentId }) => !parentId).map((root) => <div className="nav-category" key={root.id}><a href={`/danh-muc/${root.slug}`} onClick={() => setMenuOpen(false)}>{root.name.toLocaleUpperCase("vi-VN")}</a>{visible.some((child) => child.parentId === root.id) && <div className="nav-children">{visible.filter((child) => child.parentId === root.id).map((child) => <a href={`/danh-muc/${child.slug}`} key={child.id} onClick={() => setMenuOpen(false)}>{child.name}</a>)}</div>}</div>)}
      </nav>
      <a href={browseFromProduct ? "/" : "#deals"} className="logo brand-logo" aria-label={site.brand.name}><img src={site.brand.logo || defaultSiteContent.brand.logo} alt={site.brand.name}/></a>
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
