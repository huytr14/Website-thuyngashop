import { ArrowUpRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import { defaultSiteContent, type SiteContent } from "@/lib/site-content";
import { categories as fallbackCategories } from "@/catalog/products";
import { visibleCategories, type ShopCategory } from "@/lib/categories";
import { useEffect, useState } from "react";
import { formatPrice } from "@/catalog/products";

type Suggestions = { products: { name: string; slug: string; image: string; price: number; brand: string }[]; brands: string[]; categories: { name: string; slug: string }[] };

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
  const searchHref = `/tim-kiem?q=${encodeURIComponent(query.trim())}`;
  const visible = visibleCategories(categoryTree);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(-1);
  const [suggestions, setSuggestions] = useState<Suggestions>({ products: [], brands: [], categories: [] });
  useEffect(() => {
    setSuggestions({ products: [], brands: [], categories: [] });
    if (!focused || (query.trim().length === 1)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => { void fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((data) => { if (data) setSuggestions(data); }).catch(() => {}); }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, focused]);
  const choices = [...suggestions.products.map((item) => ({ href: `/san-pham/${item.slug}`, label: item.name })), ...suggestions.brands.map((item) => ({ href: `/tim-kiem?q=${encodeURIComponent(item)}`, label: item })), ...suggestions.categories.map((item) => ({ href: `/danh-muc/${item.slug}`, label: item.name }))];
  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { setFocused(false); event.currentTarget.blur(); }
    if (event.key === "ArrowDown" && choices.length) { event.preventDefault(); setActive((value) => (value + 1) % choices.length); }
    if (event.key === "ArrowUp" && choices.length) { event.preventDefault(); setActive((value) => (value - 1 + choices.length) % choices.length); }
    if (event.key === "Enter") { event.preventDefault(); location.assign(active >= 0 ? choices[active].href : searchHref); }
  };
  const suggestionList = (id: string) => focused && (query.trim().length === 0 || query.trim().length >= 2) && <div id={id} className="search-suggestions" role="listbox" aria-label={query ? "Gợi ý tìm kiếm" : "Tìm kiếm phổ biến"}>{!query && <b>Tìm kiếm phổ biến</b>}{suggestions.products.map((item, index) => <a role="option" aria-selected={active === index} className={active === index ? "active" : ""} key={item.slug} href={`/san-pham/${item.slug}`}><img src={item.image} alt="" loading="lazy"/><span>{item.name}<small>{item.brand}</small></span><strong>{formatPrice(item.price)}</strong></a>)}{suggestions.brands.map((item, index) => <a role="option" aria-selected={active === suggestions.products.length + index} className={active === suggestions.products.length + index ? "active" : ""} key={item} href={`/tim-kiem?q=${encodeURIComponent(item)}`}>{item}</a>)}{suggestions.categories.map((item, index) => <a role="option" aria-selected={active === suggestions.products.length + suggestions.brands.length + index} className={active === suggestions.products.length + suggestions.brands.length + index ? "active" : ""} key={item.slug} href={`/danh-muc/${item.slug}`}>{item.name}</a>)}{query && <a href={searchHref}>Xem tất cả kết quả →</a>}</div>;
  return <>
    {site.announcement.enabled && <div className="store-note"><span>{site.announcement.kicker}</span><span className="store-note-center">{site.announcement.text}{site.announcement.promo && <> · {site.announcement.promo}</>}</span>{site.announcement.link ? <a href={browseFromProduct && site.announcement.link.startsWith("#") ? `/${site.announcement.link}` : site.announcement.link}>{site.announcement.linkText} <ArrowUpRight size={13}/></a> : <span>{site.announcement.linkText}</span>}</div>}
    <header className="header">
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu"><Menu size={22}/></button>
      <nav className={menuOpen ? "nav open" : "nav"}>
        <a href={sectionHref("Tất cả")} onClick={() => {setCategory("Tất cả");setMenuOpen(false)}}>SẢN PHẨM</a>
        {visible.filter(({ parentId }) => !parentId).map((root) => <div className="nav-category" key={root.id}><a href={`/danh-muc/${root.slug}`} onClick={() => setMenuOpen(false)}>{root.name.toLocaleUpperCase("vi-VN")}</a>{visible.some((child) => child.parentId === root.id) && <div className="nav-children">{visible.filter((child) => child.parentId === root.id).map((child) => <a href={`/danh-muc/${child.slug}`} key={child.id} onClick={() => setMenuOpen(false)}>{child.name}</a>)}</div>}</div>)}
      </nav>
      <a href={browseFromProduct ? "/" : "#deals"} className="logo brand-logo" aria-label={site.brand.name}><img src={site.brand.logo || defaultSiteContent.brand.logo} alt={site.brand.name}/></a>
      <div className="header-actions">
        <div className="search">
          <input value={query} onChange={(e) => { setQuery(e.target.value); setActive(-1); }} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onKeyDown={onSearchKey} role="combobox" aria-label="Tìm sản phẩm" aria-expanded={focused} aria-controls="desktop-search-suggestions" placeholder="Tìm sản phẩm, thương hiệu..." />
          <Search size={17}/>
          {suggestionList("desktop-search-suggestions")}
        </div>
        <button className="mobile-search-button" onClick={() => setSearchOpen(!searchOpen)} aria-label={searchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}>{searchOpen ? <X size={19}/> : <Search size={19}/>}</button>
        <a className="account-link" href="/tai-khoan">Tài khoản</a>
        <button className="cart-button" onClick={openCart} aria-label={`Mở túi hàng, ${count} sản phẩm`}><ShoppingBag size={18}/><span>Túi hàng</span><b>{count}</b></button>
      </div>
    </header>
    <nav className="mobile-bottom-nav" aria-label="Điều hướng mobile"><a href="/" aria-current={typeof location !== "undefined" && location.pathname === "/" ? "page" : undefined}>Trang chủ</a><button type="button" aria-current={typeof location !== "undefined" && location.pathname.startsWith("/danh-muc") ? "page" : undefined} onClick={() => setMenuOpen(!menuOpen)}>Danh mục</button><button type="button" aria-current={searchOpen ? "page" : undefined} onClick={() => setSearchOpen(true)}>Tìm kiếm</button><button type="button" onClick={openCart}>Giỏ hàng {count > 0 && `(${count})`}</button><a href="/tai-khoan" aria-current={typeof location !== "undefined" && location.pathname === "/tai-khoan" ? "page" : undefined}>Tài khoản</a></nav>
    {searchOpen && <div className="mobile-search"><Search size={17}/><input role="combobox" aria-label="Tìm sản phẩm" aria-expanded={focused} aria-controls="mobile-search-suggestions" autoFocus value={query} onChange={(e) => { setQuery(e.target.value); setActive(-1); }} onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)} onKeyDown={onSearchKey} placeholder="Tìm sản phẩm, thương hiệu..."/><a href={searchHref} onClick={() => setSearchOpen(false)}>XEM KẾT QUẢ</a>{suggestionList("mobile-search-suggestions")}</div>}
  </>;
}
