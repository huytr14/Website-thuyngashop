import type { Metadata } from "next";
import { getSiteContent } from "@/db/store";

export async function pageMetadata(name: string, description?: string, image?: string): Promise<Metadata> {
  const site = await getSiteContent();
  const title = (site.seo.titleTemplate || "{tên trang} | THUYNGA Shop").replace("{tên trang}", name);
  const summary = description || site.seo.description;
  return { title: name, description: summary, openGraph: { title, description: summary, images: [image || site.seo.image || site.brand.logo] } };
}
