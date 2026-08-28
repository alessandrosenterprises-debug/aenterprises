ALTER TABLE public.customer_loan_applications
  ADD COLUMN IF NOT EXISTS residential_address TEXT,

  ADD COLUMN IF NOT EXISTS next_of_kin_name TEXT,

  ADD COLUMN IF NOT EXISTS next_of_kin_relationship TEXT,

  ADD COLUMN IF NOT EXISTS next_of_kin_phone TEXT,

  ADD COLUMN IF NOT EXISTS nrc_front_path TEXT,

  ADD COLUMN IF NOT EXISTS nrc_back_path TEXT,

  ADD COLUMN IF NOT EXISTS selfie_path TEXT;