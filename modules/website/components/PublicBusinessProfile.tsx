import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, CheckCircle2, Clock3, Image as ImageIcon, Megaphone, Newspaper, PackageSearch, ShieldCheck, Wrench } from "lucide-react";
import type { PublicCatalogItem, PublicWebsiteData } from "@/modules/website/services/public-website.service";
import ImagePreview from "@/components/ui/image-preview/ImagePreview";
import PublicSiteHeader from "@/modules/website/components/PublicSiteHeader";

export default function PublicBusinessProfile({ data, slug }: { data: PublicWebsiteData; slug: string }) {
  const business = data.businesses.find((item) => item.slug === slug);
  if (!business) return <main className="aeos-public-site grid min-h-screen place-items-center bg-[#070B19] px-5"><div className="max-w-lg rounded-3xl border border-[#D4AF37]/20 bg-[rgba(28,37,65,0.7)] p-8 text-center shadow-xl backdrop-blur-xl"><Building2 className="mx-auto size-10 text-[#F1D46B]" /><h1 className="mt-4 text-2xl font-black text-white">Business not found</h1><p className="mt-2 text-sm leading-6 text-slate-400">This business is not currently listed on the public website.</p><Link href="/businesses" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-[#03162F]"><ArrowLeft className="size-4" />Browse businesses</Link></div></main>;

  const items = data.products.filter((item) => item.business_id === business.id);
  const offers = data.offers.filter((item) => item.business_id === business.id);
  const gallery = data.gallery.filter((image) => image.business_id === business.id);
  const updates = data.updates.filter((update) => update.business_id === business.id);
  const isSoftLoans = business.slug.toLowerCase() === "soft-loans" || business.name.toLowerCase().includes("soft loans");
  const services = items.filter((item) => ["service", "services"].includes(item.item_type.toLowerCase()));
  const products = items.filter((item) => !["service", "services"].includes(item.item_type.toLowerCase()));
  const customerHref = business.is_demo && !isSoftLoans ? "/customer/businesses" : `/customer/businesses/${business.slug}`;
  const productHref = isSoftLoans ? "/customer/businesses/soft-loans/products" : customerHref;
  const primaryActionHref = isSoftLoans ? `/customer/businesses/${business.slug}/apply` : customerHref;
  const logo = business.logo_url || data.website.logo_url || data.company.logo_url;

  return <main className="aeos-public-site business-profile-page min-h-screen bg-[#070B19] text-slate-100">
    <PublicSiteHeader data={data} />

    <section className="relative overflow-hidden bg-[#03162F] text-white"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_18%,rgba(212,175,55,0.2),transparent_32%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,0.04)_48%,transparent_75%)]" /><div className="relative grid w-full gap-7 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 lg:py-12"><div className="max-w-4xl"><div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-xs font-black uppercase tracking-[0.17em] text-[#F1D46B]">{business.is_demo ? "Sample business profile" : "Alessandro Enterprises business"}</div><h1 className="mt-4 break-words font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{business.name}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">{isSoftLoans ? "Explore available loan products, review repayment terms and submit a secure application through the customer portal. All applications are subject to assessment." : business.description || "Explore services and products from this Alessandro Enterprises business."}</p><div className="mt-6 flex flex-wrap gap-3"><Link href={primaryActionHref} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-black text-[#03162F]">{isSoftLoans ? "Apply for a loan" : "Explore services and products"}<ArrowRight className="size-4" /></Link>{isSoftLoans ? <Link href={productHref} className="loan-products-link inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white">View loan products<ArrowRight className="size-4" /></Link> : data.website.show_contact_information ? <Link href="/contact" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-bold text-white">Contact Alessandro<ArrowRight className="size-4" /></Link> : null}</div></div><div className="flex items-center gap-5 rounded-3xl border border-white/10 bg-[#092747] p-4 shadow-xl sm:p-5"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#D4AF37]/50 bg-white p-3 shadow-[8px_12px_24px_rgba(0,0,0,0.35)] [transform:perspective(600px)_rotateY(-10deg)_rotateX(5deg)] sm:size-24">{logo ? <ImagePreview src={logo} alt={`${business.name} logo`} width={96} height={96} imageClassName="object-contain" /> : <Building2 className="size-9 text-[#03162F]" />}</div><div><p className="text-xs font-bold uppercase tracking-widest text-[#F4D779]">Alessandro Enterprises</p><p className="mt-2 max-w-[180px] text-base font-black">One vision. Many possibilities.</p><span className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-300"><CheckCircle2 className="size-4" />{business.is_demo ? "Website preview listing" : "Active business"}</span></div></div></div></section>

    {business.is_demo && <div className="border-b border-amber-300/20 bg-amber-400/10 px-5 py-3 text-center text-xs font-medium text-amber-100">This is replaceable sample content. Live AEOS listings take priority whenever this business publishes its own profile and content.</div>}

    <section className="w-full px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Feature icon={<PackageSearch className="size-5" />} title={isSoftLoans ? "Loan products" : "Products & services"} detail={`${products.length} products and ${services.length} services published for this business.`} /><Feature icon={<Clock3 className="size-5" />} title={isSoftLoans ? "Apply securely" : "Request a service"} detail={isSoftLoans ? "Submit a loan application through the secure customer portal." : "Book or enquire through the AEOS customer portal."} /><Feature icon={<ImageIcon className="size-5" />} title="Photo gallery" detail={`${gallery.length} business ${gallery.length === 1 ? "photo" : "photos"} available to view.`} /><Feature icon={<Newspaper className="size-5" />} title="Business updates" detail={`${updates.length} ${updates.length === 1 ? "update" : "updates"} from this business.`} /></div>

      <nav aria-label={`${business.name} content sections`} className="sticky top-[74px] z-30 mt-6 flex gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0B132B]/95 p-2 shadow-lg backdrop-blur">
        <SectionLink href="#business-products" label={isSoftLoans ? "Loan products" : "Products"} count={products.length} />
        <SectionLink href="#business-services" label="Services" count={services.length} />
        <SectionLink href="#business-offers" label="Offers" count={offers.length} />
        <SectionLink href="#business-gallery" label="Gallery" count={gallery.length} />
        <SectionLink href="#business-updates" label="Updates" count={updates.length} />
      </nav>

      <div className="business-profile-page-content mt-9 space-y-12 sm:mt-11 sm:space-y-14">
        <ContentSection id="business-products" icon={<PackageSearch className="size-5" />} eyebrow={isSoftLoans ? "Customer lending" : "Explore the catalogue"} title={isSoftLoans ? "Loan products" : "Products"} description={isSoftLoans ? "Compare published loan amounts, rates, repayment periods and collateral requirements." : "Products published by this business in AEOS."} count={products.length}>
          {products.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((item) => <CatalogCard key={item.id} item={item} />)}</div> : <EmptyContent message={isSoftLoans ? "No active loan products are published yet." : "No products have been published for this business yet."} />}
        </ContentSection>

        <ContentSection id="business-services" icon={<Wrench className="size-5" />} eyebrow="Services" title="Services & consultations" description="Browse available services and continue to AEOS to make a booking or request." count={services.length}>
          {services.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{services.map((item) => <CatalogCard key={item.id} item={item} />)}</div> : <EmptyContent message="No services have been published for this business yet." />}
        </ContentSection>

        <ContentSection id="business-offers" icon={<Megaphone className="size-5" />} eyebrow="Promotions" title="Current offers" description="Active offers and announcements published by this business." count={offers.length}>
          {offers.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{offers.map((offer) => <article key={offer.id} className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#1C2541]">{offer.image_url && <div className="relative aspect-[16/9] bg-[#0B132B]"><ImagePreview src={offer.image_url} alt={offer.title} fill imageClassName="object-cover" /></div>}<div className="p-5"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#D4AF37]/15 px-2.5 py-1 text-xs font-black uppercase text-[#F1D46B]">{offer.discount_text || "Featured"}</span>{offer.is_demo && <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-xs font-bold uppercase text-amber-200">Sample offer</span>}</div><h3 className="mt-3 text-lg font-black text-white">{offer.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{offer.description || "Contact the business for more information about this offer."}</p>{offer.end_date && <p className="mt-3 text-xs font-semibold text-slate-400">Offer ends {new Date(offer.end_date).toLocaleDateString("en-ZM", { dateStyle: "medium" })}</p>}</div></article>)}</div> : <EmptyContent message="There are no active offers for this business right now." />}
        </ContentSection>

        <ContentSection id="business-gallery" icon={<ImageIcon className="size-5" />} eyebrow="Photos" title="Business gallery" description="A closer look at this business, its work and its products." count={gallery.length}>
          {gallery.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{gallery.map((image) => <figure key={image.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1C2541]">{image.image_url && <div className="relative aspect-[4/3] bg-[#0B132B]"><ImagePreview src={image.image_url} alt={image.title || `${business.name} gallery photo`} fill imageClassName="object-cover" /></div>}{(image.title || image.caption) && <figcaption className="p-4">{image.title && <p className="font-bold text-white">{image.title}</p>}{image.caption && <p className="mt-1 text-sm leading-6 text-slate-300">{image.caption}</p>}</figcaption>}</figure>)}</div> : <EmptyContent message="This business has not published gallery photos yet." />}
        </ContentSection>

        <ContentSection id="business-updates" icon={<Newspaper className="size-5" />} eyebrow="News & announcements" title="Business updates" description="News, notices and updates shared by this business through AEOS." count={updates.length}>
          {updates.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{updates.map((update) => <article key={update.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#1C2541]">{update.image_url && <div className="relative aspect-[16/9] bg-[#0B132B]"><ImagePreview src={update.image_url} alt={update.title} fill imageClassName="object-cover" /></div>}<div className="p-5">{update.is_demo && <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-200">Sample update</span>}<h3 className="mt-2 text-lg font-black text-white">{update.title}</h3>{update.content && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-300">{update.content}</p>}{update.published_at && <p className="mt-4 text-xs font-semibold text-slate-400">{new Date(update.published_at).toLocaleDateString("en-ZM", { dateStyle: "medium" })}</p>}</div></article>)}</div> : <EmptyContent message="There are no business updates yet." />}
        </ContentSection>
      </div>

      <div className="mt-12 rounded-3xl border border-[#D4AF37]/25 bg-[#1C2541] p-6 text-white shadow-xl sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8"><div><p className="text-sm font-black uppercase tracking-widest text-[#F4D779]">Ready to get started?</p><h2 className="mt-2 text-xl font-black sm:text-2xl">{isSoftLoans ? "Start your loan application" : `Continue with ${business.name}`}</h2><p className="mt-2 text-base text-slate-300">{isSoftLoans ? "Choose an available loan product and submit your details securely for assessment." : "Sign in or create a customer account to submit a request and follow its progress."}</p></div><Link href={primaryActionHref} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#03162F] sm:mt-0">{isSoftLoans ? "Apply for a loan" : "Open customer portal"}<ArrowUpRight className="size-4" /></Link></div>
    </section>

    <footer className="border-t border-white/10 bg-[#0B132B] px-5 py-6 text-sm text-slate-400 sm:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><span>© {new Date().getFullYear()} {data.company.company_name}</span><div className="flex gap-4">{data.website.show_businesses && <Link href="/businesses" className="hover:text-white">Businesses</Link>}{data.website.show_contact_information && <Link href="/contact" className="hover:text-white">Contact</Link>}<Link href="/customer" className="hover:text-white">Customer portal</Link></div></div></footer>
  </main>;
}

function SectionLink({ href, label, count }: { href: string; label: string; count: number }) {
  return <a href={href} className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-[#F1D46B]"><span>{label}</span><span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{count}</span></a>;
}

function ContentSection({ id, icon, eyebrow, title, description, count, children }: { id: string; icon: React.ReactNode; eyebrow: string; title: string; description: string; count: number; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-32"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#F1D46B]">{icon}{eyebrow}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{description}</p></div><span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-slate-300">{count} {count === 1 ? "item" : "items"}</span></div>{children}</section>;
}

function CatalogCard({ item }: { item: PublicCatalogItem }) {
  const isLoan = item.item_type === "loan_product";
  return <article className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#1C2541] shadow-sm">{item.image_url ? <div className="relative aspect-[16/9] bg-[#0B132B]"><ImagePreview src={item.image_url} alt={item.name} fill imageClassName="object-cover" /></div> : <div className="grid aspect-[16/9] place-items-center bg-gradient-to-br from-[#0B132B] to-[#263856] text-[#F1D46B]">{isLoan ? <ShieldCheck className="size-9" /> : item.item_type.toLowerCase().includes("service") ? <Wrench className="size-9" /> : <PackageSearch className="size-9" />}</div>}<div className="p-5"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black uppercase tracking-widest text-[#F1D46B]">{item.category || (isLoan ? "Loan product" : item.item_type)}</span>{item.is_demo && <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-200">Sample</span>}</div><h3 className="mt-2 text-lg font-black text-white">{item.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-300">{item.description || "Contact the business for more information."}</p>{isLoan ? <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 text-sm"><Detail label="Amount" value={amountRange(item)} /><Detail label="Interest" value={item.interest_rate == null ? "Ask for details" : `${item.interest_rate}%`} /><Detail label="Repayment" value={item.repayment_period == null ? "Ask for details" : `${item.repayment_period} months`} /><Detail label="Collateral" value={item.requires_collateral ? "Required" : "Not required"} /></dl> : <p className="mt-4 text-base font-black text-white">{item.base_price == null ? "Request a quote" : `ZMW ${Number(item.base_price).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`}</p>}</div></article>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/[0.04] p-2.5"><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 font-bold text-slate-100">{value}</dd></div>;
}

function amountRange(item: PublicCatalogItem) {
  if (item.min_amount == null && item.max_amount == null) return "Ask for details";
  const min = item.min_amount == null ? null : `ZMW ${Number(item.min_amount).toLocaleString("en-ZM")}`;
  const max = item.max_amount == null ? null : `ZMW ${Number(item.max_amount).toLocaleString("en-ZM")}`;
  return min && max ? `${min}–${max}` : min || `Up to ${max}`;
}

function EmptyContent({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-white/15 bg-[#0B132B] px-5 py-8 text-center text-sm text-slate-400">{message}</div>;
}

function Feature({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#1C2541] p-4 shadow-sm"><span className="grid size-10 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#F1D46B]">{icon}</span><h3 className="mt-3 text-sm font-black text-white">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-300">{detail}</p></div>;
}
