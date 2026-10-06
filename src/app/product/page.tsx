import { Suspense } from "react";
import ProductCatalog from "@/components/ProductCatalog";
import { CATALOG_COPY as C } from "@/content/site";
import { makeMetadata } from "@/utils/solar";
export const metadata = makeMetadata(C.title, C.description, "/product");
export default function Page() {
  return (
    <main>
      <section className="t5-page-hero">
        <div className="t5-container">
          <h1 className="t5-page-title">{C.title}</h1>
          <p className="t5-page-desc">{C.description}</p>
        </div>
      </section>
      <Suspense fallback={<p className="t5-container py-12">{C.loading}</p>}>
        <ProductCatalog />
      </Suspense>
    </main>
  );
}
