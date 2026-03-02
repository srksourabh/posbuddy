-- Add merchant GPS coordinates to calls table for map visualization
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS merchant_latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS merchant_longitude DECIMAL(11,8) NULL;
