import type { Metadata } from "next";
import PublicPage from "@/components/PublicPage";
import TrackOrder from "./TrackOrder";

export const metadata: Metadata = { title: "Tra cứu đơn hàng", robots: { index: false, follow: false } };
export default function TrackOrderPage() { return <PublicPage><TrackOrder/></PublicPage>; }
