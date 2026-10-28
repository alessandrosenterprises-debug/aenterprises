import type { PublicBusiness, PublicCatalogItem, PublicOffer, PublicUpdate } from "@/modules/website/services/public-website.service";

/** Replaceable public showcase content used only when AEOS has not published enough live website content. */
export const demoBusinesses: PublicBusiness[] = [
  { id: "demo-business-tech", name: "Alessandro Tech Solutions", slug: "tech-solutions", description: "Business technology, computers, networking, software and practical technical support for homes and organisations.", logo_url: null, is_demo: true },
  { id: "demo-business-fashion", name: "Alessandro Elite Fashion", slug: "elite-fashion", description: "Contemporary clothing, style essentials and carefully selected fashion for every occasion.", logo_url: null, is_demo: true },
  { id: "demo-business-barber", name: "Alessandro Classic Barbershop", slug: "classic-barbershop", description: "Professional barbering, grooming and personal care with a classic service experience.", logo_url: null, is_demo: true },
  { id: "demo-business-delivery", name: "Alessandro Delivery Service", slug: "delivery-service", description: "Reliable collection and delivery for documents, parcels and purchases from participating businesses.", logo_url: null, is_demo: true },
  { id: "demo-business-money", name: "Alessandro Mobile Money", slug: "mobile-money", description: "Convenient mobile money services, transfers and payment support through our service team.", logo_url: null, is_demo: true },
  { id: "demo-business-loans", name: "Alessandro Soft Loans", slug: "soft-loans", description: "Loan options designed to support personal plans and small business needs, subject to assessment.", logo_url: null, is_demo: true },
  { id: "demo-business-enterprise", name: "Alessandro Enterprise Services", slug: "enterprise-services", description: "Customer assistance and business services that connect the wider Alessandro Enterprises experience.", logo_url: null, is_demo: true },
];

export const demoProducts: PublicCatalogItem[] = [
  { id: "demo-product-laptop", business_id: "demo-business-tech", name: "Business Laptop Setup", description: "Laptop supply, initial configuration, essential software setup and handover support.", category: "Computers", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-network", business_id: "demo-business-tech", name: "Network Installation", description: "A site visit to plan and install a dependable small-office or home network.", category: "Networking", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-repair", business_id: "demo-business-tech", name: "Computer Diagnostics", description: "Professional fault assessment and repair recommendations for computers and accessories.", category: "Repairs", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-support", business_id: "demo-business-tech", name: "IT Support Consultation", description: "Talk through a technology issue and get a clear next step from a support specialist.", category: "Consultation", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-clothing", business_id: "demo-business-fashion", name: "Everyday Style Collection", description: "A sample of wardrobe staples selected by Alessandro Elite Fashion.", category: "Clothing", item_type: "product", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-accessory", business_id: "demo-business-fashion", name: "Fashion Accessories", description: "Finishing touches and accessories to complement your everyday look.", category: "Accessories", item_type: "product", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-haircut", business_id: "demo-business-barber", name: "Classic Haircut", description: "A professional haircut tailored to your preferred style.", category: "Barbering", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-grooming", business_id: "demo-business-barber", name: "Grooming Service", description: "A considered grooming experience with a clean, classic finish.", category: "Grooming", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-delivery", business_id: "demo-business-delivery", name: "Point-to-Point Delivery", description: "Request collection from one address and delivery to another. The final price is confirmed in the customer portal.", category: "Courier", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-collection", business_id: "demo-business-delivery", name: "Shop Collection", description: "Arrange a courier collection from participating business locations.", category: "Collection", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-transfer", business_id: "demo-business-money", name: "Mobile Money Service", description: "Ask our team about available mobile money services and transaction requirements.", category: "Payments", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-loan-personal", business_id: "demo-business-loans", name: "Personal Loan Enquiry", description: "Review available loan products and submit an application for assessment.", category: "Personal finance", item_type: "service", base_price: null, image_url: null, is_demo: true },
  { id: "demo-product-loan-sme", business_id: "demo-business-loans", name: "SME Working Capital Enquiry", description: "Discuss a working capital need and learn which application documents may be required.", category: "Business finance", item_type: "service", base_price: null, image_url: null, is_demo: true },
];

export const demoOffers: PublicOffer[] = [
  { id: "demo-offer-tech-check", business_id: "demo-business-tech", title: "Technology Service Consultation", description: "Start with a conversation about your business technology needs.", discount_text: "FEATURED SERVICE", image_url: null, end_date: null, is_demo: true },
  { id: "demo-offer-fashion", business_id: "demo-business-fashion", title: "Discover the Latest Collection", description: "Explore current clothing and accessories in the customer portal.", discount_text: "NEW COLLECTION", image_url: null, end_date: null, is_demo: true },
  { id: "demo-offer-barber", business_id: "demo-business-barber", title: "Book Your Grooming Visit", description: "Choose a convenient service and request an appointment.", discount_text: "BOOKING AVAILABLE", image_url: null, end_date: null, is_demo: true },
  { id: "demo-offer-delivery", business_id: "demo-business-delivery", title: "Delivery and Shop Collection", description: "Check service coverage and estimated pricing before submitting a request.", discount_text: "COURIER SERVICE", image_url: null, end_date: null, is_demo: true },
  { id: "demo-offer-loan", business_id: "demo-business-loans", title: "Explore Loan Options", description: "View available loan products and terms before applying.", discount_text: "APPLICATIONS VIA AEOS", image_url: null, end_date: null, is_demo: true },
];

export const demoUpdates: PublicUpdate[] = [
  { id: "demo-update-portal", business_id: "demo-business-enterprise", title: "One customer portal for Alessandro Enterprises", content: "Use the customer portal to manage bookings, orders, deliveries, messages and eligible loan applications in one place.", image_url: null, published_at: null, is_demo: true },
  { id: "demo-update-tech", business_id: "demo-business-tech", title: "Technology help for growing teams", content: "Explore computer, networking and support services for homes and organisations through Alessandro Tech Solutions.", image_url: null, published_at: null, is_demo: true },
  { id: "demo-update-service", business_id: "demo-business-delivery", title: "Keep up with your requests", content: "Signed-in customers can follow eligible requests and receive updates through the AEOS customer experience.", image_url: null, published_at: null, is_demo: true },
];
