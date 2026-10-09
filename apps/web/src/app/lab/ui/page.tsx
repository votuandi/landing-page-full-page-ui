import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LabUi from "./LabUi";

export const metadata: Metadata = {
  title: "Lab UI — Primitive",
  robots: { index: false, follow: false },
};

export default function UiLabPage() {
  if (process.env.NODE_ENV === "production" && process.env.LAB_ENABLED !== "true") notFound();
  return <LabUi />;
}
