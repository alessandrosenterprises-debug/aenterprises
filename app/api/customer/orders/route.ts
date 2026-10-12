import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface OrderItemInput {
  catalog_item_id?: string;
  catalogItemId?: string;
  quantity: number;
}

interface CreateOrderRequest {
  business_id?: string;
  businessId?: string;
  fulfillment_method?: "Pickup" | "Delivery";
  fulfillmentMethod?: "Pickup" | "Delivery";
  delivery_address?: string | null;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: OrderItemInput[];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in to place an order.",
        },
        { status: 401 }
      );
    }

    // ============================================================
    // FIND CUSTOMER
    // ============================================================

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, full_name, email, phone")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error("Customer lookup error:", customerError);

      return NextResponse.json(
        {
          error: "Unable to find your customer profile.",
        },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          error:
            "No customer profile is connected to your account. Please complete your customer profile first.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // READ REQUEST
    // ============================================================

    let body: CreateOrderRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const fulfillmentMethod = body.fulfillmentMethod ?? body.fulfillment_method ?? "Pickup";
    const deliveryAddress = body.deliveryAddress ?? body.delivery_address ?? null;
    const notes = body.notes ?? null;
    const items = body.items;

    // ============================================================
    // VALIDATE FULFILLMENT
    // ============================================================

    if (
      fulfillmentMethod !== "Pickup" &&
      fulfillmentMethod !== "Delivery"
    ) {
      return NextResponse.json(
        {
          error: "Invalid fulfillment method.",
        },
        { status: 400 }
      );
    }

    if (
      fulfillmentMethod === "Delivery" &&
      !deliveryAddress?.trim()
    ) {
      return NextResponse.json(
        {
          error: "A delivery address is required for delivery orders.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VALIDATE ITEMS
    // ============================================================

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        {
          error: "Your order must contain at least one item.",
        },
        { status: 400 }
      );
    }

    // Remove duplicate catalog items by combining quantities.
    const itemMap = new Map<string, number>();

    for (const item of items) {
      const catalogItemId = item?.catalogItemId ?? item?.catalog_item_id;
      if (!catalogItemId) {
        return NextResponse.json(
          {
            error: "Every order item must have a catalog item ID.",
          },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json(
          {
            error: "Each item must have a valid quantity.",
          },
          { status: 400 }
        );
      }

      const currentQuantity =
        itemMap.get(catalogItemId) ?? 0;

      itemMap.set(
        catalogItemId,
        currentQuantity + quantity
      );
    }

    const catalogItemIds = Array.from(itemMap.keys());

    // ============================================================
    // LOAD CATALOG ITEMS
    // ============================================================

    const { data: catalogItems, error: catalogError } =
      await supabase
        .from("enterprise_catalog")
        .select(
          `
            id,
            name,
            business_id,
            item_type,
            base_price,
            status
          `
        )
        .in("id", catalogItemIds);

    if (catalogError) {
      console.error("Catalog lookup error:", catalogError);

      return NextResponse.json(
        {
          error: "Unable to load the selected products.",
        },
        { status: 500 }
      );
    }

    if (!catalogItems || catalogItems.length !== catalogItemIds.length) {
      return NextResponse.json(
        {
          error:
            "One or more items in your cart could not be found.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // VERIFY ITEMS ARE ORDERABLE AND BELONG TO ONE ACTIVE BUSINESS
    // ============================================================

    const orderableTypes = new Set(["", "product", "goods", "item", "order", "retail"]);
    const unavailableItem = catalogItems.find((item) => {
      const type = (item.item_type ?? "").trim().toLowerCase();
      const status = (item.status ?? "").trim().toLowerCase();
      return !orderableTypes.has(type) || ["inactive", "disabled", "ended", "archived", "deleted"].includes(status);
    });

    if (unavailableItem) {
      return NextResponse.json({ error: "One or more items are no longer available to order." }, { status: 400 });
    }

    const businessIds = new Set(catalogItems.map((item) => item.business_id));
    if (businessIds.size !== 1) {
      return NextResponse.json({ error: "Please place a separate order for each business." }, { status: 400 });
    }
    const business_id = Array.from(businessIds)[0];
    const requestedBusinessId = body.businessId ?? body.business_id;
    if (requestedBusinessId && requestedBusinessId !== business_id) {
      return NextResponse.json({ error: "The selected business does not match the items in this order." }, { status: 400 });
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, active")
      .eq("id", business_id)
      .maybeSingle();

    if (businessError) {
      console.error("Business lookup error:", businessError);
      return NextResponse.json({ error: "Unable to verify the selected business." }, { status: 500 });
    }
    if (!business || !business.active) {
      return NextResponse.json({ error: "The selected business is unavailable." }, { status: 400 });
    }

    // ============================================================
    // BUILD ORDER ITEMS
    // ============================================================

    let subtotal = 0;

    const orderItems = catalogItems.map((catalogItem) => {
      const unitPrice = Number(catalogItem.base_price ?? 0);
      const quantity =
        itemMap.get(catalogItem.id) ?? 1;

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(
          `Invalid price for catalog item ${catalogItem.id}`
        );
      }

      const totalPrice = unitPrice * quantity;

      subtotal += totalPrice;

      return {
        catalog_item_id: catalogItem.id,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
      };
    });

    // ============================================================
    // ROUND TOTAL
    // ============================================================

    subtotal = Number(subtotal.toFixed(2));

    // ============================================================
    // CREATE ORDER
    // ============================================================

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        business_id,
        customer_id: customer.id,
        status: "Pending",
        payment_status: "Pending",
        fulfillment_method: fulfillmentMethod,
        delivery_address:
          fulfillmentMethod === "Delivery"
            ? deliveryAddress?.trim() || null
            : null,
        notes: notes?.trim() || null,
        subtotal,
        total_amount: subtotal,
      })
      .select(
        `
          id,
          business_id,
          customer_id,
          status,
          payment_status,
          fulfillment_method,
          delivery_address,
          notes,
          subtotal,
          total_amount,
          created_at,
          updated_at
        `
      )
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);

      return NextResponse.json(
        {
          error: "Unable to create your order.",
          details: orderError?.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // CREATE ORDER ITEMS
    // ============================================================

    const orderItemsWithOrderId = orderItems.map((item) => ({
      order_id: order.id,
      catalog_item_id: item.catalog_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { data: insertedItems, error: itemsError } =
      await supabase
        .from("order_items")
        .insert(orderItemsWithOrderId)
        .select(
          `
            id,
            order_id,
            catalog_item_id,
            quantity,
            unit_price,
            total_price,
            created_at
          `
        );

    // ============================================================
    // ROLLBACK ORDER IF ITEMS FAILED
    // ============================================================

    if (itemsError) {
      console.error(
        "Order items creation error:",
        itemsError
      );

      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      return NextResponse.json(
        {
          error:
            "The order could not be completed because the order items could not be saved.",
          details: itemsError.message,
        },
        { status: 500 }
      );
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,

        message: "Order created successfully.",

        order: {
          ...order,
          business: {
            id: business.id,
            name: business.name,
          },
          items: insertedItems ?? [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer order API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating the order.",
      },
      { status: 500 }
    );
  }
}
