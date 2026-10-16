import Link from "next/link";
export default function Forbidden() {
  return <><h1>Bạn không có quyền truy cập</h1><p>Liên hệ chủ site để được cấp quyền phù hợp.</p><p className="mt-4"><Link prefetch={false} href="/">Về tổng quan</Link></p></>;
}
