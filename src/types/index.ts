// Global type definitions for the solar website

export interface Product {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
  price: string; // Giá sau khuyến mãi
  original_price?: string; // Giá gốc
  href: string;
  category?: string;
  specifications?: Record<string, string>;
}

export interface NewsArticle {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  image: string;
  category: string;
  readTime: string;
  content?: string;
  tags?: string[];
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  socialLinks: SocialLink[];
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface MenuItem {
  name: string;
  href: string;
  children?: MenuItem[];
}

export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

export interface Service {
  id: number;
  title: string;
  description: string;
  image: string;
  features: string[];
  price: string;
  category: "household" | "business" | "maintenance" | "consultation";
  duration?: string;
  warranty?: string;
}

export interface WarrantyRegistration {
  productCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  purchaseDate: string;
  installationDate?: string;
  address: string;
  notes?: string;
}

export interface WarrantyLookup {
  searchTerm: string;
  searchType: "productCode" | "phone" | "email";
}

export interface CompletedProject {
  id: number;
  title: string;
  location: string;
  capacity: string;
  completedDate: string;
  completedYear: number;
  completedMonth: number;
  image: string;
  description: string;
  category: string;
  client: string;
  investment?: string;
  duration?: string;
  features?: string[];
}
