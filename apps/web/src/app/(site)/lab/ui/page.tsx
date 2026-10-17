import type { Metadata } from "next";
import LabUi from "./LabUi";

export const metadata: Metadata = {
  title: "Lab UI — Primitive",
};

export default function UiLabPage() {
  return <LabUi />;
}
