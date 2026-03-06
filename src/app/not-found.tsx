import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-sky-600 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Không tìm thấy trang
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <Link
          href="/"
          className="inline-block bg-sky-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-sky-700 transition-colors duration-300"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
