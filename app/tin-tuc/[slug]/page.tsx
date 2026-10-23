import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/sanitize-rich-text";
import PublicPage from "@/components/PublicPage";
import { openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";
import { pageMetadata } from "@/lib/site-metadata";

export const revalidate = 300;

async function getPost(slug: string) { const { db, close } = openStoreDb(); try { return (await db.select().from(storePosts).where(and(eq(storePosts.slug, slug), eq(storePosts.published, true))).limit(1))[0]; } finally { await close(); } }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const post = await getPost((await params).slug); return post ? pageMetadata(post.title, post.content.slice(0, 160), post.image) : {}; }

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) { const post = await getPost((await params).slug); if (!post) notFound(); return <PublicPage><article className="content-article blog-article"><p className="eyebrow">TIN TỨC & GỢI Ý</p><h1>{post.title}</h1>{post.image && <img src={post.image} alt=""/>}<div dangerouslySetInnerHTML={{ __html: sanitizeRichText(post.content) }}/></article></PublicPage>; }
