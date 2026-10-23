"use client";

import { useEffect, useRef, useState } from "react";
import MediaPicker, { type Media } from "@/components/admin/MediaPicker";
import styles from "../admin.module.css";

type Post = { id: number; title: string; slug: string; image: string; content: string; published: boolean };
const slugify = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function BlogAdmin() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null | undefined>(undefined);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const open = async (post: Post | null) => {
    setEditing(post); setTitle(post?.title ?? ""); setSlug(post?.slug ?? ""); setMessage("");
    const response = await fetch("/api/admin/media");
    if (response.ok) setMediaIds(((await response.json()).media as Media[]).filter((item) => item.url === post?.image).map((item) => item.id).slice(0, 1)); else setMediaIds([]);
  };
  const load = async () => { const response = await fetch("/api/admin/posts"); const data = await response.json(); setPosts(data.posts ?? []); };
  useEffect(() => { void load(); }, []);
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setMessage("");
    if (title.trim().length < 3) return setMessage("Tiêu đề cần ít nhất 3 ký tự.");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return setMessage("Slug chỉ gồm chữ thường, số và dấu gạch nối.");
    if ((contentRef.current?.textContent?.trim().length ?? 0) < 10) return setMessage("Nội dung cần ít nhất 10 ký tự.");
    try {
      const form = new FormData(event.currentTarget);
      const mediaResponse = mediaIds.length ? await fetch("/api/admin/media") : null;
      const media = mediaResponse?.ok ? ((await mediaResponse.json()).media as Media[]).find((item) => item.id === mediaIds[0]) : null;
      const payload = { title, slug, image: media?.url ?? editing?.image ?? "", content: contentRef.current?.innerHTML ?? "", published: form.get("published") === "on" };
      const response = await fetch(editing ? `/api/admin/posts/${editing.id}` : "/api/admin/posts", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return setMessage(data.error ?? "Không thể lưu bài viết.");
      await load(); setEditing(undefined); setMessage("Đã lưu bài viết.");
    } catch { setMessage("Không thể kết nối để lưu bài viết. Vui lòng thử lại."); }
  };
  const remove = async (id: number) => { if (!confirm("Xóa bài viết này?")) return; const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" }); if (!response.ok) return setMessage("Không thể xóa bài viết."); setPosts((items) => items.filter((item) => item.id !== id)); setMessage("Đã xóa bài viết."); };
  const format = (command: string) => { contentRef.current?.focus(); if (command === "createLink") { const url = prompt("Link https://..."); if (url && /^https?:\/\//.test(url)) document.execCommand(command, false, url); } else document.execCommand(command); };
  return <><div className={styles.toolbar}><button className={styles.primary} onClick={() => void open(null)}>＋ THÊM BÀI VIẾT</button><span>{posts.length} bài viết</span></div>{editing === undefined && message && <p role="status" className={styles.formError}>{message}</p>}<section className={styles.panel}>{posts.map((post) => <div className={styles.contentRow} key={post.id}><div><b>{post.title}</b><small>/{post.slug} · {post.published ? "Đang hiện" : "Đang ẩn"}</small></div><span><button onClick={() => void open(post)}>Sửa</button><button onClick={() => void remove(post.id)}>Xóa</button></span></div>)}</section>{editing !== undefined && <div className={styles.modalBack} onMouseDown={() => setEditing(undefined)}><form key={editing?.id ?? "new"} className={styles.modal} onSubmit={save} noValidate onMouseDown={(event) => event.stopPropagation()}><div className={styles.modalHead}><h2>{editing ? "Sửa bài viết" : "Bài viết mới"}</h2><button type="button" onClick={() => setEditing(undefined)}>×</button></div>{message && <p role="alert" className={styles.formError}>{message}</p>}<div className={styles.formGrid}><label className={styles.full}>TIÊU ĐỀ<input name="title" maxLength={250} value={title} onChange={(event) => { const next = event.target.value; setTitle(next); if (!slug || slug === slugify(title)) setSlug(slugify(next)); }}/></label><label>SLUG<input name="slug" maxLength={250} value={slug} onChange={(event) => setSlug(event.target.value)}/></label><div className={styles.full}><b>ẢNH BÌA</b><MediaPicker selected={mediaIds} onChange={setMediaIds} multiple={false}/></div><div className={styles.full}><b>NỘI DUNG</b><div className="editor-toolbar"><button type="button" onClick={() => format("bold")}>Đậm</button><button type="button" onClick={() => format("italic")}>Nghiêng</button><button type="button" onClick={() => format("insertUnorderedList")}>Danh sách</button><button type="button" onClick={() => format("createLink")}>Link</button></div><div className="editor-rich" ref={contentRef} contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: editing?.content ?? "" }}/></div><label className={styles.check}><input type="checkbox" name="published" defaultChecked={editing?.published}/> Hiển thị bài viết</label></div><button className={styles.primary}>LƯU BÀI VIẾT</button></form></div>}</>;
}
