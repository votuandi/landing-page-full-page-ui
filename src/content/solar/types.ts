export type SystemType = "hoa-luoi" | "hybrid";
export type SegmentId = "factory" | "retail" | "home";
export interface Brand {
  name: string; slogan: string; url: string; email: string; address: string;
  hotlines: { id: string; label: string; phone: string }[];
  zalo: { home: string; business: string }; socials: { label: string; url: string }[];
  licenses: { id: string; title: string; lookupUrl?: string; image?: string }[];
}
export interface Package {
  id: string; name: string; type: SystemType; contactSegment: "home" | "business"; minBill: number; maxBill: number | null;
  kwp: number; storageKwh: number; price: number; equipment: string[];
  warranty: string; phases: number; roofM2: number;
}
export interface Province { id: string; name: string; pvout: number; source: string; verified: boolean }
export interface Assumptions {
  electricityPrice: number; pr: number; selfUse: Record<SystemType, number>;
  defaultBill: number; defaultProvince: string; years: number;
  installment: { minMonths: number; maxMonths: number; defaultMonths: number; interestPerMonth: number };
  monthlyFactors: number[]; carbonKgPerKwh: number; source: string; verified: boolean;
}
export interface LegalItem { id: string; question: string; answer: string; source: string; verified: boolean }
export interface Project {
  id: string; segment: SegmentId; title: string; business: string; provinceId: string;
  packageId: string; image: string; video?: string; description: string; verified: boolean;
}
export interface Testimonial { id: string; name: string; role: string; quote: string; photo?: string; sourceUrl?: string; verified: boolean }
export interface Segment {
  id: SegmentId; label: string; title: string; answer: string; consumption: number[];
  advantages: Record<SystemType, string>; limitations: Record<SystemType, string>; recommendation: string;
}
export interface Copy {
  eyebrow: string; heroTitle: string; heroDescription: string; demoNotice: string;
  problems: { title: string; text: string }[];
  faq: { question: string; answer: string }[];
  billRanges: { label: string; value: number }[];
}
