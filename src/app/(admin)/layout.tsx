"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number | string;
};

const baseNavigation: NavigationItem[] = [
  { name: "Bảng điều khiển", href: "/admin", icon: HomeIcon },
  { name: "Sản phẩm", href: "/admin/products", icon: ShoppingBagIcon },
  { name: "Dự án", href: "/admin/projects", icon: BriefcaseIcon, },
  { name: "Dịch vụ", href: "/admin/services", icon: MegaphoneIcon, },
  { name: "Tin tức", href: "/admin/news", icon: NewspaperIcon },
  { name: "Chi nhánh", href: "/admin/office", icon: BuildingOfficeIcon },
  { name: "Khách hàng liên hệ", href: "/admin/contact-forms", icon: UserGroupIcon },
  { name: "Cài đặt", href: "/admin/settings", icon: Cog6ToothIcon },
];

// Admin-only navigation items
const adminOnlyNavigation: NavigationItem[] = [
  { name: "Quản lý người dùng", href: "/admin/user", icon: UsersIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [navigation, setNavigation] = useState<NavigationItem[]>(baseNavigation);
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0);
  const [user, setUser] = useState<{ id: number; username: string; role: 'admin' | 'editor' } | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);

  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Not authenticated, redirect to login
          router.push("/login?redirect=" + encodeURIComponent(pathname || "/admin"));
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login?redirect=" + encodeURIComponent(pathname || "/admin"));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, pathname]);

  // Fetch unresolved contact forms count
  useEffect(() => {
    const fetchUnresolvedCount = async () => {
      try {
        const response = await fetch("/api/contact-form/count?isResolved=false");
        if (response.ok) {
          const data = await response.json();
          setUnresolvedCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching unresolved contact forms count:", error);
      }
    };

    fetchUnresolvedCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnresolvedCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if API call fails
      router.push("/login");
      router.refresh();
    }
  };

  // Update navigation with badge count and role-based items
  useEffect(() => {
    let updatedNavigation = [...baseNavigation];

    // Add admin-only navigation items
    if (user && user.role === 'admin') {
      updatedNavigation = [...updatedNavigation, ...adminOnlyNavigation];
    }

    // Update badge count
    updatedNavigation = updatedNavigation.map((item) => {
      if (item.name === "Khách hàng liên hệ" && unresolvedCount > 0) {
        return { ...item, badge: unresolvedCount };
      }
      return item;
    });

    setNavigation(updatedNavigation);
  }, [unresolvedCount, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2">
              {companyInfo?.logoUrl ?
                <Image src={companyInfo.logoUrl} alt={companyInfo?.companyName || "Logo"} width={40} height={40} className="object-contain" />
                : <div className="w-full h-full bg-gray-200" />
              }
              <span className="font-bold text-lg text-gray-800">
                Quản trị CMS
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center justify-between space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`
                      px-2 py-0.5 text-xs font-semibold rounded-full
                      ${isActive
                        ? "bg-primary-100 text-primary-700"
                        : "bg-red-100 text-red-700"
                      }
                    `}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {user && (
              <div className="text-sm text-gray-600 mb-2">
                <div className="font-medium text-gray-900">{user.username}</div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role === 'admin' ? 'Quản trị viên' : 'Biên tập viên'}
                  </span>
                  <span className="text-xs text-green-500">Đã đăng nhập</span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-red-100"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
            <Link
              href="/"
              className="block text-sm text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-primary-100"
            >
              ← Quay lại trang web
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </div>
    </div>
  );
}
