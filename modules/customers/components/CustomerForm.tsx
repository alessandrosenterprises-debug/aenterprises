"use client";

import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { createCustomer } from "@/modules/customers/services/customer.client";


interface Business {
  id: string;
  name: string;
}

interface CustomerFormValues {
  business_id: string;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  date_of_birth: string;
  notes: string;
  is_active: boolean;
}

interface CustomerFormProps {
  businesses: Business[];
  onSuccess?: () => void;
}

export default function CustomerForm({
  businesses,
  onSuccess,
}: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CustomerFormValues>({
    defaultValues: {
      is_active: true,
    },
  });

 async function onSubmit(data: CustomerFormValues) {
  try {
    await createCustomer({
      business_id: data.business_id,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      notes: data.notes,
      is_active: data.is_active,
    });

    alert("Customer created successfully.");

    onSuccess?.();

    window.location.reload();
  } catch (error: any) {
    console.error("Create Customer Error:", error);

    alert(
      error?.message ||
      JSON.stringify(error) ||
      "Failed to create customer."
    );
  }
} 
  const businessOptions = businesses.map((business) => ({
  label: business.name,
  value: business.id,
}));

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="grid gap-6">

        {/* Business */}

        <Select
          label="Business *"
          placeholder="Select Business"
          options={businessOptions}
          {...register("business_id")}
        />

        {/* Full Name */}

        <Input
          label="Full Name *"
          placeholder="Enter customer name"
          {...register("full_name")}
        />

        {/* Phone + Email */}

        <div className="grid gap-6 md:grid-cols-2">

          <Input
            label="Phone Number *"
            placeholder="+260..."
            {...register("phone")}
          />

          <Input
            label="Email"
            placeholder="customer@email.com"
            {...register("email")}
          />

        </div>

        {/* Address */}

        <Textarea
          label="Address"
          placeholder="Customer address"
          {...register("address")}
        />

        {/* Gender + DOB */}

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

        {/* Notes */}

        <Textarea
          label="Notes"
          placeholder="Additional notes..."
          {...register("notes")}
        />

        {/* Active */}

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            {...register("is_active")}
          />

          <span className="font-medium text-slate-700">
            Active Customer
          </span>

        </label>

        {/* Buttons */}

        <div className="flex justify-end gap-3">

          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancel
          </button>

          <SubmitButton loading={isSubmitting}>
            Save Customer
          </SubmitButton>

        </div>

      </div>
    </form>
  );
}