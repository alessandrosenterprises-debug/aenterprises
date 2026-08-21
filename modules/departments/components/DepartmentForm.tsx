"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createDepartment,
  updateDepartment,
} from "@/modules/departments/services/department.client";

interface DepartmentFormValues {
  name: string;
  description: string;
  status: string;
}

interface DepartmentFormProps {
  mode?: "create" | "edit";

  department?: {
  id?: string;
  name?: string | null;
  description?: string | null;
  status?: string | null;
};

  onSuccess?: () => void;
}

export default function DepartmentForm({
  mode = "create",
  department,
  onSuccess,
}: DepartmentFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<DepartmentFormValues>({
    defaultValues: {
      name: department?.name ?? "",
      description: department?.description ?? "",
      status: department?.status ?? "Active",
    },
  });

  async function onSubmit(data: DepartmentFormValues) {
    try {
      if (!data.name.trim()) {
        toast.error("Department name is required.");
        return;
      }

      if (mode === "edit" && department?.id) {
        await updateDepartment(department.id, {
          name: data.name.trim(),
          description: data.description.trim() || null,
          status: data.status,
        });

        toast.success("Department updated successfully.");
      } else {
        await createDepartment({
          name: data.name.trim(),
          description: data.description.trim() || null,
          status: data.status,
        });

        toast.success("Department created successfully.");
      }

      onSuccess?.();

      router.refresh();
    } catch (error) {
      console.error("Department save error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save department."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid gap-6">
        <Input
          label="Department Name *"
          placeholder="e.g. Human Resources"
          {...register("name")}
        />

        <Textarea
          label="Description"
          placeholder="Describe the department..."
          {...register("description")}
        />

        <Select
          label="Status"
          placeholder="Select Status"
          options={[
            {
              label: "Active",
              value: "Active",
            },
            {
              label: "Inactive",
              value: "Inactive",
            },
          ]}
          {...register("status")}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <SubmitButton loading={isSubmitting}>
            {mode === "create"
              ? "Create Department"
              : "Update Department"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}