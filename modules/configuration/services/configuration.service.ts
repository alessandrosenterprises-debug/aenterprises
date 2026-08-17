import { supabase } from "@/lib/supabase/client";

function getSupabaseErrorMessage(error: unknown) {
  if (!error) {
    return "Unknown Supabase error.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object") {
    const err = error as Record<string, unknown>;

    return (
      String(
        err.message ??
          err.details ??
          err.hint ??
          err.code ??
          "Unknown Supabase error."
      )
    );
  }

  return String(error);
}

export async function createConfiguration(
  table: string,
  values: Record<string, any>
) {
  console.log(
    "Creating configuration:",
    {
      table,
      values,
    }
  );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single();

  if (error) {
    console.error(
      "Supabase create error:",
      {
        table,
        values,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      getSupabaseErrorMessage(error)
    );
  }

  return data;
}

export async function updateConfiguration(
  table: string,
  id: string,
  values: Record<string, any>
) {
  console.log(
    "Updating configuration:",
    {
      table,
      id,
      values,
    }
  );

  const {
    data,
    error,
  } = await supabase
    .from(table)
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Supabase update error:",
      {
        table,
        id,
        values,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      getSupabaseErrorMessage(error)
    );
  }

  return data;
}

export async function deleteConfiguration(
  table: string,
  id: string
) {
  console.log(
    "Deleting configuration:",
    {
      table,
      id,
    }
  );

  const {
    error,
  } = await supabase
    .from(table)
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Supabase delete error:",
      {
        table,
        id,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    throw new Error(
      getSupabaseErrorMessage(error)
    );
  }

  return true;
}