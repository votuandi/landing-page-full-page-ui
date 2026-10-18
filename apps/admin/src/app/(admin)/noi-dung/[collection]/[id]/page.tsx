import { notFound } from "next/navigation";
import { loadCollectionItem } from "../../../../../lib/collections.ts";
import { collectionDeps } from "../../../../../lib/collectionRuntime.ts";
import { CollectionForm } from "../../../../../components/CollectionForm.tsx";

export default async function EditCollectionItem({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params;
  const data = await loadCollectionItem(collection, id, collectionDeps);
  if (!data) notFound();
  return <CollectionForm key={`${collection}/${id}`} name={data.name} initial={data.input} bilingual={data.bilingual} />;
}
