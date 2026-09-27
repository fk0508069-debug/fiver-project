import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts } from "@/services/productService";
import { ProductDetail } from "@/components/products/ProductDetail";
import { ProductRecommendations } from "@/components/products/ProductRecommendations";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProductById(id);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.shortDescription || p.description.slice(0, 155),
    openGraph: {
      title: p.name,
      images: p.images?.[0] ? [p.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const related = await getRelatedProducts(id, product.category, 4);

  return (
    <div className="container-x py-12">
      <ProductDetail product={product} />
      <ProductRecommendations
        products={related}
        title="You may also like"
        subtitle={`More from ${product.category}`}
      />
    </div>
  );
}