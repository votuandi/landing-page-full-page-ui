import { notFound } from "next/navigation";
import { loadCollectionItem } from "../../../../../lib/collections.ts";
import { collectionDeps } from "../../../../../lib/collectionRuntime.ts";
import { CollectionForm } from "../../../../../components/CollectionForm.tsx";

export default async function NewCollectionItem({ params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const data = await loadCollectionItem(collection, undefined, collectionDeps);
  if (!data) notFound();
  return <CollectionForm key={collection} name={data.name} initial={data.input} bilingual={data.bilingual} references={data.references} />;
}
