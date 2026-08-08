export interface Customer {
  id: string;
  business_id: string;

  full_name: string;
  phone: string;
  email: string | null;

  address: string | null;
  gender: string | null;

  status: string;

  created_at: string;
  updated_at: string;
}