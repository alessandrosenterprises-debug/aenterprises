import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const {
      nrcFrontPath,
      nrcBackPath,
      selfiePath,
    } = body;

    const supabase =
      await createClient();

    async function createSignedUrl(
      path: string | null
    ) {
      if (!path) {
        return null;
      }

      const { data, error } =
        await supabase.storage
          .from("customer-verification")
          .createSignedUrl(
            path,
            60 * 60
          );

      if (error) {
        console.error(
          "Signed URL error:",
          error
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
      nrcFrontUrl,
      nrcBackUrl,
      selfieUrl,
    });
  } catch (error) {
    console.error(
      "Verification documents API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load verification documents.",
      },
      {
        status: 500,
      }
    );
  }
}