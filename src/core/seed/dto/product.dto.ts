export class SeedProduct {
  title: string;
  price: number;
  images: string[];
  purchaseLimit: number;
  category: string;
  product_url: string;
  tcin: string;
  upc: string;
  specs: Record<string, string>;
  categories: SeedCategory[];
}
