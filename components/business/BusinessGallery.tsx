"use client";

import { motion } from "framer-motion";
import { Images } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  is_featured: boolean;
}

interface BusinessGalleryProps {
  images: GalleryImage[];
}

export default function BusinessGallery({
  images,
}: BusinessGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const featuredImage =
    images.find((image) => image.is_featured) ?? images[0];

  const otherImages = images.filter(
    (image) => image.id !== featuredImage.id
  );

  return (
    <section className="px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
            Our Gallery
          </p>

          <h2 className="mt-1.5 text-2xl font-bold text-[#03162F] sm:text-3xl">
            See Our Business
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Take a look at what we do and what we offer.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Featured image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="group relative overflow-hidden rounded-2xl bg-slate-100 sm:col-span-2 sm:row-span-2"
          >
            <div className="aspect-[4/3] sm:h-full sm:min-h-[360px]">
              <img
                src={featuredImage.image_url}
                alt={
                  featuredImage.title ||
                  "Business gallery image"
                }
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 pt-16">
              {featuredImage.title && (
                <h3 className="text-lg font-bold text-white">
                  {featuredImage.title}
                </h3>
              )}

              {featuredImage.caption && (
                <p className="mt-1 text-sm text-white/80">
                  {featuredImage.caption}
                </p>
              )}
            </div>
          </motion.div>

          {/* Remaining images */}
          {otherImages.slice(0, 4).map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: (index + 1) * 0.06,
              }}
              className="group relative overflow-hidden rounded-2xl bg-slate-100"
            >
              <div className="aspect-[4/3]">
                <img
                  src={image.image_url}
                  alt={
                    image.title ||
                    "Business gallery image"
                  }
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              {(image.title || image.caption) && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-8">
                  {image.title && (
                    <p className="truncate text-sm font-semibold text-white">
                      {image.title}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {images.length > 5 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
            <Images className="h-4 w-4" />

            <span>
              +{images.length - 5} more photos
            </span>
          </div>
        )}
      </div>
    </section>
  );
}