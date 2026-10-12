export interface EnterpriseBusinessWorkspaceData {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
  };
  catalog: Array<{
    id: string;
    item_type: string;
    category: string | null;
    name: string;
    description: string | null;
    base_price: number | null;
    status: string;
    quantity: number | null;
    image_url: string | null;
    attributes: Record<string, unknown> | null;
  }>;
  mobileMoneyServices: Array<{
    id: string;
    name: string;
    description: string | null;
    service_type: string;
    status: string;
  }>;
  loanProducts: Array<{
    id: string;
    name: string;
    description: string | null;
    min_amount: number | null;
    max_amount: number | null;
    interest_rate: number | null;
    repayment_period: number | null;
    requires_collateral: boolean;
    status: string;
  }>;
  mobileMoneyServiceCount: number;
  activeMobileMoneyServiceCount: number;
  loanApplicationCount: number;
  loanProductCount: number;
  activeLoanProductCount: number;
  activeLoanTermCount: number;
}
