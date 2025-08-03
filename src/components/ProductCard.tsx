import Link from "next/link";

interface ProductCardProps {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
  price: string;
  href: string;
}

export default function ProductCard({
  title,
  description,
  image,
  features,
  price,
  href,
}: ProductCardProps) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden solar-hover group cursor-pointer">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">Hình ảnh sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-solar-blue transition-colors">
            {title}
          </h3>

          <p className="text-gray-600 mb-4 line-clamp-3">{description}</p>

          {/* Features */}
          <ul className="space-y-2 mb-6">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center text-sm text-gray-600"
              >
                <svg
                  className="w-4 h-4 text-solar-green mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* Price */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-solar-orange">
                {price}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
