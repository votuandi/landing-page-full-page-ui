import { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsDetailContent from "@/components/NewsDetailContent";
import { NewsArticle } from "@/types";

// This would typically come from a database or CMS
// For now, using the same data as in NewsPageContent
const allNewsArticles: NewsArticle[] = [
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
];

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = allNewsArticles.find((a) => a.id.toString() === slug);

  if (!article) {
    return {
      title: "Tin tức không tồn tại | Tâm Huỳnh Solar",
    };
  }

  return {
    title: `${article.title} | Tâm Huỳnh Solar`,
    description: article.excerpt,
    keywords: article.tags?.join(", "),
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = allNewsArticles.find((a) => a.id.toString() === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewsDetailContent article={article} />
    </div>
  );
}
