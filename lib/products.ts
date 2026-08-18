import type { ProductContents, ProductIndexEntry } from "@/types/product";

export async function loadProductIndex(): Promise<ProductIndexEntry[]> {
  const mod = await import("@/data/products/index.json");
  const rows = mod.default as ProductIndexEntry[];
  return [...rows].sort((a, b) => a.id.localeCompare(b.id));
}

export async function loadProductContents(
  productId: string,
): Promise<ProductContents> {
  const mod = await import(`@/data/products/${productId}.json`);
  return mod.default as ProductContents;
}
