"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="public-page"><div className="page-heading"><h1>Đã có lỗi xảy ra</h1><p>Vui lòng thử lại sau.</p><button onClick={reset}>THỬ LẠI</button></div></main>;
}
