import { SeedCategory } from './category.dto';

export class SeedProduct {
  title: string;
  price: number;
  images: string[];
  regularPrice: number;
  purchaseLimit: number;
  highlights: string[];
  description: string;
  category: string;
  product_url: string;
  tcin: string;
  upc: string;
  specs: Record<string, string>;
  categories: SeedCategory[];
}
