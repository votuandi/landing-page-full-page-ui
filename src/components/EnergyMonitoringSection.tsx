import Image from "next/image";
import {
  BellAlertIcon,
  BoltIcon,
  ChartBarSquareIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

const benefits = [
  {
    icon: BoltIcon,
    title: "Theo dõi theo thời gian thực",
    description: "Nắm ngay sản lượng điện mặt trời, mức tiêu thụ và lượng điện mua từ hoặc phát lên lưới.",
  },
  {
    icon: ChartBarSquareIcon,
    title: "Dữ liệu trực quan, dễ hiểu",
    description: "Biểu đồ ngày, tuần và tháng giúp người dùng nhìn nhanh xu hướng sử dụng điện và hiệu suất hệ thống.",
  },
  {
    icon: BellAlertIcon,
    title: "Cảnh báo bất thường",
    description: "Nhận cảnh báo khi sản lượng giảm, mức tiêu thụ tăng hoặc thiết bị cần được kiểm tra.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Quản lý mọi lúc, mọi nơi",
    description: "Theo dõi hệ thống thuận tiện trên cả bảng điều khiển trực tuyến và ứng dụng di động.",
  },
];


export default function EnergyMonitoringSection() {
  return (
    <section className="t5-section bg-white">
      <div className="t5-container">
        <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div data-reveal="left">
            <span className="t5-eyebrow">Quản lý năng lượng thông minh</span>
            <h2 className="t5-heading">Mọi chỉ số năng lượng đều nằm trong tầm mắt</h2>
            <p className="t5-subheading">
              Từ sản lượng phát điện đến mức tiêu thụ và cảnh báo bất thường, tất cả được hiển thị trực quan để doanh nghiệp dễ dàng kiểm soát.
            </p>

            <div data-reveal-stagger="up" className="mt-8 grid gap-4 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="t8-card p-5">
                  <div className="flex h-10 w-10 rounded-xl items-center justify-center bg-[var(--t5-primary)] text-[var(--t5-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-black text-[var(--t5-primary)]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ["24/7", "Giám sát"],
                ["Thời gian thực", "Dữ liệu"],
                ["Trực tuyến + ứng dụng", "Truy cập"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4">
                  <div className="text-lg font-black text-[var(--t5-burgundy)] sm:text-xl">{value}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[.13em] text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <figure data-reveal="right" className="t8-card overflow-hidden shadow-2xl">
            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
              <Image
                src="/images/energy-monitoring-dashboard.webp"
                alt="Người dùng theo dõi sản lượng, tiêu thụ, pin lưu trữ và cảnh báo hệ thống điện mặt trời trên ứng dụng quản lý năng lượng"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
              />
            </div>
            <figcaption className="grid gap-4 bg-[var(--t5-primary)] p-5 text-white sm:grid-cols-[auto_1fr] sm:items-center sm:p-6">
              <div className="inline-flex w-fit rounded-full items-center gap-2 border border-[var(--t5-accent)]/40 bg-[var(--t5-accent)]/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[var(--t5-accent)]">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Giám sát 24/7
              </div>
              <p className="text-sm font-semibold leading-6 text-white/75">
                Theo dõi sản lượng, mức tiêu thụ, điện lưới, pin lưu trữ và cảnh
                báo ngay trên điện thoại hoặc bảng điều khiển trực tuyến.
              </p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
