import { desc, eq } from "drizzle-orm";
import PublicPage from "@/components/PublicPage";
import { openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";
import { pageMetadata } from "@/lib/site-metadata";
import type { Metadata } from "next";

export const revalidate = 300;
export async function generateMetadata(): Promise<Metadata> { return pageMetadata("Tin tức", "Cảm hứng và kiến thức chăm sóc sắc đẹp từ THUYNGA Shop."); }

export default async function BlogPage() { const { db, close } = openStoreDb(); try { const posts = await db.select().from(storePosts).where(eq(storePosts.published, true)).orderBy(desc(storePosts.createdAt)); return <PublicPage><div className="blog-page"><div className="page-heading"><p className="eyebrow">TIN TỨC & GỢI Ý</p><h1>Tin tức</h1></div><div className="blog-grid">{posts.map((post) => <a href={`/tin-tuc/${post.slug}`} key={post.id}>{post.image && <img src={post.image} alt=""/>}<small>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</small><h2>{post.title}</h2></a>)}{!posts.length && <p>Chưa có bài viết.</p>}</div></div></PublicPage>; } finally { await close(); } }
