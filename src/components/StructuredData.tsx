import { CompanyInfo, Product, Service, News, Project, Office } from "@prisma/client";

interface StructuredDataProps {
  type: "Organization" | "Product" | "Service" | "Article" | "BreadcrumbList" | "Project" | "FAQ" | "HowTo" | "Review" | "LocalBusiness";
  data: any;
  companyInfo?: CompanyInfo | null;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface HowToStep {
  name: string;
  text: string;
  image?: string;
  url?: string;
}

interface Review {
  author: string;
  rating: number;
  reviewBody: string;
  datePublished?: string;
}

export default function StructuredData({
  type,
  data,
  companyInfo,
}: StructuredDataProps) {
  const baseUrl = "https://phanphoisolar.com";

  const getSchema = () => {
    switch (type) {
      case "Organization":
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: companyInfo?.companyName || "Trọng Tín Solar",
          url: baseUrl,
          logo: companyInfo?.logoUrl
            ? `${baseUrl}${companyInfo.logoUrl}`
            : `${baseUrl}/logo.png`,
          description:
            companyInfo?.mission ||
            "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao",
          sameAs: [
            companyInfo?.facebook,
            companyInfo?.youtube,
            companyInfo?.instagram,
            companyInfo?.tiktok,
          ].filter(Boolean) as string[],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Service",
            availableLanguage: "Vietnamese",
          },
        };

      case "Product":
        const product = data as Product & { category?: { name: string } };
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description
            ?.replace(/<[^>]*>/g, "")
            .substring(0, 500),
          image: product.imageUrl
            ? `${baseUrl}${product.imageUrl}`
            : `${baseUrl}/images/placeholder-product.svg`,
          category: product.category?.name || "Năng lượng mặt trời",
          brand: {
            "@type": "Brand",
            name: companyInfo?.companyName || "Trọng Tín Solar",
          },
          offers: product.price
            ? (() => {
                // Improved price parsing: handle various formats
                // Remove all non-numeric characters except decimal point
                let priceStr = product.price.replace(/[^\d.,]/g, "");
                // Replace comma with dot for decimal separator
                priceStr = priceStr.replace(/,/g, ".");
                // Remove multiple decimal points, keep only the first one
                const parts = priceStr.split(".");
                if (parts.length > 2) {
                  priceStr = parts[0] + "." + parts.slice(1).join("");
                }
                // Extract numeric value
                const numericPrice = priceStr.replace(/[^\d.]/g, "");
                const priceValue = numericPrice && !isNaN(parseFloat(numericPrice)) 
                  ? parseFloat(numericPrice).toString() 
                  : undefined;
                
                return {
                  "@type": "Offer",
                  ...(priceValue ? { price: priceValue } : {}),
                  priceCurrency: "VND",
                  availability: "https://schema.org/InStock",
                  url: `${baseUrl}/product/${product.id}`,
                };
              })()
            : {
                "@type": "Offer",
                priceCurrency: "VND",
                availability: "https://schema.org/InStock",
                url: `${baseUrl}/product/${product.id}`,
              },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.5",
            reviewCount: "10",
          },
        };

      case "Service":
        const service = data as Service;
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: service.description
            ?.replace(/<[^>]*>/g, "")
            .substring(0, 500),
          image: service.image
            ? `${baseUrl}${service.image}`
            : `${baseUrl}/images/service-placeholder.jpg`,
          provider: {
            "@type": "Organization",
            name: companyInfo?.companyName || "Trọng Tín Solar",
            url: baseUrl,
          },
          areaServed: {
            "@type": "Country",
            name: "Vietnam",
          },
          serviceType: service.category,
          offers: service.price
            ? (() => {
                // Improved price parsing: handle various formats
                let priceStr = service.price.replace(/[^\d.,]/g, "");
                priceStr = priceStr.replace(/,/g, ".");
                const parts = priceStr.split(".");
                if (parts.length > 2) {
                  priceStr = parts[0] + "." + parts.slice(1).join("");
                }
                const numericPrice = priceStr.replace(/[^\d.]/g, "");
                const priceValue = numericPrice && !isNaN(parseFloat(numericPrice)) 
                  ? parseFloat(numericPrice).toString() 
                  : undefined;
                
                return {
                  "@type": "Offer",
                  ...(priceValue ? { price: priceValue } : {}),
                  priceCurrency: "VND",
                  url: `${baseUrl}/service/${service.id}`,
                };
              })()
            : {
                "@type": "Offer",
                priceCurrency: "VND",
                url: `${baseUrl}/service/${service.id}`,
              },
        };

      case "Article":
        const article = data as News;
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt || article.content?.replace(/<[^>]*>/g, "").substring(0, 200),
          image: article.imageUrl
            ? `${baseUrl}${article.imageUrl}`
            : `${baseUrl}/images/news-placeholder.jpg`,
          datePublished: article.publishedAt
            ? new Date(article.publishedAt).toISOString()
            : new Date(article.createdAt).toISOString(),
          dateModified: new Date(article.updatedAt).toISOString(),
          author: {
            "@type": "Person",
            name: article.author || "Administrator",
          },
          publisher: {
            "@type": "Organization",
            name: companyInfo?.companyName || "Trọng Tín Solar",
            logo: {
              "@type": "ImageObject",
              url: companyInfo?.logoUrl
                ? `${baseUrl}${companyInfo.logoUrl}`
                : `${baseUrl}/logo.png`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${baseUrl}/news/${article.id}`,
          },
          keywords: article.tags?.join(", ") || article.category,
        };

      case "Project":
        const project = data as Project;
        return {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: project.title,
          description: project.description
            ?.replace(/<[^>]*>/g, "")
            .substring(0, 500) || `Dự án năng lượng mặt trời ${project.title}`,
          image: project.imageUrl
            ? `${baseUrl}${project.imageUrl}`
            : `${baseUrl}/images/project-placeholder.jpg`,
          creator: {
            "@type": "Organization",
            name: companyInfo?.companyName || "Trọng Tín Solar",
            url: baseUrl,
          },
          locationCreated: project.location
            ? {
                "@type": "Place",
                name: project.location,
              }
            : undefined,
          dateCreated: project.createdAt
            ? new Date(project.createdAt).toISOString()
            : undefined,
          keywords: `${project.category}, năng lượng mặt trời, solar project`,
          about: {
            "@type": "Thing",
            name: "Solar Energy Project",
          },
        };

      case "BreadcrumbList":
        const breadcrumbs = data as Array<{ name: string; url: string }>;
        return {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: `${baseUrl}${crumb.url}`,
          })),
        };

      case "FAQ":
        const faqItems = data as FAQItem[];
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        };

      case "HowTo":
        const howToData = data as {
          name: string;
          description: string;
          steps: HowToStep[];
          image?: string;
          totalTime?: string;
        };
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: howToData.name,
          description: howToData.description,
          image: howToData.image
            ? `${baseUrl}${howToData.image}`
            : companyInfo?.logoUrl
            ? `${baseUrl}${companyInfo.logoUrl}`
            : `${baseUrl}/og-image.jpg`,
          totalTime: howToData.totalTime || "PT1H",
          step: howToData.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.name,
            text: step.text,
            image: step.image ? `${baseUrl}${step.image}` : undefined,
            url: step.url ? `${baseUrl}${step.url}` : undefined,
          })),
        };

      case "Review":
        const reviewData = data as Review | Review[];
        const reviews = Array.isArray(reviewData) ? reviewData : [reviewData];
        return {
          "@context": "https://schema.org",
          "@type": "Review",
          itemReviewed: {
            "@type": "Organization",
            name: companyInfo?.companyName || "Trọng Tín Solar",
          },
          reviewRating: {
            "@type": "Rating",
            ratingValue: reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 4.5,
            bestRating: 5,
            worstRating: 1,
          },
          author: reviews.length === 1
            ? {
                "@type": "Person",
                name: reviews[0].author,
              }
            : undefined,
          reviewBody: reviews.length === 1 ? reviews[0].reviewBody : undefined,
          datePublished: reviews.length === 1 && reviews[0].datePublished
            ? new Date(reviews[0].datePublished).toISOString()
            : undefined,
          ...(reviews.length > 1 && {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
              reviewCount: reviews.length,
              bestRating: 5,
              worstRating: 1,
            },
          }),
        };

      case "LocalBusiness":
        const office = data as Office;
        return {
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: companyInfo?.companyName || "Trọng Tín Solar",
          image: companyInfo?.logoUrl
            ? `${baseUrl}${companyInfo.logoUrl}`
            : `${baseUrl}/logo.png`,
          description:
            companyInfo?.mission ||
            "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao",
          address: {
            "@type": "PostalAddress",
            streetAddress: office?.address || "",
            addressLocality: "Lấp Vò",
            addressRegion: "Đồng Tháp",
            addressCountry: "VN",
          },
          telephone: office?.phone || "",
          email: office?.email || "",
          openingHoursSpecification: office?.workingTime
            ? {
                "@type": "OpeningHoursSpecification",
                dayOfWeek: [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ],
                opens: "08:00",
                closes: "17:30",
              }
            : undefined,
          url: baseUrl,
          sameAs: [
            companyInfo?.facebook,
            companyInfo?.youtube,
            companyInfo?.instagram,
            companyInfo?.tiktok,
          ].filter(Boolean) as string[],
          priceRange: "$$",
          areaServed: {
            "@type": "Country",
            name: "Vietnam",
          },
        };

      default:
        return null;
    }
  };

  const schema = getSchema();

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
