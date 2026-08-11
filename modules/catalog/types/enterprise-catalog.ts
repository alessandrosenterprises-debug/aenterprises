export interface EnterpriseCatalogItem {
  id: string;

  business_id: string;

  item_type: string;

  category: string | null;

  name: string;

  description: string | null;

  base_price: number;

  quantity: number;

  status: string;

  image_url: string | null;

  attributes: Record<string, any>;

  created_at: string;

  updated_at: string;

  businesses?: {
    id: string;
    name: string;
  };
}