"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { NewsArticle } from "@/types";

// Fallback news data (will be replaced by API data)
const fallbackNewsArticles: NewsArticle[] = [
  {
    id: 1,
    title: "Điện mặt trời được bán tối đa 20% công suất",
    excerpt:
      "Quy định mới về việc bán điện mặt trời áp mái cho lưới điện quốc gia với tỷ lệ tối đa 20% công suất lắp đặt.",
    author: "Administrator",
    date: "2024-01-15",
    image: "/images/news-1.jpg",
    category: "Chính sách",
    readTime: "5 phút đọc",
    content: `
<p>Bộ Công thương vừa ban hành quy định mới về việc bán điện năng lượng mặt trời áp mái cho lưới điện quốc gia. Theo đó, các hộ gia đình và doanh nghiệp chỉ được phép bán tối đa 20% công suất lắp đặt của hệ thống điện mặt trời.</p>

<p>Quy định này nhằm đảm bảo tính ổn định của lưới điện quốc gia và tránh tình trạng quá tải trong những giờ cao điểm sản xuất điện mặt trời. Đồng thời, việc giới hạn này cũng khuyến khích người dân sử dụng năng lượng mặt trời chủ yếu cho nhu cầu tiêu thụ điện của chính mình.</p>

<h3>Lợi ích của quy định mới</h3>
<ul>
<li>Đảm bảo ổn định lưới điện quốc gia</li>
<li>Khuyến khích sử dụng năng lượng tái tạo bền vững</li>
<li>Tạo cơ chế minh bạch cho việc mua bán điện</li>
<li>Giảm thiểu rủi ro về kỹ thuật</li>
</ul>

<p>Các chuyên gia trong ngành đánh giá đây là bước tiến tích cực, tạo khuôn khổ pháp lý rõ ràng cho việc phát triển năng lượng mặt trời tại Việt Nam.</p>
    `,
    tags: ["Chính sách", "Điện mặt trời", "Lưới điện", "Quy định"],
  },
  {
    id: 2,
    title: "Giá điện sinh hoạt tăng thêm 4,8% từ ngày hôm nay",
    excerpt:
      "EVN thông báo điều chỉnh tăng giá điện sinh hoạt bậc 3 trở lên nhằm khuyến khích tiết kiệm điện.",
    author: "Administrator",
    date: "2024-01-10",
    image: "/images/news-2.jpg",
    category: "Tin tức",
    readTime: "3 phút đọc",
    content: `
<p>Tập đoàn Điện lực Việt Nam (EVN) chính thức thông báo điều chỉnh tăng giá điện sinh hoạt đối với các bậc tiêu thụ từ bậc 3 trở lên, với mức tăng trung bình 4,8%.</p>

<p>Quyết định này được đưa ra nhằm khuyến khích người dân tiết kiệm điện và sử dụng năng lượng hiệu quả hơn. Đặc biệt, việc tăng giá chỉ áp dụng đối với các hộ gia đình có mức tiêu thụ điện cao.</p>

<h3>Chi tiết mức giá mới</h3>
<ul>
<li>Bậc 1 (0-50 kWh): Không thay đổi - 1.678 đồng/kWh</li>
<li>Bậc 2 (51-100 kWh): Không thay đổi - 1.734 đồng/kWh</li>
<li>Bậc 3 (101-200 kWh): Tăng 4,8% - 2.014 đồng/kWh</li>
<li>Bậc 4 (201-300 kWh): Tăng 4,8% - 2.536 đồng/kWh</li>
<li>Bậc 5 (301-400 kWh): Tăng 4,8% - 2.834 đồng/kWh</li>
<li>Bậc 6 (từ 401 kWh trở lên): Tăng 4,8% - 2.927 đồng/kWh</li>
</ul>

<p>Đây là thời điểm thích hợp để các hộ gia đình cân nhắc đầu tư vào hệ thống năng lượng mặt trời để giảm thiểu chi phí điện hàng tháng.</p>
    `,
    tags: ["Giá điện", "EVN", "Tiết kiệm điện", "Năng lượng"],
  },
  {
    id: 3,
    title: "Điện mặt trời thừa có thể bù trừ cho EVN",
    excerpt:
      "Cơ chế bù trừ điện năng mới cho phép hộ gia đình có thể bán điện thừa từ hệ thống solar về lưới.",
    author: "Administrator",
    date: "2024-01-08",
    image: "/images/news-3.jpg",
    category: "Công nghệ",
    readTime: "7 phút đọc",
    content: `
<p>Cơ chế bù trừ điện năng (Net Metering) chính thức được triển khai, cho phép các hộ gia đình và doanh nghiệp có hệ thống điện mặt trời áp mái có thể bán điện thừa về lưới điện quốc gia.</p>

<p>Đây là bước đột phá quan trọng trong việc phát triển năng lượng tái tạo tại Việt Nam, tạo động lực mạnh mẽ cho các hộ gia đình đầu tư vào hệ thống năng lượng mặt trời.</p>

<h3>Cách thức hoạt động của cơ chế bù trừ</h3>
<ol>
<li>Lắp đặt đồng hồ điện 2 chiều để đo lượng điện tiêu thụ và phát lên lưới</li>
<li>Trong ngày, hệ thống solar sản xuất điện phục vụ nhu cầu sử dụng</li>
<li>Điện dư thừa được bán về EVN với giá bù trừ</li>
<li>Vào ban đêm hoặc ngày không nắng, hộ gia đình sử dụng điện từ lưới</li>
<li>Cuối tháng, EVN tính toán bù trừ giữa điện mua và điện bán</li>
</ol>

<h3>Lợi ích của cơ chế bù trừ</h3>
<ul>
<li>Giảm thời gian hoàn vốn đầu tư xuống còn 6-8 năm</li>
<li>Tối ưu hóa hiệu quả sử dụng năng lượng mặt trời</li>
<li>Góp phần giảm tải cho lưới điện quốc gia</li>
<li>Khuyến khích phát triển năng lượng sạch</li>
</ul>

<p>Với cơ chế này, việc đầu tư vào hệ thống năng lượng mặt trời trở nên hấp dẫn hơn bao giờ hết.</p>
    `,
    tags: ["Bù trừ điện", "Net Metering", "Solar", "Lưới điện"],
  },
  {
    id: 4,
    title: 'Năng lượng mặt trời - Giải pháp "chống sốc" cho điện lưới',
    excerpt:
      "Hệ thống năng lượng mặt trời giúp giảm tải cho lưới điện quốc gia trong những giờ cao điểm.",
    author: "Administrator",
    date: "2024-01-05",
    image: "/images/news-4.jpg",
    category: "Phân tích",
    readTime: "6 phút đọc",
    content: `
<p>Trong bối cảnh nhu cầu điện ngày càng tăng cao, đặc biệt vào các giờ cao điểm mùa hè, hệ thống năng lượng mặt trời phân tán đang trở thành giải pháp hiệu quả để giảm tải cho lưới điện quốc gia.</p>

<p>Theo báo cáo của Viện Năng lượng, việc phát triển năng lượng mặt trời áp mái có thể giảm tới 30% áp lực lên lưới điện trong những giờ có nắng tốt.</p>

<h3>Tác động tích cực đến hệ thống điện</h3>
<ul>
<li>Giảm tải đỉnh: Năng lượng mặt trời sản xuất nhiều nhất vào giờ cao điểm (10h-14h)</li>
<li>Phân tán nguồn điện: Giảm phụ thuộc vào các nhà máy điện tập trung</li>
<li>Tăng độ tin cậy: Đa dạng hóa nguồn cung cấp điện</li>
<li>Giảm tổn thất truyền tải: Sản xuất điện gần nơi tiêu thụ</li>
</ul>

<h3>Thách thức cần giải quyết</h3>
<p>Tuy nhiên, việc tích hợp năng lượng mặt trời vào lưới điện cũng đặt ra một số thách thức:</p>
<ul>
<li>Biến động theo thời tiết và thời gian trong ngày</li>
<li>Cần có hệ thống lưu trữ năng lượng</li>
<li>Đầu tư nâng cấp lưới điện thông minh</li>
<li>Đào tạo nhân lực vận hành và bảo trì</li>
</ul>

<p>Chuyên gia khuyến nghị cần có lộ trình phát triển hài hòa giữa năng lượng mặt trời và các nguồn năng lượng khác để đảm bảo an ninh năng lượng quốc gia.</p>
    `,
    tags: ["Lưới điện", "An ninh năng lượng", "Phân tích", "Công nghệ"],
  },
  {
    id: 5,
    title: "Nhà máy điện mặt trời lớn nhất thế giới",
    excerpt:
      "Cập nhật về dự án nhà máy điện mặt trời có công suất lớn nhất thế giới và tác động đến ngành năng lượng.",
    author: "Administrator",
    date: "2024-01-03",
    image: "/images/news-5.jpg",
    category: "Quốc tế",
    readTime: "8 phút đọc",
    content: `
<p>Dự án nhà máy điện mặt trời Mohammed bin Rashid Al Maktoum Solar Park tại Dubai vừa hoàn thành giai đoạn cuối, trở thành nhà máy điện mặt trời lớn nhất thế giới với tổng công suất 5.000 MW.</p>

<p>Dự án này không chỉ là một kỳ tích kỹ thuật mà còn là minh chứng cho tiềm năng to lớn của năng lượng mặt trời trong việc đáp ứng nhu cầu năng lượng toàn cầu.</p>

<h3>Những con số ấn tượng</h3>
<ul>
<li>Tổng công suất: 5.000 MW</li>
<li>Diện tích: 77 km²</li>
<li>Số tấm pin mặt trời: Hơn 2,3 triệu tấm</li>
<li>Sản lượng điện hàng năm: 13,6 tỷ kWh</li>
<li>Giảm phát thải CO2: 6,5 triệu tấn/năm</li>
<li>Tổng đầu tư: 13,6 tỷ USD</li>
</ul>

<h3>Công nghệ tiên tiến được áp dụng</h3>
<p>Dự án sử dụng nhiều công nghệ tiên tiến nhất hiện tại:</p>
<ul>
<li>Tấm pin đơn tinh thể hiệu suất cao 22-24%</li>
<li>Hệ thống theo dõi mặt trời tự động</li>
<li>Công nghệ điện mặt trời nhiệt (CSP) với tháp năng lượng</li>
<li>Hệ thống lưu trữ năng lượng molten salt</li>
<li>AI và IoT trong quản lý vận hành</li>
</ul>

<h3>Tác động đến ngành năng lượng toàn cầu</h3>
<p>Thành công của dự án này mở ra nhiều hướng phát triển mới:</p>
<ul>
<li>Chứng minh tính khả thi của năng lượng mặt trời quy mô lớn</li>
<li>Giảm mạnh chi phí sản xuất điện mặt trời</li>
<li>Tạo động lực cho các quốc gia khác đầu tư vào năng lượng sạch</li>
<li>Phát triển chuỗi cung ứng và công nghệ hỗ trợ</li>
</ul>

<p>Việt Nam cũng có thể học hỏi kinh nghiệm từ dự án này để phát triển các nhà máy điện mặt trời quy mô lớn, góp phần đạt mục tiêu Net Zero vào năm 2050.</p>
    `,
    tags: ["Quốc tế", "Dự án lớn", "Công nghệ", "Dubai"],
  },
  {
    id: 6,
    title: "Top 10 thương hiệu năng lượng mặt trời hàng đầu thế giới",
    excerpt:
      "Danh sách các thương hiệu dẫn đầu về công nghệ và chất lượng trong ngành năng lượng mặt trời.",
    author: "Web Số",
    date: "2024-01-01",
    image: "/images/news-6.jpg",
    category: "Tổng hợp",
    readTime: "10 phút đọc",
    content: `
<p>Ngành năng lượng mặt trời toàn cầu đã có những bước phát triển vượt bậc trong những năm gần đây. Dưới đây là danh sách 10 thương hiệu hàng đầu thế giới về sản xuất thiết bị năng lượng mặt trời.</p>

<h3>1. LONGi Solar (Trung Quốc)</h3>
<p>Dẫn đầu về công suất sản xuất với hơn 32 GW/năm. Chuyên về tấm pin đơn tinh thể hiệu suất cao.</p>

<h3>2. JinkoSolar (Trung Quốc)</h3>
<p>Thương hiệu có mặt tại hơn 160 quốc gia, nổi tiếng với độ bền và hiệu suất ổn định.</p>

<h3>3. Trina Solar (Trung Quốc)</h3>
<p>Tiên phong trong nghiên cứu công nghệ tấm pin thế hệ mới, đạt hiệu suất chuyển đổi cao nhất.</p>

<h3>4. Canadian Solar (Canada)</h3>
<p>Thương hiệu uy tín với hơn 20 năm kinh nghiệm, có mặt mạnh tại thị trường Bắc Mỹ và châu Âu.</p>

<h3>5. JA Solar (Trung Quốc)</h3>
<p>Chuyên sản xuất tấm pin PERC và TOPCon với hiệu suất cao, giá thành cạnh tranh.</p>

<h3>6. Hanwha Q CELLS (Hàn Quốc)</h3>
<p>Nổi tiếng với công nghệ Q.ANTUM, đảm bảo hiệu suất cao ngay cả trong điều kiện ánh sáng yếu.</p>

<h3>7. First Solar (Mỹ)</h3>
<p>Chuyên về công nghệ CdTe thin-film, phù hợp cho các dự án quy mô lớn tại vùng sa mạc.</p>

<h3>8. SunPower Corporation (Mỹ)</h3>
<p>Tấm pin hiệu suất cao nhất thị trường với công nghệ Maxeon, bảo hành lên đến 40 năm.</p>

<h3>9. Sharp Solar (Nhật Bản)</h3>
<p>Thương hiệu lâu đời với hơn 60 năm kinh nghiệm, chất lượng Nhật Bản được tin cậy toàn cầu.</p>

<h3>10. Panasonic Solar (Nhật Bản)</h3>
<p>Công nghệ HIT độc quyền, hiệu suất cao và độ bền vượt trội trong điều kiện khắc nghiệt.</p>

<h3>Xu hướng phát triển</h3>
<p>Các thương hiệu hàng đầu đang tập trung vào:</p>
<ul>
<li>Nâng cao hiệu suất chuyển đổi năng lượng</li>
<li>Giảm chi phí sản xuất</li>
<li>Phát triển công nghệ tấm pin thế hệ mới (Perovskite, Tandem)</li>
<li>Tích hợp AI và IoT trong hệ thống quản lý</li>
<li>Cam kết bền vững và thân thiện môi trường</li>
</ul>

<p>Tại Việt Nam, nhiều thương hiệu này đã có mặt và được tin dùng bởi các nhà thầu uy tín trong ngành.</p>
    `,
    tags: ["Thương hiệu", "Tổng hợp", "Đánh giá", "Toàn cầu"],
  },
  // Additional articles for pagination
  {
    id: 7,
    title: "Chính phủ hỗ trợ vay vốn lắp đặt điện mặt trời hộ gia đình",
    excerpt:
      "Gói hỗ trợ tín dụng ưu đãi 50.000 tỷ đồng dành cho các hộ gia đình đầu tư hệ thống năng lượng mặt trời.",
    author: "Administrator",
    date: "2023-12-28",
    image: "/images/news-1.jpg",
    category: "Chính sách",
    readTime: "4 phút đọc",
    content: `<p>Chính phủ vừa phê duyệt gói hỗ trợ tín dụng ưu đãi trị giá 50.000 tỷ đồng...</p>`,
    tags: ["Hỗ trợ vốn", "Chính sách", "Hộ gia đình"],
  },
  {
    id: 8,
    title: "Công nghệ tấm pin mặt trời thế hệ mới với hiệu suất 47%",
    excerpt:
      "Các nhà khoa học đã phát triển thành công tấm pin mặt trời có hiệu suất chuyển đổi cao kỷ lục.",
    author: "Tech Solar",
    date: "2023-12-25",
    image: "/images/news-2.jpg",
    category: "Công nghệ",
    readTime: "6 phút đọc",
    content: `<p>Đột phá mới trong công nghệ tấm pin mặt trời...</p>`,
    tags: ["Công nghệ mới", "Hiệu suất cao", "Nghiên cứu"],
  },
  {
    id: 9,
    title: "Dự báo thị trường năng lượng mặt trời Việt Nam 2024",
    excerpt:
      "Thị trường điện mặt trời Việt Nam dự kiến tăng trưởng 45% trong năm 2024 với nhiều chính sách hỗ trợ mới.",
    author: "Market Analyst",
    date: "2023-12-20",
    image: "/images/news-3.jpg",
    category: "Thị trường",
    readTime: "7 phút đọc",
    content: `<p>Báo cáo thị trường năng lượng mặt trời Việt Nam 2024...</p>`,
    tags: ["Thị trường", "Dự báo", "Tăng trưởng"],
  },
  {
    id: 10,
    title: "Lắp đặt hệ thống solar cho trường học - Xu hướng mới",
    excerpt:
      "Nhiều trường học tại Việt Nam đã bắt đầu đầu tư hệ thống điện mặt trời để tiết kiệm chi phí và giáo dục môi trường.",
    author: "Education Solar",
    date: "2023-12-15",
    image: "/images/news-4.jpg",
    category: "Giáo dục",
    readTime: "5 phút đọc",
    content: `<p>Xu hướng lắp đặt solar cho trường học...</p>`,
    tags: ["Giáo dục", "Trường học", "Tiết kiệm"],
  },
];

export default function NewsPageContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [allNewsArticles, setAllNewsArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["Tất cả"]);

  const articlesPerPage = 6;

  // Fetch news data from API
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/news?limit=100&isActive=true&orderBy=publishedAt&order=desc');
        if (response.ok) {
          const result = await response.json();
          // Transform data to match component expectations
          const transformedNews = result.data.map((news: any) => ({
            ...news,
            date: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
            image: news.imageUrl || '/images/news-placeholder.jpg',
          }));
          setAllNewsArticles(transformedNews);

          // Extract unique categories
          const uniqueCategories = Array.from(new Set(transformedNews.map((article: NewsArticle) => article.category))) as string[];
          setCategories(["Tất cả", ...uniqueCategories]);
        } else {
          console.error('Failed to fetch news');
          // Use fallback data if API fails
          setAllNewsArticles(fallbackNewsArticles);
          const uniqueCategories = Array.from(new Set(fallbackNewsArticles.map((article) => article.category)));
          setCategories(["Tất cả", ...uniqueCategories]);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
        // Use fallback data if API fails
        setAllNewsArticles(fallbackNewsArticles);
        const uniqueCategories = Array.from(new Set(fallbackNewsArticles.map((article) => article.category)));
        setCategories(["Tất cả", ...uniqueCategories]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  // Filter articles based on category and search
  const filteredArticles = useMemo(() => {
    let filtered = allNewsArticles;

    if (selectedCategory !== "Tất cả") {
      filtered = filtered.filter(
        (article) => article.category === selectedCategory
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    return filtered;
  }, [selectedCategory, searchQuery, allNewsArticles]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const startIndex = (currentPage - 1) * articlesPerPage;
  const paginatedArticles = filteredArticles.slice(
    startIndex,
    startIndex + articlesPerPage
  );

  // Reset to first page when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tin tức{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
              Năng lượng
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính
            sách, công nghệ và xu hướng phát triển
          </p>
        </div>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solar-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Tin tức{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-solar-blue to-primary-600">
            Năng lượng
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính
          sách, công nghệ và xu hướng phát triển
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm tin tức..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-solar-blue focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md ${selectedCategory === category
                  ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white ring-2 ring-primary-300 shadow-lg"
                  : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 border border-gray-200 hover:border-primary-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Hiển thị {paginatedArticles.length} trên {filteredArticles.length} tin
          tức
        </div>
      </div>

      {/* Articles Grid */}
      {paginatedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {paginatedArticles.map((article) => (
            <Link href={`/news/${article.id}`} key={article.id}>
              <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                  <Image
                    src={article.image || article.imageUrl || '/images/news-placeholder.jpg'}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-solar-blue text-white px-3 py-1 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                  </div>

                  {/* Read Time */}
                  <div className="absolute top-4 right-4">
                    <span className="bg-black/20 text-white px-2 py-1 rounded text-sm">
                      {article.readTime}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                    {article.excerpt}
                  </p>

                  {/* Tags */}
                  {article.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Author and Date */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-gray-500"
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
                        <div className="text-sm font-medium text-gray-900">
                          {article.author}
                        </div>
                        <div className="text-xs text-gray-500">
                          {article.date}
                        </div>
                      </div>
                    </div>

                    <div className="text-solar-blue font-medium text-sm">
                      Đọc thêm →
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy tin tức
          </h3>
          <p className="text-gray-500">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc khác
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center space-y-4">
          {/* Page Numbers */}
          <div className="flex space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-lg ${currentPage === pageNumber
                    ? "bg-solar-blue text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next Button */}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>

          {/* Page Info */}
          <div className="text-sm text-gray-600">
            Trang {currentPage} trên {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
