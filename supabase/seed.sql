-- ============================================================
-- POSBUDDY Seed Data
-- ============================================================

-- 6 Customers
INSERT INTO public.customers (customer_name, customer_code) VALUES
  ('Hitachi Payment Services', 'HITACHI'),
  ('PhonePe', 'PHONEPE'),
  ('Fiserv India', 'FISERV'),
  ('Mosambee', 'MOSAMBEE'),
  ('BonusHub', 'BONUSHUB'),
  ('IServeU', 'ISERVEU');

-- 10 Acquiring Banks
INSERT INTO public.acquiring_banks (bank_name, bank_code) VALUES
  ('State Bank of India', 'SBI'),
  ('HDFC Bank', 'HDFC'),
  ('ICICI Bank', 'ICICI'),
  ('Axis Bank', 'AXIS'),
  ('Bank of Baroda', 'BOB'),
  ('Punjab National Bank', 'PNB'),
  ('Kotak Mahindra Bank', 'KOTAK'),
  ('Yes Bank', 'YES'),
  ('IndusInd Bank', 'INDUSIND'),
  ('Federal Bank', 'FEDERAL');

-- 5 Call Types
INSERT INTO public.call_types (call_type_name) VALUES
  ('Installation'),
  ('De-installation'),
  ('Break Down'),
  ('Asset Swap'),
  ('PM Visit');

-- 6 Device Models
INSERT INTO public.device_models (model_name) VALUES
  ('DX8000'),
  ('P1000'),
  ('IWL220 GPRS'),
  ('IWL220 GPRS - CTLS'),
  ('SR600MINIDQR'),
  ('MF-919-4200');
