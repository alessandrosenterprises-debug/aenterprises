"use client";

import { motion } from "framer-motion";
import { CalendarDays, Tag } from "lucide-react";

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_text: string | null;
  price: number | string | null;
  start_date: string | null;
  end_date: string | null;
  featured: boolean;
}

interface BusinessPromotionsProps {
  promotions: Promotion[];
}

function formatZMW(value: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-ZM", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function BusinessPromotions({
  promotions,
}: BusinessPromotionsProps) {
  if (!promotions || promotions.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              Special Offers
            </p>

            <h2 className="mt-1.5 text-2xl font-bold text-[#03162F] sm:text-3xl">
              Promotions
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Take advantage of the latest offers.
            </p>
          </div>

          {promotions.length > 1 && (
            <span className="hidden text-xs font-medium text-slate-400 sm:block">
              {promotions.length} offers
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promotion, index) => {
            const price = formatZMW(promotion.price);
            const startDate = formatDate(promotion.start_date);
            const endDate = formatDate(promotion.end_date);

            return (
              <motion.article
                key={promotion.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.06,
                }}
                whileHover={{ y: -4 }}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-[#03162F]">
                  {promotion.image_url ? (
                    <img
                      src={promotion.image_url}
                      alt={promotion.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Tag className="h-10 w-10 text-[#D4AF37]" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                  {promotion.discount_text && (
                    <div className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#03162F] shadow-lg">
                      {promotion.discount_text}
                    </div>
                  )}

                  {promotion.featured && (
                    <div className="absolute right-3 top-3 rounded-full bg-[#03162F]/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                      Featured
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold leading-tight text-[#03162F]">
                    {promotion.title}
                  </h3>

                  {promotion.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">
                      {promotion.description}
                    </p>
                  )}

                  {price && (
                    <div className="mt-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Offer Price
                      </p>

                      <p className="mt-0.5 text-xl font-bold text-[#03162F]">
                        {price}
                      </p>
                    </div>
                  )}

                  {(startDate || endDate) && (
                    <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" />

                      <p className="text-xs leading-relaxed text-slate-500">
                        {startDate && endDate
                          ? `Valid ${startDate} – ${endDate}`
                          : startDate
                            ? `From ${startDate}`
                            : `Until ${endDate}`}
                      </p>
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}