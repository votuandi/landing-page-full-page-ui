"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface NewsCardProps {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date?: string;
  publishedAt?: string;
  image?: string;
  imageUrl?: string;
  category: string;
  readTime: string;
}

export default function NewsCard({
  id,
  title,
  excerpt,
  author,
  date,
  publishedAt,
  image,
  imageUrl,
  category,
  readTime,
}: NewsCardProps) {
  const [imageError, setImageError] = useState(false);
  const displayDate = date || publishedAt || '';
  const displayImage = image || imageUrl || '';

  return (
    <Link href={`/news/${id}`} className="block">
      <article className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
      {/* Image */}
      <div className="relative h-32 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {!imageError && displayImage ? (
          <Image
            src={displayImage}
            alt={title}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          /* Fallback placeholder */
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <svg
                className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-1 md:mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <span className="text-xs">Ảnh bài viết</span>
            </div>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 left-2 md:top-4 md:left-4">
          <span className="bg-solar-blue text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium">
            {category}
          </span>
        </div>

        {/* Read Time */}
        <div className="absolute top-2 right-2 md:top-4 md:right-4">
          <span className="bg-black/20 text-white px-1.5 py-0.5 md:px-2 md:py-1 rounded text-xs">
            {readTime}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-6">
        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-2 md:mb-3 line-clamp-2">
          {title}
        </h3>

        <p className="text-gray-600 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3 text-xs md:text-sm leading-relaxed">
          {excerpt}
        </p>

        {/* Author and Date */}
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-3 h-3 md:w-4 md:h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <div className="text-xs md:text-sm font-medium text-gray-900">
                {author}
              </div>
              <div className="text-xs text-gray-500">{displayDate}</div>
            </div>
          </div>

          <div className="text-solar-blue font-medium text-xs md:text-sm hover:text-blue-700 transition-colors">
            Đọc thêm →
          </div>
        </div>
      </div>
    </article>
    </Link>
  );
}
