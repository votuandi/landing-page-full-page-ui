"use client";

import { useEffect, useState } from "react";
import {
  ShoppingBagIcon,
  NewspaperIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalProjects: number;
  totalNews: number;
  totalLeads: number;
  totalServices: number;
  totalBranches: number;
}

interface Visit {
  id: number;
  date: string;
  views: number;
}

interface VisitStatistics {
  totalViews: number;
  averageViews: number;
  maxViews: number;
  minViews: number;
  totalDays: number;
  todayViews: number;
}

interface VisitTrackerData {
  visits: Visit[];
  statistics: VisitStatistics;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalProjects: 0,
    totalNews: 0,
    totalLeads: 0,
    totalServices: 0,
    totalBranches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; username: string; role: 'admin' | 'editor' } | null>(null);
  const [visitData, setVisitData] = useState<VisitTrackerData | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const data = await response.json();
        setStats({
          totalProducts: data.totalProducts || 0,
          activeProducts: data.activeProducts || 0,
          totalProjects: data.totalProjects || 0,
          totalNews: data.totalNews || 0,
          totalLeads: data.totalLeads || 0,
          totalServices: data.totalServices || 0,
          totalBranches: data.totalBranches || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Set stats to 0 on error to show empty state
        setStats({
          totalProducts: 0,
          activeProducts: 0,
          totalProjects: 0,
          totalNews: 0,
          totalLeads: 0,
          totalServices: 0,
          totalBranches: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch visit tracker data (admin only)
  useEffect(() => {
    const fetchVisitData = async () => {
      if (user?.role !== 'admin') {
        return;
      }

      setVisitLoading(true);
      try {
        const response = await fetch('/api/admin/visits?limit=30');

        if (!response.ok) {
          if (response.status === 403) {
            // Not admin, don't show visit tracker
            return;
          }
          throw new Error('Failed to fetch visit tracker data');
        }

        const data = await response.json();
        setVisitData(data);
      } catch (error) {
        console.error("Error fetching visit tracker data:", error);
      } finally {
        setVisitLoading(false);
      }
    };

    if (user) {
      fetchVisitData();
    }
  }, [user]);

  const statCards = [
    {
      name: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      href: "/admin/products",
      color: "bg-blue-500",
      hover: "hover:bg-blue-50",
    },
    {
      name: "Dự án hoàn thành",
      value: stats.totalProjects,
      icon: BriefcaseIcon,
      href: "/admin/projects",
      color: "bg-teal-500",
      hover: "hover:bg-teal-50",
    },
    {
      name: "Tổng dịch vụ",
      value: stats.totalServices,
      icon: WrenchScrewdriverIcon,
      href: "/admin/services",
      color: "bg-indigo-500",
      hover: "hover:bg-indigo-50",
    },
    {
      name: "Số lượng chi nhánh",
      value: stats.totalBranches,
      icon: BuildingOfficeIcon,
      href: "/admin/office",
      color: "bg-green-500",
      hover: "hover:bg-green-50",
    },
    {
      name: "Bài viết tin tức",
      value: stats.totalNews,
      icon: NewspaperIcon,
      href: "/admin/news",
      color: "bg-purple-500",
      hover: "hover:bg-purple-50",
    },
    {
      name: "Khách hàng liên hệ",
      value: stats.totalLeads,
      icon: UserGroupIcon,
      href: "/admin/leads",
      color: "bg-orange-500",
      hover: "hover:bg-orange-50",
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => (
              <Link
                key={card.name}
                href={card.href}
                className={`bg-white ${card.hover} rounded-lg shadow hover:shadow-lg transition-shadow p-6 group ${card.hover}`}
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
              className="bg-white group hover:bg-primary-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-primary-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <ShoppingBagIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Quản lý sản phẩm</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Thêm, sửa hoặc xóa sản phẩm</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/projects"
              className="bg-white group hover:bg-teal-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-teal-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <BriefcaseIcon className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Quản lý dự án</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Quản lý các dự án đã hoàn thành</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/services"
              className="bg-white group hover:bg-indigo-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-indigo-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <WrenchScrewdriverIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Quản lý dịch vụ</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Thêm, sửa hoặc xóa dịch vụ</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/office"
              className="bg-white group hover:bg-green-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Quản lý chi nhánh</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Thêm và chỉnh sửa chi nhánh</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/news"
              className="bg-white group hover:bg-purple-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <NewspaperIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Quản lý tin tức</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Tạo và chỉnh sửa bài viết tin tức</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/contact-forms"
              className="bg-white group hover:bg-orange-600 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 group-hover:bg-white p-3 rounded-lg transition-colors">
                  <UserGroupIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">Xem khách hàng liên hệ</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white transition-colors">Quản lý yêu cầu khách hàng</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Visit Tracker (Admin Only) */}
        {user?.role === 'admin' && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thống kê lượt truy cập
            </h2>
            {visitLoading ? (
              <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : visitData ? (
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Lượt xem hôm nay
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {visitData.statistics.todayViews.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-blue-500 p-3 rounded-lg">
                        <EyeIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Tổng lượt xem (30 ngày)
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {visitData.statistics.totalViews.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-500 p-3 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Trung bình/ngày
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {visitData.statistics.averageViews.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-500 p-3 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Cao nhất
                        </p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">
                          {visitData.statistics.maxViews.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-orange-500 p-3 rounded-lg">
                        <ChartBarIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visit History Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Lịch sử truy cập (30 ngày gần nhất)
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lượt xem
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {visitData.visits.length > 0 ? (
                          visitData.visits.map((visit) => (
                            <tr key={visit.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(visit.date).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {visit.views.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-6 py-8 text-center text-sm text-gray-500">
                              Chưa có dữ liệu truy cập
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
