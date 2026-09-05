"use client";

import CustomerNavigation from "@/components/customer/CustomerNavigation";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  item_type: string | null;
  base_price: number | null;
  business_id: string;
  is_active?: boolean | null;
  image_url?: string | null;
  businesses?: {
    id: string;
    name: string;
  } | null;
}

interface CartItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  business_id: string;
  business_name: string;
}

function formatMoney(amount: number) {
  return `ZMW ${Number(amount || 0).toFixed(2)}`;
}

export default function OrderCreationInterface({
  items,
  customerId,
}: {
  items: CatalogItem[];
  customerId: string;
}) {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillment] =
    useState<"Pickup" | "Delivery">("Pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.businesses?.name?.toLowerCase().includes(query)
      );
    });
  }, [items, search]);

  const subtotal = useMemo(() => {
    return cart.reduce(
      (total: number, item: CartItem) =>
        total + item.price * item.quantity,
      0
    );
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total: number, item: CartItem) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  function addToCart(item: CatalogItem) {
    const existing = cart.find(
      (cartItem: CartItem) => cartItem.id === item.id
    );

    if (existing) {
      setCart((current: CartItem[]) =>
        current.map((cartItem: CartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem
        )
      );

      return;
    }

    setCart((current: CartItem[]) => [
      ...current,
      {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.base_price || 0),
        quantity: 1,
        business_id: item.business_id,
        business_name:
          item.businesses?.name ||
          "Alessandro Enterprises",
      },
    ]);
  }

  function decreaseQuantity(id: string) {
    setCart((current: CartItem[]) =>
      current
        .map((item: CartItem) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter(
          (item: CartItem) => item.quantity > 0
        )
    );
  }

  function increaseQuantity(id: string) {
    setCart((current: CartItem[]) =>
      current.map((item: CartItem) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    );
  }

  function removeItem(id: string) {
    setCart((current: CartItem[]) =>
      current.filter(
        (item: CartItem) => item.id !== id
      )
    );
  }

  async function createOrder() {
    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage(
        "Please add at least one item to your order."
      );
      return;
    }

    if (
      fulfillment === "Delivery" &&
      !deliveryAddress.trim()
    ) {
      setErrorMessage(
        "Please enter your delivery address."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/customer/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId,
            fulfillmentMethod: fulfillment,
            deliveryAddress:
              fulfillment === "Delivery"
                ? deliveryAddress.trim()
                : null,
            notes: notes.trim() || null,
            subtotal,
            totalAmount: subtotal,
            items: cart.map(
              (item: CartItem) => ({
                catalogItemId: item.id,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice:
                  item.price * item.quantity,
              })
            ),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to create your order."
        );
      }

      window.location.href =
        `/customer/orders/${result.orderId}`;
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your order."
      );

      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#06142f] text-white">
      <CustomerNavigation />

      <main className="mx-auto max-w-7xl px-4 py-6 pb-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/customer/orders"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Orders
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                <ShoppingCart size={14} />
                New Order
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Create Your Order
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Browse available products from
                Alessandro Enterprises businesses,
                add what you need to your cart, and
                place your order.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <ShoppingCart
                size={18}
                className="text-blue-300"
              />

              <div>
                <p className="text-xs text-white/50">
                  Cart
                </p>
                <p className="font-semibold">
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products, services, or businesses..."
              className="w-full rounded-xl border border-white/10 bg-[#081a3b] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-500/60"
            />
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Products */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Available Items
                </h2>

                <p className="mt-1 text-sm text-white/50">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? "item"
                    : "items"}{" "}
                  available
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/50 sm:flex">
                <Package size={15} />
                Products
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
                  <Package
                    size={25}
                    className="text-white/40"
                  />
                </div>

                <h3 className="font-semibold">
                  No items found
                </h3>

                <p className="mt-2 text-sm text-white/50">
                  Try a different search term.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredItems.map(
                  (item: CatalogItem) => {
                    const cartItem = cart.find(
                      (current: CartItem) =>
                        current.id === item.id
                    );

                    return (
                      <div
                        key={item.id}
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg transition hover:-translate-y-0.5 hover:border-blue-400/20 hover:bg-white/[0.07]"
                      >
                        {/* Image */}
                        <div className="relative h-44 overflow-hidden bg-[#081a3b]">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package
                                size={42}
                                className="text-white/20"
                              />
                            </div>
                          )}

                          {item.businesses?.name && (
                            <div className="absolute left-3 top-3 inline-flex max-w-[85%] items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-xs font-medium backdrop-blur-md">
                              <Store size={12} />
                              <span className="truncate">
                                {item.businesses.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="line-clamp-1 font-semibold">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-white/50">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-white/40">
                                Price
                              </p>

                              <p className="font-bold text-blue-300">
                                {formatMoney(
                                  Number(
                                    item.base_price || 0
                                  )
                                )}
                              </p>
                            </div>

                            {cartItem ? (
                              <div className="flex items-center gap-1 rounded-xl border border-blue-400/20 bg-blue-500/10 p-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decreaseQuantity(
                                      item.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                                  aria-label={`Decrease ${item.name}`}
                                >
                                  <Minus size={15} />
                                </button>

                                <span className="min-w-7 text-center text-sm font-semibold">
                                  {cartItem.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    increaseQuantity(
                                      item.id
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
                                  aria-label={`Increase ${item.name}`}
                                >
                                  <Plus size={15} />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  addToCart(item)
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
                              >
                                <Plus size={16} />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* Cart */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl">
              {/* Cart header */}
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">
                      Your Cart
                    </h2>

                    <p className="mt-1 text-sm text-white/50">
                      {cartCount}{" "}
                      {cartCount === 1
                        ? "item"
                        : "items"}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10">
                    <ShoppingCart
                      size={21}
                      className="text-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* Cart items */}
              <div className="max-h-[420px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="p-8 text-center">
                    <ShoppingCart
                      size={35}
                      className="mx-auto text-white/20"
                    />

                    <p className="mt-4 font-medium text-white/70">
                      Your cart is empty
                    </p>

                    <p className="mt-2 text-sm text-white/40">
                      Add items from the list to
                      start your order.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {cart.map(
                      (cartItem: CartItem) => (
                        <div
                          key={cartItem.id}
                          className="p-4"
                        >
                          <div className="flex gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                              <Package
                                size={18}
                                className="text-blue-300"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h3 className="truncate text-sm font-semibold">
                                    {cartItem.name}
                                  </h3>

                                  <p className="mt-1 truncate text-xs text-white/40">
                                    {
                                      cartItem.business_name
                                    }
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeItem(
                                      cartItem.id
                                    )
                                  }
                                  className="shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                                  aria-label={`Remove ${cartItem.name}`}
                                >
                                  <Trash2
                                    size={15}
                                  />
                                </button>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      decreaseQuantity(
                                        cartItem.id
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white"
                                  >
                                    <Minus size={13} />
                                  </button>

                                  <span className="min-w-6 text-center text-xs font-semibold">
                                    {
                                      cartItem.quantity
                                    }
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      increaseQuantity(
                                        cartItem.id
                                      )
                                    }
                                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition hover:bg-white/10 hover:text-white"
                                  >
                                    <Plus size={13} />
                                  </button>
                                </div>

                                <p className="text-sm font-bold text-blue-300">
                                  {formatMoney(
                                    cartItem.price *
                                      cartItem.quantity
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Order details */}
              {cart.length > 0 && (
                <div className="border-t border-white/10">
                  <div className="p-5">
                    <h3 className="mb-3 text-sm font-semibold">
                      Fulfillment
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFulfillment("Pickup")
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          fulfillment === "Pickup"
                            ? "border-blue-400/40 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <Store
                          size={18}
                          className={
                            fulfillment ===
                            "Pickup"
                              ? "text-blue-300"
                              : "text-white/40"
                          }
                        />

                        <p className="mt-2 text-sm font-semibold">
                          Pickup
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Collect your order
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFulfillment("Delivery")
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          fulfillment === "Delivery"
                            ? "border-blue-400/40 bg-blue-500/10"
                            : "border-white/10 bg-white/5 hover:bg-white/[0.07]"
                        }`}
                      >
                        <Truck
                          size={18}
                          className={
                            fulfillment ===
                            "Delivery"
                              ? "text-blue-300"
                              : "text-white/40"
                          }
                        />

                        <p className="mt-2 text-sm font-semibold">
                          Delivery
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Deliver to you
                        </p>
                      </button>
                    </div>

                    {fulfillment ===
                      "Delivery" && (
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium">
                          Delivery Address
                        </label>

                        <textarea
                          value={deliveryAddress}
                          onChange={(event) =>
                            setDeliveryAddress(
                              event.target.value
                            )
                          }
                          rows={3}
                          placeholder="Enter your delivery address..."
                          className="w-full resize-none rounded-xl border border-white/10 bg-[#081a3b] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-500/60"
                        />
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium">
                        Order Notes{" "}
                        <span className="font-normal text-white/40">
                          (optional)
                        </span>
                      </label>

                      <textarea
                        value={notes}
                        onChange={(event) =>
                          setNotes(event.target.value)
                        }
                        rows={3}
                        placeholder="Any special instructions for your order..."
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#081a3b] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-blue-500/60"
                      />
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t border-white/10 p-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between text-white/60">
                        <span>Subtotal</span>
                        <span>
                          {formatMoney(subtotal)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-white/60">
                        <span>
                          Delivery
                        </span>
                        <span>
                          {fulfillment ===
                          "Delivery"
                            ? "Calculated separately"
                            : "Free"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="font-semibold">
                          Total
                        </span>

                        <span className="text-lg font-bold text-blue-300">
                          {formatMoney(subtotal)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={createOrder}
                      disabled={submitting}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            size={18}
                          />
                          Place Order
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-white/35">
                      You can review your order
                      details after it has been
                      created.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}