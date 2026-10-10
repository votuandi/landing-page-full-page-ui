import type { Metadata } from "next";
import { notFound } from "next/navigation";

// LAB_ENABLED phải được đọc khi start, kể cả khi bản build mặc định tắt lab.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.LAB_ENABLED !== "true") notFound();
  return children;
}
