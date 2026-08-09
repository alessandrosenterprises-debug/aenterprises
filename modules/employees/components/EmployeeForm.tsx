"use client";

import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  createEmployee,
  updateEmployee,
} from "@/modules/employees/services/employee.client";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Business {
  id: string;
  name: string;
}

interface EmployeeFormValues {
  business_id: string;
  full_name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  national_id: string;
  address: string;
  position: string;
  employment_type: string;
  salary: number;
  date_joined: string;
  notes: string;
  is_active: boolean;
}

interface EmployeeFormProps {
  businesses: Business[];
  onSuccess?: () => void;

  mode?: "create" | "edit";

  employee?: Partial<EmployeeFormValues> & {
    id?: string;
  };
}

export default function EmployeeForm({
  businesses,
  onSuccess,
  mode = "create",
  employee,
}: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<EmployeeFormValues>({
    defaultValues: {
      business_id: employee?.business_id ?? "",
      full_name: employee?.full_name ?? "",
      phone: employee?.phone ?? "",
      email: employee?.email ?? "",
      gender: employee?.gender ?? "",
      date_of_birth: employee?.date_of_birth ?? "",
      national_id: employee?.national_id ?? "",
      address: employee?.address ?? "",
      position: employee?.position ?? "",
      employment_type:
        employee?.employment_type ?? "Full Time",
      salary: employee?.salary ?? 0,
      date_joined: employee?.date_joined ?? "",
      notes: employee?.notes ?? "",
      is_active: employee?.is_active ?? true,
    },
  });

  const router = useRouter();

  const businessOptions = businesses.map((business) => ({
    label: business.name,
    value: business.id,
  }));

  async function onSubmit(data: EmployeeFormValues) {
    try {
      if (mode === "edit" && employee?.id) {
        await updateEmployee(employee.id, {
          business_id: data.business_id,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          national_id: data.national_id,
          address: data.address,
          position: data.position,
          employment_type: data.employment_type,
          salary: data.salary,
          date_joined: data.date_joined,
          notes: data.notes,
          is_active: data.is_active,
        });

        toast.success("Employee updated successfully.");
      } else {
        await createEmployee({
          business_id: data.business_id,
          full_name: data.full_name,
          phone: data.phone,
          email: data.email,
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          national_id: data.national_id,
          address: data.address,
          position: data.position,
          employment_type: data.employment_type,
          salary: data.salary,
          date_joined: data.date_joined,
          notes: data.notes,
          is_active: data.is_active,
        });

        toast.success("Employee created successfully.");
      }

      onSuccess?.();

      router.refresh();
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message || "Failed to save employee."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid gap-6">

        <Select
          label="Business *"
          placeholder="Select Business"
          options={businessOptions}
          {...register("business_id")}
        />

        <Input
          label="Full Name *"
          placeholder="Enter employee name"
          {...register("full_name")}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Phone Number *"
            placeholder="+260..."
            {...register("phone")}
          />

          <Input
            label="Email"
            placeholder="employee@email.com"
            {...register("email")}
          />
        </div>

        <Textarea
          label="Address"
          placeholder="Employee address"
          {...register("address")}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Gender"
            placeholder="Select Gender"
            options={[
              {
                label: "Male",
                value: "Male",
              },
              {
                label: "Female",
                value: "Female",
              },
            ]}
            {...register("gender")}
          />

          <Input
            type="date"
            label="Date of Birth"
            {...register("date_of_birth")}
          />
        </div>

        <Input
          label="National ID"
          placeholder="Enter National ID"
          {...register("national_id")}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Position *"
            placeholder="e.g. Barber"
            {...register("position")}
          />

          <Select
            label="Employment Type"
            placeholder="Select Type"
            options={[
              {
                label: "Full Time",
                value: "Full Time",
              },
              {
                label: "Part Time",
                value: "Part Time",
              },
              {
                label: "Contract",
                value: "Contract",
              },
            ]}
            {...register("employment_type")}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Input
            type="number"
            label="Salary"
            placeholder="0.00"
            {...register("salary", {
              valueAsNumber: true,
            })}
          />

          <Input
            type="date"
            label="Date Joined"
            {...register("date_joined")}
          />
        </div>

        <Textarea
          label="Notes"
          placeholder="Additional notes..."
          {...register("notes")}
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            {...register("is_active")}
          />

          <span className="font-medium text-slate-700">
            Active Employee
          </span>
        </label>

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
              ? "Create Employee"
              : "Update Employee"}
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}