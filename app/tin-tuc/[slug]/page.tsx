import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicPage from "@/components/PublicPage";
import { openStoreDb } from "@/db/store";
import { storePosts } from "@/db/store-schema";

export const revalidate = 300;

async function getPost(slug: string) { const { db, close } = openStoreDb(); try { return (await db.select().from(storePosts).where(and(eq(storePosts.slug, slug), eq(storePosts.published, true))).limit(1))[0]; } finally { await close(); } }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const post = await getPost((await params).slug); return post ? { title: `${post.title} | THUYNGA Shop`, description: post.content.slice(0, 160), openGraph: { title: post.title, description: post.content.slice(0, 160), images: post.image ? [post.image] : undefined } } : {}; }

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) { const post = await getPost((await params).slug); if (!post) notFound(); return <PublicPage><article className="content-article blog-article"><p className="eyebrow">THE BEAUTY NOTES</p><h1>{post.title}</h1>{post.image && <img src={post.image} alt=""/>}<div>{post.content}</div></article></PublicPage>; }
