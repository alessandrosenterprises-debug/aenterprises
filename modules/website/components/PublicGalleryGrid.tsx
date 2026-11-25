import Link from "next/link";
import ImagePreview from "@/components/ui/image-preview/ImagePreview";
import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import type { PublicBusiness, PublicGalleryImage } from "@/modules/website/services/public-website.service";

export default function PublicGalleryGrid({ images, businesses }: { images: PublicGalleryImage[]; businesses: PublicBusiness[] }) {
  const galleryImages = images.filter((image) => image.image_url);
  const businessById = new Map(businesses.map((business) => [business.id, business]));
  if (!galleryImages.length) return null;

  return <section className="public-gallery-section" aria-labelledby="public-gallery-title">
    <div className="container">
      <div className="public-gallery-heading"><div><span className="section-tag">A CLOSER LOOK</span><h2 id="public-gallery-title">From our <span>gallery.</span></h2><p>Recent photos and work shared by our businesses.</p></div><span className="public-gallery-count"><ImageIcon aria-hidden="true" />{galleryImages.length} {galleryImages.length === 1 ? "photo" : "photos"}</span></div>
      <div className="public-gallery-grid">
        {galleryImages.map((image) => {
          const business = businessById.get(image.business_id);
          return <article className="public-gallery-card" key={image.id}>
            <div className="public-gallery-image"><ImagePreview src={image.image_url} alt={image.title || `${business?.name ?? "Alessandro Enterprises"} gallery photo`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" imageClassName="object-cover transition duration-500 hover:scale-[1.04]" /></div>
            {(image.title || image.caption || business) && <div className="public-gallery-caption">{business && <span className="section-tag">{business.name}</span>}{image.title && <h3>{image.title}</h3>}{image.caption && <p>{image.caption}</p>}</div>}
          </article>;
        })}
      </div>
      <div className="public-gallery-footer"><span>{galleryImages.length} published {galleryImages.length === 1 ? "photo" : "photos"}</span><Link href="/customer/gallery">Explore the gallery <ArrowUpRight aria-hidden="true" /></Link></div>
    </div>
  </section>;
}
