import { NextResponse } from "next/server";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

const MOBILE_BUCKET = "loan-identity-documents";
const AEOS_BUCKET = "customer-verification";

const SIGNED_URL_SECONDS = 60 * 60;

export async function POST(request: Request) {
  try {
    /*
     * Authenticate the currently logged-in AEOS user.
     */
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "You must be signed in to view verification documents.",
        },
        { status: 401 },
      );
    }

    /*
     * Use the admin client only for private storage access.
     */
    const admin = createAdminClient();

    const body = await request.json();

    const {
      nrcFrontPath,
      nrcBackPath,
      selfiePath,
    } = body;

    /*
     * Generate a temporary signed URL
     * for a private storage object.
     */
    async function createSignedUrl(
      path: string | null | undefined,
    ) {
      if (!path) {
        return null;
      }

      const cleanPath = String(path).trim();

      if (!cleanPath) {
        return null;
      }

      /*
       * Make sure the requested document actually belongs
       * to our private loan verification bucket structure.
       *
       * Supported upload paths:
       *
       * customer-id/document-name.ext
       * customer-id/application-id/document-name.ext
       */
      const pathParts = cleanPath.split("/");
      const isValidPath =
        (pathParts.length === 2 || pathParts.length === 3) &&
        pathParts.every((part: string) =>
          part.length > 0 && part !== "." && part !== ".." && !part.includes("\\"),
        );

      if (!isValidPath) {
        console.error(
          "Invalid verification document path:",
          cleanPath,
        );

        return null;
      }

      // The customer mobile submission endpoint stores documents in
      // loan-identity-documents, while the AEOS walk-in form uses
      // customer-verification. Try the expected bucket first, then the
      // other bucket for older records created before the paths were unified.
      const preferredBucket = pathParts.length === 3
        ? MOBILE_BUCKET
        : AEOS_BUCKET;
      const buckets = preferredBucket === MOBILE_BUCKET
        ? [MOBILE_BUCKET, AEOS_BUCKET]
        : [AEOS_BUCKET, MOBILE_BUCKET];

      let lastError: unknown;
      for (const bucket of buckets) {
        const { data, error } = await admin.storage
          .from(bucket)
          .createSignedUrl(cleanPath, SIGNED_URL_SECONDS);
        if (!error && data?.signedUrl) return data.signedUrl;
        lastError = error;
      }

      console.error(`Unable to sign verification document ${cleanPath}:`, lastError);
      return null;
    }

    const [
      nrcFrontUrl,
      nrcBackUrl,
      selfieUrl,
    ] = await Promise.all([
      createSignedUrl(nrcFrontPath),
      createSignedUrl(nrcBackPath),
      createSignedUrl(selfiePath),
    ]);

    return NextResponse.json({
      success: true,

      nrcFrontUrl,
      nrcBackUrl,
      selfieUrl,
    });
  } catch (error) {
    console.error(
      "Verification documents API error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load verification documents.",
      },
      {
        status: 500,
      },
    );
  }
}
