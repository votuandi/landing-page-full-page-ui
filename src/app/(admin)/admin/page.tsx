"use client";

import { useEffect, useState } from "react";
import { 
  ShoppingBagIcon, 
  NewspaperIcon, 
  UserGroupIcon,
  ChartBarIcon,
  BriefcaseIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalProjects: number;
  totalNews: number;
  totalLeads: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalProjects: 0,
    totalNews: 0,
    totalLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API calls
    // For now, using mock data
    const fetchStats = async () => {
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Mock data - replace with actual API calls
        setStats({
          totalProducts: 24,
          activeProducts: 20,
          totalProjects: 15,
          totalNews: 12,
          totalLeads: 45,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      name: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      name: "Dự án hoàn thành",
      value: stats.totalProjects,
      icon: BriefcaseIcon,
      href: "/admin/projects",
      color: "bg-teal-500",
    },
    {
      name: "Bài viết tin tức",
      value: stats.totalNews,
      icon: NewspaperIcon,
      href: "/admin/news",
      color: "bg-purple-500",
    },
    {
      name: "Khách hàng tiềm năng",
      value: stats.totalLeads,
      icon: UserGroupIcon,
      href: "/admin/leads",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="mt-2 text-sm text-gray-600">
            Chào mừng đến bảng điều khiển quản trị. Quản lý nội dung và xem phân tích.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-6 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <Link
                key={card.name}
                href={card.href}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {card.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`${card.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}
                  >
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Thao tác nhanh
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/admin/products"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quản lý sản phẩm</h3>
                  <p className="text-sm text-gray-600">Thêm, sửa hoặc xóa sản phẩm</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/projects"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <BriefcaseIcon className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quản lý dự án</h3>
                  <p className="text-sm text-gray-600">Quản lý các dự án đã hoàn thành</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/news"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <NewspaperIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Quản lý tin tức</h3>
                  <p className="text-sm text-gray-600">Tạo và chỉnh sửa bài viết tin tức</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/leads"
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Xem khách hàng tiềm năng</h3>
                  <p className="text-sm text-gray-600">Quản lý yêu cầu khách hàng</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Hoạt động gần đây
          </h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center py-8">
              Hoạt động gần đây sẽ được hiển thị tại đây
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
