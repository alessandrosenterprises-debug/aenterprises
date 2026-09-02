import { NextResponse } from "next/server";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

const BUCKET = "loan-identity-documents";

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
       * Expected:
       *
       * customer-id/
       *   application-id/
       *     document-name.ext
       */
      const pathParts = cleanPath.split("/");

      if (pathParts.length !== 3) {
        console.error(
          "Invalid verification document path:",
          cleanPath,
        );

        return null;
      }

      const { data, error } =
        await admin.storage
          .from(BUCKET)
          .createSignedUrl(
            cleanPath,
            SIGNED_URL_SECONDS,
          );

      if (error) {
        console.error(
          `Signed URL error for ${cleanPath}:`,
          error,
        );

        return null;
      }

      return data?.signedUrl ?? null;
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