export interface Product {
  id: string;
  business_id: string;

  name: string;
  description: string | null;
  category: string | null;
  sku: string | null;

  price: number;
  quantity: number;

  image_url: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;

  businesses?: {
    name: string;
  };
}