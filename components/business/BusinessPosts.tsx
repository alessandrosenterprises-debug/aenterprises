"use client";

import { motion } from "framer-motion";
import { CalendarDays, Megaphone } from "lucide-react";

interface BusinessPost {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  post_type: string;
  featured: boolean;
  published_at: string | null;
}

interface BusinessPostsProps {
  posts: BusinessPost[];
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

export default function BusinessPosts({
  posts,
}: BusinessPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
            Latest Updates
          </p>

          <h2 className="mt-1.5 text-2xl font-bold text-[#03162F] sm:text-3xl">
            News & Updates
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Stay up to date with what's happening.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => {
            const publishedDate = formatDate(post.published_at);

            return (
              <motion.article
                key={post.id}
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
                {post.image_url ? (
                  <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    {post.featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#03162F] shadow">
                        Featured
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/9] items-center justify-center bg-[#03162F]">
                    <Megaphone className="h-10 w-10 text-[#D4AF37]" />

                    {post.featured && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-[#03162F] shadow">
                        Featured
                      </span>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-600">
                      {post.post_type || "Update"}
                    </span>

                    {publishedDate && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {publishedDate}
                      </span>
                    )}
                  </div>

                  <h3 className="mt-3 text-lg font-bold leading-tight text-[#03162F]">
                    {post.title}
                  </h3>

                  {post.content && (
                    <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-500">
                      {post.content}
                    </p>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#03162F]">
                    Read Update

                    <span className="text-[#D4AF37] transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}