import { redirect } from "next/navigation";
import { themes } from "@solar/themes";

export default function ThemesLabPage() {
  redirect(`/lab/themes/${themes[0].meta.id}`);
}
