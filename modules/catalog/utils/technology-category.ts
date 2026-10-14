const categoryKeywords: Record<string, string[]> = {
  "computers-laptops": ["computer", "laptop", "desktop", "pc", "notebook"],
  "phones-tablets": ["phone", "smartphone", "tablet", "mobile"],
  accessories: ["accessory", "accessories", "charger", "cable", "keyboard", "mouse", "adapter"],
  networking: ["network", "router", "switch", "wifi", "wireless", "ethernet", "connectivity"],
  "software-applications": ["software", "application", "app", "licensing", "operating system"],
  "repairs-maintenance": ["repair", "maintenance", "diagnostic", "troubleshooting", "fix"],
  "printers-printing": ["printer", "printing", "scanner", "toner", "ink"],
  "cctv-security": ["cctv", "security", "camera", "surveillance", "monitoring"],
  "data-storage": ["data", "storage", "backup", "server", "recovery", "hard drive"],
  "it-support": ["it support", "technical support", "helpdesk", "help desk"],
  "web-digital-solutions": ["web", "website", "digital", "development", "online"],
  "technology-consultation": ["consultation", "consulting", "technology advice", "technology consultation"],
};

export const technologyCategoryCapabilities: Record<string, { products: boolean; services: boolean; gallery: boolean }> = {
  "computers-laptops": { products: true, services: true, gallery: true },
  "phones-tablets": { products: true, services: true, gallery: true },
  accessories: { products: true, services: true, gallery: false },
  networking: { products: true, services: true, gallery: true },
  "software-applications": { products: true, services: true, gallery: false },
  "repairs-maintenance": { products: false, services: true, gallery: false },
  "printers-printing": { products: true, services: true, gallery: true },
  "cctv-security": { products: true, services: true, gallery: true },
  "data-storage": { products: true, services: true, gallery: true },
  "it-support": { products: false, services: true, gallery: false },
  "web-digital-solutions": { products: false, services: true, gallery: true },
  "technology-consultation": { products: false, services: true, gallery: false },
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchesTechnologyCategory(
  item: { name?: string | null; description?: string | null; category?: string | null },
  categoryId: string,
) {
  const keywords = categoryKeywords[categoryId];
  if (!keywords) return false;

  const matchesText = (value: string) => {
    const searchable = normalize(value);
    const words = new Set(searchable.split(" "));
    return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return normalizedKeyword.includes(" ")
      ? searchable.includes(normalizedKeyword)
      : words.has(normalizedKeyword);
    });
  };

  const category = item.category?.trim() ?? "";
  const searchableCategory = normalize(category);
  if (searchableCategory) {
    const categoryMatches = Object.entries(categoryKeywords)
      .filter(([, categoryTerms]) => categoryTerms.some((term) => {
        const normalizedTerm = normalize(term);
        return normalizedTerm.includes(" ")
          ? searchableCategory.includes(normalizedTerm)
          : new Set(searchableCategory.split(" ")).has(normalizedTerm);
      }))
      .map(([id]) => id);
    if (categoryMatches.length) return categoryMatches.includes(categoryId);
  }

  const name = item.name?.trim() ?? "";
  if (name && matchesText(name)) return true;
  const description = item.description?.trim() ?? "";
  return !name && !category && Boolean(description) && matchesText(description);
}

export function technologyCategoryName(categoryId: string) {
  return {
    "computers-laptops": "Computers & Laptops",
    "phones-tablets": "Phones & Tablets",
    accessories: "Accessories",
    networking: "Networking",
    "software-applications": "Software & Applications",
    "repairs-maintenance": "Repairs & Maintenance",
    "printers-printing": "Printers & Printing",
    "cctv-security": "CCTV & Security",
    "data-storage": "Data & Storage",
    "it-support": "IT Support",
    "web-digital-solutions": "Web & Digital Solutions",
    "technology-consultation": "Technology Consultation",
  }[categoryId] ?? categoryId.replaceAll("-", " ");
}
