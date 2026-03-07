"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  NewspaperIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  BriefcaseIcon,
  MegaphoneIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { SERVICE_CATEGORIES } from "@/utils/constants";

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number | string;
};

const navigation: NavigationItem[] = [
  { name: "Bảng điều khiển", href: "/admin", icon: HomeIcon },
  { name: "Sản phẩm", href: "/admin/products", icon: ShoppingBagIcon },
  { name: "Dự án", href: "/admin/projects", icon: BriefcaseIcon, },
  { name: "Dịch vụ", href: "/admin/services", icon: MegaphoneIcon, },
  { name: "Tin tức", href: "/admin/news", icon: NewspaperIcon },
  { name: "Chi nhánh", href: "/admin/office", icon: BuildingOfficeIcon },
  { name: "Khách hàng tiềm năng", href: "/admin/leads", icon: UserGroupIcon },
  { name: "Cài đặt", href: "/admin/settings", icon: Cog6ToothIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PS</span>
              </div>
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
                        : "bg-gray-100 text-gray-600"
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
          <div className="px-6 py-4 border-t border-gray-200">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900"
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
