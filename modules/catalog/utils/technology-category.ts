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
  "it-support": ["support", "technical support", "helpdesk", "help desk"],
  "web-digital-solutions": ["web", "website", "digital", "development", "online"],
  "technology-consultation": ["consultation", "consulting", "technology advice", "solution"],
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

  const searchable = normalize([item.category, item.name, item.description].filter(Boolean).join(" "));
  const words = new Set(searchable.split(" "));

  return keywords.some((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return normalizedKeyword.includes(" ")
      ? searchable.includes(normalizedKeyword)
      : words.has(normalizedKeyword);
  });
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
