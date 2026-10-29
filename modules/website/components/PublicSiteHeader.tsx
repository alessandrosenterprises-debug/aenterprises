"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, Users, X } from "lucide-react";
import type { PublicWebsiteData } from "@/modules/website/services/public-website.service";
import ImagePreview from "@/components/ui/image-preview/ImagePreview";

export default function PublicSiteHeader({ data }: { data: PublicWebsiteData }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const page = pathname.split("/")[1] || "home";
  const isHome = pathname === "/";
  const name = data.website.title?.trim() || data.company.company_name;
  const logo = data.website.logo_url || data.company.logo_url || "/brand/alessandro-enterprises-logo.png";
  const facebookPageUrl = getFacebookPageUrl(data.website.facebook_page_url);

  return <>
    <header className="site-header">
      <div className="container navbar">
        <Link href="/" className="brand" aria-label={`${name} home`}>
          <span className="brand-mark brand-logo"><ImagePreview src={logo} alt={`${name} logo`} width={100} height={100} priority imageClassName="object-contain" /></span>
          <span className="brand-name"><strong>{name}</strong><small>{data.company.tagline || "ONE VISION. MANY POSSIBILITIES."}</small></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <PublicNavLink href="/" active={isHome}>Home</PublicNavLink>
          {data.website.show_businesses && <PublicNavLink href="/businesses" active={page === "businesses"}>Our Businesses</PublicNavLink>}
          {data.website.show_products && <PublicNavLink href="/products" active={page === "products"}>Products &amp; Services</PublicNavLink>}
          {data.website.show_promotions && <PublicNavLink href="/offers" active={page === "offers"}>Offers</PublicNavLink>}
          <PublicNavLink href="/about" active={page === "about"}>About Us</PublicNavLink>
          {data.website.show_contact_information && <PublicNavLink href="/contact" active={page === "contact"}>Contact</PublicNavLink>}
        </nav>
        <div className="header-actions">{facebookPageUrl && <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer" className="facebook-page-link" aria-label="Visit Alessandro Enterprises on Facebook"><span aria-hidden="true">f</span></a>}<Link href="/customer/login" className="btn btn-outline header-btn"><Users aria-hidden="true" />Customer Portal</Link><Link href={data.website.show_products ? "/products" : "/businesses"} className="btn btn-gold header-btn header-explore">Explore <ArrowUpRight aria-hidden="true" /></Link></div>
        <button type="button" className="mobile-menu-btn" aria-label={mobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>{mobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileMenuOpen && <nav className="mobile-nav" aria-label="Mobile navigation">
        <PublicMobileLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</PublicMobileLink>
        {data.website.show_businesses && <PublicMobileLink href="/businesses" onClick={() => setMobileMenuOpen(false)}>Our Businesses</PublicMobileLink>}
        {data.website.show_products && <PublicMobileLink href="/products" onClick={() => setMobileMenuOpen(false)}>Products &amp; Services</PublicMobileLink>}
        {data.website.show_promotions && <PublicMobileLink href="/offers" onClick={() => setMobileMenuOpen(false)}>Offers</PublicMobileLink>}
        <PublicMobileLink href="/about" onClick={() => setMobileMenuOpen(false)}>About Us</PublicMobileLink>
        {data.website.show_contact_information && <PublicMobileLink href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</PublicMobileLink>}
        {facebookPageUrl && <a href={facebookPageUrl} target="_blank" rel="noopener noreferrer" className="facebook-mobile-link"><span aria-hidden="true">f</span> Follow us on Facebook</a>}
        <Link href="/customer/login" className="btn btn-gold mobile-portal">Customer Portal <ArrowUpRight aria-hidden="true" /></Link>
      </nav>}
    </header>
  </>;
}

function PublicNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>{children}</Link>;
}

function PublicMobileLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return <Link href={href} onClick={onClick}>{children}</Link>;
}

function getFacebookPageUrl(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && /(^|\.)facebook\.com$|(^|\.)fb\.com$/i.test(url.hostname) && url.pathname !== "/" ? url.href : null;
  } catch {
    return null;
  }
}
