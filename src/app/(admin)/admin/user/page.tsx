"use client";

import { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  username: string;
  role: "admin" | "editor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function UserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "editor" as "admin" | "editor",
    isActive: true,
  });

  // Check authorization on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          setCurrentUser(user);

          // Only admins can access this page
          if (user.role !== "admin") {
            router.push("/admin");
            return;
          }

          setIsAuthorized(true);
          fetchUsers();
        } else {
          router.push("/login?redirect=" + encodeURIComponent("/admin/user"));
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/login?redirect=" + encodeURIComponent("/admin/user"));
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setIsAddingNew(true);
    setEditingUserId(null);
    setFormData({
      username: "",
      password: "",
      role: "editor",
      isActive: true,
    });
  };

  const handleEditUser = (user: User) => {
    setIsAddingNew(false);
    setEditingUserId(user.id);
    setFormData({
      username: user.username,
      password: "", // Don't pre-fill password
      role: user.role,
      isActive: user.isActive,
    });
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingUserId(null);
    setFormData({
      username: "",
      password: "",
      role: "editor",
      isActive: true,
    });
  };

  const handleSaveUser = async () => {
    if (!formData.username) {
      alert("Vui lòng nhập tên người dùng");
      return;
    }

    if (isAddingNew && !formData.password) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      if (isAddingNew) {
        // Create new user
        const response = await fetch("/api/auth/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            role: formData.role,
          }),
        });

        if (response.ok) {
          alert("Tạo người dùng thành công!");
          handleCancel();
          fetchUsers();
        } else {
          const errorData = await response.json();
          alert(errorData.error || "Không thể tạo người dùng");
        }
      } else if (editingUserId) {
        // Update existing user
        const updateData: any = {
          username: formData.username,
          role: formData.role,
          isActive: formData.isActive,
        };

        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        const response = await fetch(`/api/users/${editingUserId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        if (response.ok) {
          alert("Cập nhật người dùng thành công!");
          handleCancel();
          fetchUsers();
        } else {
          const errorData = await response.json();
          alert(errorData.error || "Không thể cập nhật người dùng");
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Xóa người dùng thành công!");
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Không thể xóa người dùng");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Đã xảy ra lỗi. Vui lòng thử lại.");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Người dùng</h1>
          <p className="mt-2 text-sm text-gray-600">
            Quản lý tài khoản người dùng và phân quyền
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Danh sách người dùng</h2>
          <button
            onClick={handleAddUser}
            className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Thêm Người dùng</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-gray-500">Đang tải...</div>
        ) : (
          <>
            {/* Add/Edit Form */}
            {(isAddingNew || editingUserId !== null) && (
              <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isAddingNew ? "Thêm người dùng mới" : "Chỉnh sửa người dùng"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên người dùng *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Tên người dùng"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mật khẩu {isAddingNew ? "*" : "(để trống nếu không đổi)"}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Mật khẩu"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vai trò *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as "admin" | "editor",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="editor">Biên tập viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                  {!isAddingNew && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({ ...formData, isActive: e.target.checked })
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                        Tài khoản đang hoạt động
                      </label>
                    </div>
                  )}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={handleSaveUser}
                      className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <CheckIcon className="w-4 h-4" />
                      <span>Lưu</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      <span>Hủy</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users List */}
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Chưa có người dùng nào. Nhấn &quot;Thêm Người dùng&quot; để tạo người dùng mới.
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên người dùng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <>
                                <ShieldCheckIcon className="w-3 h-3 mr-1" />
                                Quản trị viên
                              </>
                            ) : (
                              "Biên tập viên"
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            {currentUser && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
