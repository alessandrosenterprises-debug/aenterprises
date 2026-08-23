"use client";

import { motion } from "framer-motion";

interface PageLoadingSkeletonProps {
  rows?: number;
  cards?: number;
}

function Shimmer({
  className = "",
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-slate-200 ${className}`}
      animate={{
        opacity: [0.65, 0.9, 0.65],
      }}
      transition={{
        duration: 1.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    >
      <motion.div
        className="
          absolute
          inset-y-0
          -left-1/2
          w-1/2
          bg-gradient-to-r
          from-transparent
          via-white/60
          to-transparent
        "
        animate={{
          x: ["0%", "300%"],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
      />
    </motion.div>
  );
}

export default function PageLoadingSkeleton({
  rows = 6,
  cards = 4,
}: PageLoadingSkeletonProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="space-y-6"
      aria-label="Loading page"
    >
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <Shimmer
            className="h-8 w-64"
            delay={0}
          />

          <Shimmer
            className="h-4 w-full max-w-2xl"
            delay={0.08}
          />

          <Shimmer
            className="h-4 w-2/3 max-w-xl"
            delay={0.16}
          />
        </div>

        <Shimmer
          className="hidden h-11 w-32 sm:block"
          delay={0.12}
        />
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map(
          (_, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 12,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.3,
                delay: 0.08 + index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
              "
            >
              <div className="space-y-4">
                <Shimmer
                  className="h-10 w-10 rounded-xl"
                  delay={index * 0.08}
                />

                <div className="space-y-2">
                  <Shimmer
                    className="h-3 w-24"
                    delay={index * 0.08}
                  />

                  <Shimmer
                    className="h-7 w-20"
                    delay={index * 0.08 + 0.08}
                  />
                </div>
              </div>

              {/* Premium accent */}
              <div
                className="
                  absolute
                  left-0
                  right-0
                  top-0
                  h-1
                  bg-[#D4AF37]/40
                "
              />
            </motion.div>
          )
        )}
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 14,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.35,
          delay: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        {/* Content header */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-200
            p-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div className="space-y-2">
            <Shimmer
              className="h-5 w-48"
              delay={0.2}
            />

            <Shimmer
              className="h-3 w-72 max-w-full"
              delay={0.28}
            />
          </div>

          <div className="flex gap-2">
            <Shimmer
              className="h-10 w-24"
              delay={0.25}
            />

            <Shimmer
              className="h-10 w-28"
              delay={0.32}
            />
          </div>
        </div>

        {/* Table/list */}

        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map(
            (_, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: -10,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.25,
                  delay:
                    0.34 +
                    index * 0.055,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="
                  flex
                  items-center
                  gap-4
                  p-5
                "
              >
                {/* Avatar/icon */}

                <Shimmer
                  className="h-11 w-11 shrink-0 rounded-xl"
                  delay={index * 0.07}
                />

                {/* Primary content */}

                <div className="min-w-0 flex-1 space-y-2">
                  <Shimmer
                    className="h-4 w-2/5"
                    delay={index * 0.07}
                  />

                  <Shimmer
                    className="h-3 w-3/5"
                    delay={
                      index * 0.07 + 0.08
                    }
                  />
                </div>

                {/* Secondary content */}

                <div className="hidden gap-3 sm:flex">
                  <Shimmer
                    className="h-8 w-20"
                    delay={index * 0.07}
                  />

                  <Shimmer
                    className="h-8 w-24"
                    delay={
                      index * 0.07 + 0.08
                    }
                  />
                </div>
              </motion.div>
            )
          )}
        </div>
      </motion.div>

      {/* =====================================================
          BOTTOM LOADING INDICATOR
      ===================================================== */}

      <div className="flex items-center justify-center gap-3 py-2">
        <motion.div
          className="
            h-2
            w-2
            rounded-full
            bg-[#B8860B]
          "
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0,
          }}
        />

        <motion.div
          className="
            h-2
            w-2
            rounded-full
            bg-[#B8860B]
          "
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.15,
          }}
        />

        <motion.div
          className="
            h-2
            w-2
            rounded-full
            bg-[#B8860B]
          "
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: 0.3,
          }}
        />

        <span
          className="
            ml-1
            text-[10px]
            font-black
            uppercase
            tracking-[0.16em]
            text-slate-400
          "
        >
          Loading
        </span>
      </div>
    </motion.div>
  );
}