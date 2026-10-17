import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

// Approved blocking route (E5-S06): LAB_ENABLED phải được đọc khi start, kể cả khi bản build mặc định tắt lab.
export const instant = false;
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  await connection();
  if (process.env.NODE_ENV === "production" && process.env.LAB_ENABLED !== "true") notFound();
  return children;
}
