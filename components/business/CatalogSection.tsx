"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
} from "lucide-react";

interface CatalogItem {
  id: string;
  business_id?: string | null;
  item_type: string | null;
  category: string | null;
  name: string;
  description: string | null;
  base_price: number | string | null;
  quantity: number | null;
  status: string | null;
  image_url: string | null;
  attributes: Record<string, unknown> | null;
}

interface CatalogSectionProps {
  businessId: string;
  businessName?: string;
  catalogItems: CatalogItem[];
}

function formatZMW(value: number | string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getItemType(item: CatalogItem) {
  return item.item_type?.trim().toLowerCase() || "item";
}

/*
 * Only products can enter the order flow.
 *
 * Services and offers remain visible in the catalog,
 * but they do not use the product ordering workflow.
 */
function isSelectable(item: CatalogItem) {
  return getItemType(item) === "product";
}

export default function CatalogSection({
  businessId,
  businessName = "this business",
  catalogItems,
}: CatalogSectionProps) {
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("all");
  const [cart, setCart] = useState<CatalogItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filters = [
    { label: "All", value: "all" },
    { label: "Products", value: "product" },
    { label: "Services", value: "service" },
    { label: "Offers", value: "offer" },
  ];

  const filteredItems =
    activeFilter === "all"
      ? catalogItems
      : catalogItems.filter(
          (item) =>
            getItemType(item) === activeFilter
        );

  function isInCart(itemId: string) {
    return cart.some(
      (item) => item.id === itemId
    );
  }

  function addToCart(item: CatalogItem) {
    if (!isSelectable(item)) {
      return;
    }

    if (!isInCart(item.id)) {
      setCart((current) => [
        ...current,
        item,
      ]);
    }
  }

  function removeFromCart(itemId: string) {
    setCart((current) =>
      current.filter(
        (item) => item.id !== itemId
      )
    );
  }

  function getCartTotal() {
    return cart.reduce((total, item) => {
      const price = Number(
        item.base_price ?? 0
      );

      return (
        total +
        (Number.isFinite(price)
          ? price
          : 0)
      );
    }, 0);
  }

  /*
   * CONNECT TO THE EXISTING NEW ORDER PAGE
   *
   * The existing page expects:
   *
   * /customer/orders/new
   *   ?business_id=BUSINESS_ID
   *   &items=JSON_ENCODED_ITEMS
   *
   * We are intentionally NOT creating another order page.
   */
  function continueToOrder() {
    if (!businessId) {
      console.error(
        "Cannot continue order: businessId is missing."
      );

      return;
    }

    if (cart.length === 0) {
      return;
    }

    const orderItems = cart.map(
      (item) => ({
        catalog_item_id: item.id,
        quantity: 1,
      })
    );

    const params = new URLSearchParams();

    params.set(
      "business_id",
      businessId
    );

    params.set(
      "items",
      JSON.stringify(orderItems)
    );

    setShowCart(false);

    router.push(
      `/customer/orders/new?${params.toString()}`
    );
  }

  return (
    <>
      <section className="px-5 py-10">
        <div className="mx-auto max-w-7xl">

          {/* Heading */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Our Catalog
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#03162F] sm:text-3xl">
              Explore {businessName}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Browse everything available from this
              business. Select the products you want
              and continue when you are ready.
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-3">
            {filters.map((filter) => {
              const isActive =
                activeFilter ===
                filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#03162F] text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-[#D4AF37] hover:text-[#03162F]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Catalog */}
          {filteredItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const price =
                  formatZMW(
                    item.base_price
                  );

                const selected =
                  isInCart(item.id);

                const selectable =
                  isSelectable(item);

                const type =
                  getItemType(item);

                return (
                  <article
                    key={item.id}
                    className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                      selected
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          {type ===
                          "service"
                            ? "🛠️"
                            : type ===
                              "offer"
                            ? "🎁"
                            : "📦"}
                        </div>
                      )}

                      {item.item_type && (
                        <span className="absolute right-4 top-4 rounded-full bg-[#03162F] px-3 py-1 text-xs font-semibold capitalize text-white shadow">
                          {item.item_type}
                        </span>
                      )}

                      {selected && (
                        <div className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#D4AF37] text-[#03162F] shadow-lg">
                          <Check className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">

                      {item.category && (
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                          {item.category}
                        </p>
                      )}

                      <h3 className="text-xl font-bold text-[#03162F]">
                        {item.name}
                      </h3>

                      {item.description && (
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      )}

                      {/* Attributes */}
                      {item.attributes &&
                        Object.keys(
                          item.attributes
                        ).length > 0 && (
                          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                            {Object.entries(
                              item.attributes
                            ).map(
                              ([
                                key,
                                value,
                              ]) => (
                                <div
                                  key={key}
                                  className="flex items-center justify-between gap-4 text-sm"
                                >
                                  <span className="capitalize text-slate-500">
                                    {key.replace(
                                      /_/g,
                                      " "
                                    )}
                                  </span>

                                  <span className="text-right font-semibold text-[#03162F]">
                                    {String(
                                      value
                                    )}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        )}

                      {/* Price / Availability */}
                      <div className="mt-6 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
                        <div>
                          {price && (
                            <>
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                Price
                              </p>

                              <p className="mt-1 text-2xl font-bold text-[#03162F]">
                                {price}
                              </p>
                            </>
                          )}
                        </div>

                        {item.quantity !==
                          null &&
                          item.quantity !==
                            undefined && (
                            <div className="text-right">
                              <p className="text-xs text-slate-500">
                                Availability
                              </p>

                              <p className="mt-1 text-sm font-semibold text-[#03162F]">
                                {item.quantity}{" "}
                                available
                              </p>
                            </div>
                          )}
                      </div>

                      {/* Product selection */}
                      {selectable && (
                        <button
                          type="button"
                          onClick={() =>
                            selected
                              ? removeFromCart(
                                  item.id
                                )
                              : addToCart(
                                  item
                                )
                          }
                          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition active:scale-[0.98] ${
                            selected
                              ? "border border-[#03162F] bg-white text-[#03162F] hover:bg-slate-50"
                              : "bg-[#D4AF37] text-[#03162F] shadow-sm hover:-translate-y-0.5 hover:bg-[#e3c45a]"
                          }`}
                        >
                          {selected ? (
                            <>
                              <Check className="h-4 w-4" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add to Selection
                            </>
                          )}
                        </button>
                      )}

                      {/* Services/offers are not orderable */}
                      {!selectable &&
                        type !== "item" && (
                          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-center">
                            <p className="text-xs font-medium text-slate-500">
                              {type ===
                              "service"
                                ? "Service"
                                : "Offer"}
                            </p>
                          </div>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div
                className="text-5xl"
                aria-hidden="true"
              >
                📦
              </div>

              <h3 className="mt-5 text-xl font-bold text-[#03162F]">
                No{" "}
                {activeFilter ===
                "all"
                  ? "catalog items"
                  : `${activeFilter}s`}{" "}
                available
              </h3>

              <p className="mt-2 text-slate-500">
                New items from{" "}
                {businessName} will appear
                here when they are added.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Floating Selection Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-[9000] px-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 rounded-2xl bg-[#03162F] px-4 py-3 text-white shadow-2xl ring-1 ring-white/10">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-[#03162F]">
                <ShoppingCart className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300">
                  Your Selection
                </p>

                <p className="text-sm font-bold">
                  {cart.length}{" "}
                  {cart.length === 1
                    ? "item"
                    : "items"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowCart(true)
              }
              className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-bold text-[#03162F] transition hover:bg-[#e3c45a]"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {showCart && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-[#03162F]/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  Your Selection
                </p>

                <h2 className="mt-1 text-xl font-black text-[#03162F]">
                  {businessName}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCart(false)
                }
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="max-h-[50vh] overflow-y-auto p-6">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                        📦
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[#03162F]">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {getItemType(
                          item
                        )}
                      </p>

                      {formatZMW(
                        item.base_price
                      ) && (
                        <p className="mt-1 text-sm font-bold text-[#03162F]">
                          {formatZMW(
                            item.base_price
                          )}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Footer */}
            <div className="border-t border-slate-100 bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">
                  Estimated Total
                </span>

                <span className="text-xl font-black text-[#03162F]">
                  {formatZMW(
                    getCartTotal()
                  )}
                </span>
              </div>

              {/* CONNECT TO EXISTING ORDER PAGE */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={
                    continueToOrder
                  }
                  disabled={
                    !businessId ||
                    cart.length === 0
                  }
                  className="w-full rounded-xl bg-[#03162F] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0A2852] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to Order
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                You will review your
                products and choose
                pickup or delivery on
                the next page.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}