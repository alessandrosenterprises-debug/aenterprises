"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Building2, CircleHelp, Mail, MapPin, MessageCircle, Phone, Search, ShieldCheck, Sparkles, Users, Wrench, X } from "lucide-react";
import type { PublicWebsiteData } from "@/modules/website/services/public-website.service";
import ProductExplorer from "@/modules/website/components/ProductExplorer";
import OfferExplorer from "@/modules/website/components/OfferExplorer";
import ImagePreview from "@/components/ui/image-preview/ImagePreview";
import PublicSiteHeader from "@/modules/website/components/PublicSiteHeader";

export default function PublicWebsiteHome({ data }: { data: PublicWebsiteData }) {
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const page = pathname.split("/")[1] || "home";
  const isHome = pathname === "/";
  const showContacts = data.website.show_contact_information;
  const businessById = useMemo(() => new Map(data.businesses.map((business) => [business.id, business])), [data.businesses]);
  const filteredBusinesses = data.businesses.filter((business) => `${business.name} ${business.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));
  const name = data.website.title?.trim() || data.company.company_name;
  const logo = data.website.logo_url || data.company.logo_url || "/brand/alessandro-enterprises-logo.png";
  const facebookPageUrl = getFacebookPageUrl(data.website.facebook_page_url);
  const facebookFeedUrl = facebookPageUrl ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(facebookPageUrl)}&tabs=timeline&width=500&height=520&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=true` : null;
  const contactHref = isHome ? "#contact" : "/contact#contact";
  const exploreHref = data.website.show_businesses ? (isHome ? "#businesses" : "/businesses") : data.website.show_products ? (isHome ? "#products" : "/products") : "/customer";

  const pageTitles: Record<string, string> = {
    businesses: "Our Businesses",
    products: "Products & Services",
    offers: "Current Offers",
    about: "About Alessandro Enterprises",
    contact: "Contact Us",
  };

  return <main className="aeos-public-site">
    <PublicSiteHeader data={data} />

    {!isHome && <section className="page-hero"><div className="container"><span className="section-tag">ALESSANDRO ENTERPRISE OPERATING SYSTEM</span><h1>{pageTitles[page] || name}</h1><p>{page === "products" ? "Discover products, services and practical solutions from across our businesses." : page === "offers" ? "Explore current offers and featured services published by our teams." : page === "businesses" ? "Meet the businesses bringing the Alessandro Enterprises vision to life." : page === "contact" ? "Talk to our team or continue through the secure AEOS customer portal." : data.company.description || "One trusted enterprise connecting customers to practical services, products and support."}</p></div></section>}

    <div className="site-content">
      {isHome && <section className="hero" id="home">
        <div className="hero-overlay" />
        <div className="container hero-layout">
          <div className="hero-content">
            <span className="eyebrow"><span className="pulse-dot" />ONE ENTERPRISE <i /> MANY SOLUTIONS</span>
            <h1>{data.website.homepage_heading || <>Welcome to <span>Alessandro Enterprises.</span></>}</h1>
            <p className="hero-description">{data.company.description || data.website.meta_description || "One trusted destination for fashion, grooming, financial services, technology and professional consultations. We bring multiple solutions together to make life and business easier."}</p>
            <div className="hero-actions"><Link href={exploreHref} className="btn btn-gold">{data.website.show_businesses ? "Explore Our Businesses" : data.website.show_products ? "Browse Products & Services" : "Open Customer Portal"} <ArrowRight aria-hidden="true" /></Link><Link href="/customer" className="btn btn-outline"><Users aria-hidden="true" />Customer Portal</Link></div>
            <div className="hero-trust"><ShieldCheck aria-hidden="true" /><span>Trusted service, secure requests and support connected through AEOS.</span></div>
            <div className="hero-highlights"><div><strong>{data.businesses.length}{data.businesses.some((business) => business.is_demo) ? "*" : "+"}</strong><span>Businesses</span></div><div><strong>{data.products.length}</strong><span>Products &amp; services</span></div><div><strong>{data.offers.length}</strong><span>Current offers</span></div><div><strong>AEOS</strong><span>One customer portal</span></div></div>
          </div>
          <aside className="hero-operations" aria-label="Explore Alessandro Enterprises">
            <div className="hero-operations-heading"><span className="hero-mini-logo"><ImagePreview src={logo} alt={`${name} logo`} width={54} height={54} imageClassName="object-contain" /></span><div><strong>Explore the enterprise</strong><span>One connected customer experience</span></div><span className="hero-live"><span className="pulse-dot" />LIVE</span></div>
            <div className="hero-business-list">{data.businesses.slice(0, 4).map((business, index) => <Link className="hero-business-item" href={`/businesses/${business.slug}`} key={business.id} style={{ animationDelay: `${index * 90}ms` }}><span className="hero-business-icon">{business.logo_url ? <ImagePreview src={business.logo_url} alt={`${business.name} logo`} width={38} height={38} imageClassName="object-contain" /> : <BusinessIcon name={business.name} />}</span><span className="hero-business-copy"><small>{getBusinessCategory(business.name)}</small><strong>{business.name}</strong></span><ArrowUpRight aria-hidden="true" /></Link>)}</div>
            <div className="hero-operations-footer">{data.website.show_businesses && <Link href="/businesses">All businesses <ArrowRight aria-hidden="true" /></Link>}{data.website.show_promotions && <Link href="/offers">Offers <ArrowRight aria-hidden="true" /></Link>}{data.website.show_products && <Link href="/products">Catalogue <ArrowRight aria-hidden="true" /></Link>}</div>
          </aside>
        </div>
        <div className="hero-ticker" aria-hidden="true"><div className="hero-ticker-track">{[...data.businesses, ...data.businesses].map((business, index) => <span key={`${business.id}-${index}`}><i />{business.name}</span>)}</div></div>
        {data.businesses.some((business) => business.is_demo) && <span className="demo-note">* Includes replaceable sample profiles</span>}
      </section>}

      {page === "about" && <section className="intro section-padding" id="about">
        <div className="container intro-grid"><div className="intro-heading">{page === "about" && <span className="intro-logo"><ImagePreview src="/brand/alessandro-enterprises-logo.png" alt="Alessandro Enterprises logo" width={180} height={180} imageClassName="object-contain" priority /></span>}<span className="section-tag">WHO WE ARE</span><h2>More Than Businesses.<br /><span>One Shared Vision.</span></h2></div><div className="intro-copy"><p>{data.company.description || "Alessandro Enterprises is a growing, multi-business enterprise designed to bring convenient, reliable and customer-focused services together under one brand."}</p><p>From helping you look your best to supporting your financial needs and digital ambitions, we connect customers with useful services through one enterprise experience.</p>{page === "about" && <><p>Our portfolio brings together fashion, grooming, technology products and services, mobile money, lending, delivery and business consultations. Each team focuses on its specialist work while sharing a commitment to professional service, clear communication and customer care.</p><p>AEOS (the Alessandro Enterprise Operating System) connects the experience behind the scenes. Customers can discover businesses, browse published products and offers, submit requests, make bookings or orders, follow updates and contact support through the customer portal. Our teams use the platform to coordinate service, manage requests and keep customers informed.</p><p>We continue to build the enterprise around practical needs: making useful services easier to find, helping customers follow the progress of their requests, and giving our teams the tools to work together across the business.</p></>}{data.website.show_businesses && <Link href="/businesses" className="text-link">Explore our business portfolio <ArrowRight aria-hidden="true" /></Link>}</div></div>
      </section>}

      {page === "about" && <section className="why-us section-padding about-operating-model"><div className="container"><div className="section-heading"><span className="section-tag">HOW WE WORK</span><h2>One enterprise.<br /><span>Connected service.</span></h2><p>Specialist teams and connected tools help customers move from discovery to support.</p></div><div className="values-grid"><ValueCard icon={<Building2 />} title="A diverse business portfolio" body="Our businesses serve different needs, from clothing and grooming to technology, financial services, delivery and consultations. Explore each profile for its current published products, services, offers, gallery and updates." /><ValueCard icon={<Users />} title="A connected customer journey" body="The public website helps you discover what is available. The AEOS customer portal supports account access, service enquiries, bookings, orders, loan applications, notifications and customer support." /><ValueCard icon={<ShieldCheck />} title="Coordinated operations" body="AEOS gives authorized teams a shared place to receive and manage work, communicate updates and coordinate activity across departments, branches and business services." /><ValueCard icon={<Sparkles />} title="Built to keep improving" body="We use customer feedback, service activity and team experience to improve how our businesses serve people and how our digital experience works." /></div><div className="about-commitment"><span className="section-tag">OUR COMMITMENT</span><p>We aim to make every interaction straightforward: clear information before a request, useful updates while it is being handled, and a reliable way to ask for help when it is needed.</p>{data.website.show_contact_information && <Link href="/contact" className="text-link">Talk to our team <ArrowRight aria-hidden="true" /></Link>}</div></div></section>}

      {data.website.show_businesses && (isHome || page === "businesses") && <section className="businesses section-padding" id="businesses">
        <div className="container">
          <div className="section-heading"><span className="section-tag">OUR BUSINESS PORTFOLIO</span><h2>Everything You Need.<br /><span>All Under One Roof.</span></h2><p>Explore our businesses and discover the right solution for you.</p></div>
          <div className="business-tools"><span>{filteredBusinesses.length} {filteredBusinesses.length === 1 ? "business" : "businesses"}{data.businesses.some((business) => business.is_demo) ? " · sample listings are replaceable" : ""}</span><label className="business-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a business..." aria-label="Find a business" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear business search"><X aria-hidden="true" /></button>}</label></div>
          <div className="business-grid">
            {filteredBusinesses.map((business, index) => <article className={`business-card ${getBusinessStyle(business.name)}`} key={business.id}>
              <div className="card-top"><span className="business-icon">{business.logo_url ? <ImagePreview src={business.logo_url} alt={`${business.name} logo`} width={44} height={44} imageClassName="object-contain" /> : <BusinessIcon name={business.name} />}</span><span className="card-number">{String(index + 1).padStart(2, "0")} / {getBusinessCategory(business.name)}</span></div>
              <div className="card-content"><span className="card-category">{business.is_demo ? "AEOS SAMPLE PROFILE" : "ALESSANDRO ENTERPRISES"}</span><h3>{business.name}</h3><p>{business.description || "Discover products, services and support from this enterprise business."}</p><Link href={`/businesses/${business.slug}`} className="card-link">View Business Profile <ArrowRight aria-hidden="true" /></Link></div>
            </article>)}
            {filteredBusinesses.length === 0 && <div className="no-results"><Search aria-hidden="true" /><strong>No matching businesses</strong><span>Try another search term or clear the search.</span><button type="button" onClick={() => setQuery("")}>Clear search</button></div>}
          </div>
          <div className="portfolio-footer"><span><ShieldCheck aria-hidden="true" />Secure customer requests through AEOS</span><Link href="/customer/businesses" className="text-link">Open customer portal <ArrowUpRight aria-hidden="true" /></Link></div>
        </div>
      </section>}

      {data.website.show_promotions && (isHome || page === "offers") && <div id="offers"><OfferExplorer offers={data.offers} businesses={data.businesses} featuredOnly={isHome} /></div>}
      {page === "offers" && (!data.website.show_promotions || data.offers.length === 0) && <EmptyState message="There are no active offers at the moment. Please check back soon." />}
      {data.website.show_products && (isHome || page === "products") && <div id="products"><ProductExplorer products={data.products} businesses={data.businesses} featuredOnly={isHome} /></div>}
      {page === "products" && (!data.website.show_products || data.products.length === 0) && <EmptyState message="Our product and service listings will be available here soon." />}
      {page === "businesses" && (!data.website.show_businesses || data.businesses.length === 0) && <EmptyState message="Business information will be available here soon." />}

      {isHome && data.website.show_facebook_feed && facebookFeedUrl && <section className="section-padding facebook-feed-section" aria-labelledby="facebook-feed-title"><div className="container"><div className="facebook-feed-layout"><div className="facebook-feed-copy"><span className="section-tag">FOLLOW ALESSANDRO ENTERPRISES</span><h2 id="facebook-feed-title">Stay connected<br /><span>with our community.</span></h2><p>See public posts, business announcements and updates from the Alessandro Enterprises Facebook Page.</p><a href={facebookPageUrl!} target="_blank" rel="noopener noreferrer" className="facebook-follow-button"><span aria-hidden="true">f</span>Follow our Facebook Page<ArrowUpRight aria-hidden="true" /></a><small className="facebook-feed-note">You’ll leave this website to view or follow our Page on Facebook.</small></div><div className="facebook-feed-panel"><div className="facebook-feed-panel-head"><span className="facebook-feed-mark" aria-hidden="true">f</span><span className="facebook-feed-page-name"><strong>{name}</strong><small>Official Facebook Page</small></span><span className="facebook-feed-live"><i />Public updates</span></div><div className="facebook-feed-frame"><iframe title="Alessandro Enterprises Facebook Page feed" src={facebookFeedUrl} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="facebook-feed-iframe" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" /></div></div></div></div></section>}

      {data.updates.length > 0 && (isHome || page === "about") && <section className="news-section section-padding" id="news"><div className="container"><div className="section-heading"><span className="section-tag">FROM OUR TEAMS</span><h2>Enterprise <span>Updates.</span></h2><p>News and updates published by the people behind our businesses.</p></div><div className="news-grid">{data.updates.map((update) => <article className="news-card" key={update.id}>{update.image_url && <div className="news-image"><ImagePreview src={update.image_url} alt={update.title} fill sizes="(max-width: 768px) 100vw, 400px" imageClassName="object-cover" /></div>}<div className="news-card-body"><span>{businessById.get(update.business_id)?.name || name}{update.is_demo ? " · SAMPLE" : ""}</span><h3>{update.title}</h3><p>{update.content}</p></div></article>)}</div></div></section>}

      {isHome && <section className="why-us section-padding" id="why-us"><div className="container"><div className="section-heading"><span className="section-tag">THE ALESSANDRO DIFFERENCE</span><h2>Built Around <span>Your Needs.</span></h2><p>One enterprise. A commitment to making every interaction count.</p></div><div className="values-grid"><ValueCard icon={<ShieldCheck />} title="Trust & Reliability" body="We aim to build lasting relationships through responsible service and clear communication." /><ValueCard icon={<CircleHelp />} title="Convenience" body="Different services come together in one connected business ecosystem." /><ValueCard icon={<Users />} title="Professional Service" body="We value respectful communication, attention to detail and customer care." /><ValueCard icon={<Sparkles />} title="Continuous Growth" body="We embrace new ideas and technology to create better customer experiences." /></div></div></section>}

      {(isHome || page === "about") && showContacts && <section className="cta-section"><div className="container cta-content"><div><span className="section-tag">LET&apos;S CONNECT</span><h2>Your Vision.<br /><span>Our Mission.</span></h2><p>Have a question or need help finding the right service? We would love to hear from you.</p></div><Link href={contactHref} className="btn btn-gold">Start a Conversation <ArrowRight aria-hidden="true" /></Link></div></section>}

      {(isHome || page === "contact") && showContacts && <section className="contact section-padding" id="contact"><div className="container contact-grid"><div><span className="section-tag">CONTACT US</span><h2>We&apos;re Here<br /><span>To Help.</span></h2><p className="contact-description">Get in touch with Alessandro Enterprises for business enquiries, service information or general assistance.</p><div className="contact-actions"><Link href="/customer" className="btn btn-gold">Customer support <ArrowRight aria-hidden="true" /></Link><Link href="/customer/messages" className="text-link">Send us a message <ArrowUpRight aria-hidden="true" /></Link></div></div><div className="contact-details">
        {data.company.email && <ContactItem icon={<Mail />} label="EMAIL US"><a href={`mailto:${data.company.email}`}>{data.company.email}</a></ContactItem>}
        {data.company.phone && <ContactItem icon={<Phone />} label="CALL US"><a href={`tel:${data.company.phone.replace(/\s/g, "")}`}>{data.company.phone}</a></ContactItem>}
        {data.company.whatsapp && <ContactItem icon={<MessageCircle />} label="WHATSAPP"><a href={`https://wa.me/${data.company.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Chat with our team <ArrowUpRight aria-hidden="true" /></a></ContactItem>}
        {(data.company.address || data.company.city || data.company.country) && <ContactItem icon={<MapPin />} label="OUR LOCATION"><p>{[data.company.address, data.company.city, data.company.country].filter(Boolean).join(", ")}</p></ContactItem>}
        {!data.company.email && !data.company.phone && !data.company.whatsapp && <ContactItem icon={<MessageCircle />} label="CUSTOMER SUPPORT"><Link href="/customer/support">Open support details <ArrowRight aria-hidden="true" /></Link></ContactItem>}
      </div></div></section>}
    </div>

    <footer className="site-footer"><div className="container footer-main"><Link className="brand footer-brand" href="/" aria-label={`${name} home`}><span className="brand-mark brand-logo"><ImagePreview src={logo} alt={`${name} logo`} width={100} height={100} imageClassName="object-contain" /></span><span className="brand-name"><strong>{name}</strong><small>ONE VISION. MANY POSSIBILITIES.</small></span></Link><p>{data.company.tagline || "One enterprise. Many solutions."}</p><div className="footer-links"><Link href="/">Home</Link>{data.website.show_businesses && <Link href="/businesses">Businesses</Link>}{data.website.show_products && <Link href="/products">Products &amp; Services</Link>}{data.website.show_promotions && <Link href="/offers">Offers</Link>}<Link href="/about">About</Link>{showContacts && <Link href="/contact">Contact</Link>}<Link href="/customer">Customer Portal</Link></div></div><div className="footer-bottom"><div className="container footer-bottom-content"><p>© {new Date().getFullYear()} {name}. All rights reserved.</p><p className="footer-motto">YOUR VISION. OUR MISSION.</p></div></div></footer>
  </main>;
}

function getBusinessStyle(name: string) {
  const value = name.toLowerCase();
  if (value.includes("fashion")) return "fashion";
  if (value.includes("barber")) return "barber";
  if (value.includes("money")) return "mobile-money";
  if (value.includes("loan")) return "loans";
  if (value.includes("tech")) return "technology";
  if (value.includes("consult") || value.includes("enterprise")) return "consultation";
  return "general-business";
}

function getBusinessCategory(name: string) {
  const key = getBusinessStyle(name);
  return ({ fashion: "FASHION", barber: "GROOMING", "mobile-money": "PAYMENTS", loans: "FINANCIAL", technology: "TECHNOLOGY", consultation: "ADVISORY", "general-business": "SERVICES" } as Record<string, string>)[key];
}

function BusinessIcon({ name }: { name: string }) {
  const key = getBusinessStyle(name);
  if (key === "fashion") return <span aria-hidden="true">♢</span>;
  if (key === "barber") return <span aria-hidden="true">✂</span>;
  if (key === "mobile-money") return <span aria-hidden="true">↗</span>;
  if (key === "loans") return <span aria-hidden="true">◇</span>;
  if (key === "technology") return <Wrench aria-hidden="true" />;
  if (key === "consultation") return <Sparkles aria-hidden="true" />;
  return <Building2 aria-hidden="true" />;
}

function ValueCard({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return <article className="value-card"><div className="value-icon">{icon}</div><h3>{title}</h3><p>{body}</p></article>;
}

function ContactItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return <div className="contact-item"><span className="contact-symbol">{icon}</span><div><small>{label}</small>{children}</div></div>;
}

function getFacebookPageUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && /(^|\.)facebook\.com$|(^|\.)fb\.com$/i.test(url.hostname) && url.pathname !== "/" ? url.href : null;
  } catch { return null; }
}

function EmptyState({ message }: { message: string }) {
  return <div className="container public-empty"><Search aria-hidden="true" /><p>{message}</p></div>;
}
