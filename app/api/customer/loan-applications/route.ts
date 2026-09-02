import { NextResponse } from "next/server";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

const BUCKET = "loan-identity-documents";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function getExtension(type: string) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

function validateImage(
  file: FormDataEntryValue | null,
  label: string,
) {
  if (!(file instanceof File)) {
    throw new Error(`${label} is required.`);
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error(
      `${label} must be a JPEG, PNG, or WebP image.`,
    );
  }

  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error(`${label} must be 5MB or smaller.`);
  }

  return file;
}

/**
 * GET
 *
 * Returns the authenticated customer's loan applications.
 *
 * IMPORTANT:
 * The customer is resolved from the authenticated
 * Supabase session. A customer can therefore only
 * receive their own applications.
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in to view your loans.",
        },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    /**
     * Resolve the authenticated user to the
     * corresponding customer record.
     */
    const {
      data: customer,
      error: customerError,
    } = await admin
      .from("customers")
      .select(`
        id,
        auth_user_id,
        is_active
      `)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customerError) {
      console.error(
        "Customer loan profile lookup error:",
        customerError,
      );

      return NextResponse.json(
        {
          error: "Unable to verify your customer profile.",
        },
        { status: 500 },
      );
    }

    if (!customer) {
      return NextResponse.json(
        {
          error: "Your customer profile could not be found.",
        },
        { status: 404 },
      );
    }

    if (customer.is_active === false) {
      return NextResponse.json(
        {
          error: "Your customer account is currently inactive.",
        },
        { status: 403 },
      );
    }

    /**
     * Fetch this customer's loan applications.
     */
    const {
      data: applications,
      error: applicationsError,
    } = await admin
      .from("customer_loan_applications")
      .select(`
        id,
        customer_id,
        loan_product_id,
        application_number,
        application_source,
        application_date,
        loan_type,
        requested_amount,
        approved_amount,
        interest_rate,
        repayment_period,
        monthly_installment,
        total_payable,
        amount_paid,
        outstanding_balance,
        loan_purpose,
        collateral_required,
        collateral_description,
        collateral_id,
        collateral_worth,
        account_operator_id,
        due_date,
        residential_address,
        next_of_kin_name,
        next_of_kin_relationship,
        next_of_kin_phone,
        nrc_front_path,
        nrc_back_path,
        selfie_path,
        status,
        approved_by,
        approved_at,
        rejection_reason,
        notes,
        created_at,
        updated_at,
        loan_products (
          id,
          name,
          description,
          min_amount,
          max_amount,
          interest_rate,
          repayment_period,
          requires_collateral,
          status
        )
      `)
      .eq("customer_id", customer.id)
      .order("created_at", {
        ascending: false,
      });

    if (applicationsError) {
      console.error(
        "Customer loan applications lookup error:",
        applicationsError,
      );

      return NextResponse.json(
        {
          error: "Unable to load your loan applications.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      customer_id: customer.id,
      applications: applications ?? [],
    });
  } catch (error) {
    console.error(
      "Customer loan applications GET error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your loan applications.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST
 *
 * Creates a new customer loan application.
 */
export async function POST(request: Request) {
  try {
    /*
     * Authenticate using the customer's actual browser session.
     *
     * IMPORTANT:
     * Do NOT use createAdminClient() for authentication.
     * The normal server client reads the Supabase auth cookies
     * created by the customer login.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "You must be signed in to submit a loan application.",
        },
        { status: 401 },
      );
    }

    /*
     * The admin client is used only after authentication
     * for database and private storage operations.
     */
    const admin = createAdminClient();

    const formData = await request.formData();

    const productId = String(
      formData.get("product_id") ?? "",
    );

    const termId = String(
      formData.get("term_id") ?? "",
    );

    const applicationDate = String(
      formData.get("application_date") ?? "",
    );

    const requestedAmount = Number(
      formData.get("requested_amount") ?? 0,
    );

    const residentialAddress = String(
      formData.get("residential_address") ?? "",
    ).trim();

    const nextOfKinName = String(
      formData.get("next_of_kin_name") ?? "",
    ).trim();

    const nextOfKinRelationship = String(
      formData.get("next_of_kin_relationship") ?? "",
    ).trim();

    const nextOfKinPhone = String(
      formData.get("next_of_kin_phone") ?? "",
    ).trim();

    const notes = String(
      formData.get("notes") ?? "",
    ).trim();

    const collateralIdRaw = String(
      formData.get("collateral_id") ?? "",
    );

    const collateralWorthRaw = String(
      formData.get("collateral_worth") ?? "",
    );

    const nrcFront = validateImage(
      formData.get("nrc_front"),
      "NRC Front",
    );

    const nrcBack = validateImage(
      formData.get("nrc_back"),
      "NRC Back",
    );

    const selfie = validateImage(
      formData.get("selfie"),
      "Selfie",
    );

    /*
     * Basic validation.
     */

    if (!productId) {
      throw new Error("Please select a loan service.");
    }

    if (!termId) {
      throw new Error("Please select a repayment term.");
    }

    if (!applicationDate) {
      throw new Error(
        "Please select the application date.",
      );
    }

    if (
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0
    ) {
      throw new Error(
        "Please enter a valid loan amount.",
      );
    }

    if (residentialAddress.length < 5) {
      throw new Error(
        "Please enter your residential address.",
      );
    }

    if (nextOfKinName.length < 2) {
      throw new Error(
        "Please enter your next of kin's name.",
      );
    }

    if (nextOfKinRelationship.length < 2) {
      throw new Error(
        "Please enter your relationship with your next of kin.",
      );
    }

    if (nextOfKinPhone.length < 7) {
      throw new Error(
        "Please enter a valid next of kin phone number.",
      );
    }

    /*
     * Resolve the authenticated user to the real customer record.
     */
    const {
      data: customer,
      error: customerError,
    } = await admin
      .from("customers")
      .select(`
        id,
        auth_user_id,
        is_active
      `)
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (customerError) {
      throw new Error(
        `Unable to verify customer profile: ${customerError.message}`,
      );
    }

    if (!customer) {
      throw new Error(
        "Your customer profile could not be found.",
      );
    }

    if (customer.is_active === false) {
      throw new Error(
        "Your customer account is currently inactive.",
      );
    }

    /*
     * Resolve the active loan product.
     *
     * The browser does NOT determine the official
     * loan configuration.
     */
    const {
      data: product,
      error: productError,
    } = await admin
      .from("loan_products")
      .select(`
        id,
        name,
        min_amount,
        max_amount,
        status
      `)
      .eq("id", productId)
      .eq("status", "Active")
      .maybeSingle();

    if (productError) {
      throw new Error(
        `Unable to verify loan service: ${productError.message}`,
      );
    }

    if (!product) {
      throw new Error(
        "The selected loan service is no longer available.",
      );
    }

    if (
      product.min_amount !== null &&
      requestedAmount < Number(product.min_amount)
    ) {
      throw new Error(
        `The minimum amount for this loan service is K${Number(
          product.min_amount,
        ).toFixed(2)}.`,
      );
    }

    if (
      product.max_amount !== null &&
      requestedAmount > Number(product.max_amount)
    ) {
      throw new Error(
        `The maximum amount for this loan service is K${Number(
          product.max_amount,
        ).toFixed(2)}.`,
      );
    }

    /*
     * Resolve the exact active repayment term.
     */
    const {
      data: term,
      error: termError,
    } = await admin
      .from("loan_product_terms")
      .select(`
        id,
        loan_product_id,
        period_days,
        interest_rate,
        active
      `)
      .eq("id", termId)
      .eq("loan_product_id", product.id)
      .eq("active", true)
      .maybeSingle();

    if (termError) {
      throw new Error(
        `Unable to verify repayment term: ${termError.message}`,
      );
    }

    if (!term) {
      throw new Error(
        "The selected repayment term is no longer available.",
      );
    }

    /*
     * Collateral is optional.
     *
     * Empty or "none" means:
     *   required = false
     *   id = null
     *   worth = null
     */
    const noCollateral =
      !collateralIdRaw ||
      collateralIdRaw.toLowerCase() === "none";

    let collateralId: string | null = null;
    let collateralWorth: number | null = null;

    if (!noCollateral) {
      const {
        data: collateral,
        error: collateralError,
      } = await admin
        .from("collateral_catalogue")
        .select(`
          id,
          name,
          active
        `)
        .eq("id", collateralIdRaw)
        .eq("active", true)
        .maybeSingle();

      if (collateralError) {
        throw new Error(
          `Unable to verify collateral: ${collateralError.message}`,
        );
      }

      if (!collateral) {
        throw new Error(
          "The selected collateral is no longer available.",
        );
      }

      collateralId = collateral.id;

      if (collateralWorthRaw) {
        const parsedWorth = Number(
          collateralWorthRaw,
        );

        if (
          !Number.isFinite(parsedWorth) ||
          parsedWorth < 0
        ) {
          throw new Error(
            "Collateral worth must be a valid non-negative amount.",
          );
        }

        collateralWorth = parsedWorth;
      }
    }

    /*
     * Calculate official totals from the database term.
     */
    const interestRate = Number(
      term.interest_rate,
    );

    const repaymentPeriod = Number(
      term.period_days,
    );

    const interestAmount =
      (requestedAmount * interestRate) / 100;

    const totalPayable =
      requestedAmount + interestAmount;

    const installment =
      repaymentPeriod > 0
        ? totalPayable / repaymentPeriod
        : totalPayable;

    /*
     * Generate application number.
     */
    const applicationNumber =
      `LN-${new Date().getFullYear()}${String(
        new Date().getMonth() + 1,
      ).padStart(2, "0")}${String(
        new Date().getDate(),
      ).padStart(2, "0")}-${crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 8)
        .toUpperCase()}`;

    /*
     * Calculate due date.
     */
    const dueDateObject = new Date(
      `${applicationDate}T00:00:00`,
    );

    if (
      Number.isNaN(
        dueDateObject.getTime(),
      )
    ) {
      throw new Error(
        "Invalid application date.",
      );
    }

    dueDateObject.setDate(
      dueDateObject.getDate() +
        repaymentPeriod,
    );

    const dueDate =
      `${dueDateObject.getFullYear()}-${String(
        dueDateObject.getMonth() + 1,
      ).padStart(2, "0")}-${String(
        dueDateObject.getDate(),
      ).padStart(2, "0")}`;

    /*
     * Create the application first.
     * This gives us the application UUID
     * for the private storage paths.
     */
    const {
      data: application,
      error: applicationError,
    } = await admin
      .from("customer_loan_applications")
      .insert({
        application_number:
          applicationNumber,

        customer_id:
          customer.id,

        loan_product_id:
          product.id,

        application_source:
          "Customer App",

        application_date:
          applicationDate,

        loan_type:
          "Customer Loan",

        requested_amount:
          requestedAmount,

        interest_rate:
          interestRate,

        repayment_period:
          repaymentPeriod,

        monthly_installment:
          installment,

        total_payable:
          totalPayable,

        amount_paid:
          0,

        outstanding_balance:
          totalPayable,

        collateral_required:
          !noCollateral,

        collateral_description:
          null,

        collateral_id:
          collateralId,

        collateral_worth:
          collateralWorth,

        account_operator_id:
          null,

        due_date:
          dueDate,

        residential_address:
          residentialAddress,

        next_of_kin_name:
          nextOfKinName,

        next_of_kin_relationship:
          nextOfKinRelationship,

        next_of_kin_phone:
          nextOfKinPhone,

        status:
          "Pending",

        notes:
          notes || null,
      })
      .select(
        "id, application_number",
      )
      .single();

    if (
      applicationError ||
      !application
    ) {
      throw new Error(
        applicationError?.message ??
          "Unable to create loan application.",
      );
    }

    const applicationId =
      application.id;

    const customerId =
      customer.id;

    /*
     * Upload verification images.
     *
     * Private bucket:
     *
     * customer-id/
     *   application-id/
     *     nrc-front.jpg
     *     nrc-back.jpg
     *     selfie.jpg
     */
    const uploads = [
      {
        file: nrcFront,
        type: "nrc-front",
      },
      {
        file: nrcBack,
        type: "nrc-back",
      },
      {
        file: selfie,
        type: "selfie",
      },
    ];

    const uploadedPaths: string[] = [];

    try {
      for (const item of uploads) {
        const extension =
          getExtension(
            item.file.type,
          );

        const path =
          `${customerId}/${applicationId}/${item.type}.${extension}`;

        const buffer =
          Buffer.from(
            await item.file.arrayBuffer(),
          );

        const {
          error: uploadError,
        } = await admin.storage
          .from(BUCKET)
          .upload(
            path,
            buffer,
            {
              contentType:
                item.file.type,
              upsert: false,
            },
          );

        if (uploadError) {
          throw new Error(
            `Unable to securely store ${item.type}: ${uploadError.message}`,
          );
        }

        uploadedPaths.push(path);
      }

      /*
       * Attach the private storage paths
       * to the application.
       */
      const [
        nrcFrontPath,
        nrcBackPath,
        selfiePath,
      ] = uploadedPaths;

      const {
        error: updateError,
      } = await admin
        .from("customer_loan_applications")
        .update({
          nrc_front_path:
            nrcFrontPath,

          nrc_back_path:
            nrcBackPath,

          selfie_path:
            selfiePath,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          applicationId,
        );

      if (updateError) {
        throw new Error(
          `Unable to attach verification documents: ${updateError.message}`,
        );
      }
    } catch (uploadError) {
      /*
       * Remove any successfully uploaded files.
       */
      if (
        uploadedPaths.length > 0
      ) {
        await admin.storage
          .from(BUCKET)
          .remove(
            uploadedPaths,
          );
      }

      /*
       * Remove the incomplete application.
       */
      await admin
        .from(
          "customer_loan_applications",
        )
        .delete()
        .eq(
          "id",
          applicationId,
        );

      throw uploadError;
    }

    /*
     * Everything succeeded.
     */
    return NextResponse.json({
      success: true,

      application: {
        id: application.id,

        application_number:
          application.application_number,

        status:
          "Pending",
      },
    });
  } catch (error) {
    console.error(
      "Customer loan application submission error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit your loan application.",
      },
      {
        status: 400,
      },
    );
  }
}