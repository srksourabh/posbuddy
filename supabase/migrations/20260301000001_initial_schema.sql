-- ============================================================
-- POSBUDDY Initial Schema - v3.2
-- 12 tables + indexes + triggers + helper functions
-- ============================================================

-- =========================
-- Table 1: customers
-- =========================
CREATE TABLE public.customers (
  customer_id   SERIAL PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL UNIQUE,
  customer_code VARCHAR(20)  NOT NULL UNIQUE,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =========================
-- Table 2: acquiring_banks
-- =========================
CREATE TABLE public.acquiring_banks (
  bank_id   SERIAL PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL UNIQUE,
  bank_code VARCHAR(20),
  is_active BOOLEAN      NOT NULL DEFAULT TRUE
);

-- =========================
-- Table 3: call_types
-- =========================
CREATE TABLE public.call_types (
  call_type_id   SERIAL PRIMARY KEY,
  call_type_name VARCHAR(50) NOT NULL UNIQUE
);

-- =========================
-- Table 4: device_models
-- =========================
CREATE TABLE public.device_models (
  model_id   SERIAL PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL UNIQUE,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

-- =========================
-- Table 5: pos_staff
-- =========================
CREATE TABLE public.pos_staff (
  staff_id        SERIAL PRIMARY KEY,
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  hr_user_id      CHAR(36)     NOT NULL UNIQUE,
  hr_emp_code     VARCHAR(20)  NOT NULL UNIQUE,
  full_name       VARCHAR(150),
  phone           VARCHAR(15),
  email           VARCHAR(150),
  avatar_url      VARCHAR(500),
  designation     VARCHAR(100),
  department      VARCHAR(50),
  reports_to_id   INT REFERENCES public.pos_staff(staff_id) ON DELETE SET NULL,
  address         TEXT,
  city            VARCHAR(100),
  state           VARCHAR(100),
  pincode         VARCHAR(10),
  date_of_joining DATE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  deactivated_at  TIMESTAMPTZ,
  last_synced_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_pos_staff_reports_to ON public.pos_staff (reports_to_id);
CREATE INDEX idx_pos_staff_department ON public.pos_staff (department);
CREATE INDEX idx_pos_staff_active ON public.pos_staff (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_pos_staff_auth_user ON public.pos_staff (auth_user_id);

-- =========================
-- Table 6: column_mapping_versions
-- =========================
CREATE TABLE public.column_mapping_versions (
  version_id     SERIAL PRIMARY KEY,
  customer_id    INT          NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  version_label  VARCHAR(50),
  effective_from DATE,
  is_current     BOOLEAN      NOT NULL DEFAULT TRUE,
  notes          TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_by     INT          REFERENCES public.pos_staff(staff_id) ON DELETE SET NULL
);

CREATE INDEX idx_cmv_customer_current ON public.column_mapping_versions (customer_id, is_current)
  WHERE is_current = TRUE;

-- =========================
-- Table 7: customer_column_mappings
-- =========================
CREATE TABLE public.customer_column_mappings (
  mapping_id     SERIAL PRIMARY KEY,
  version_id     INT          NOT NULL REFERENCES public.column_mapping_versions(version_id) ON DELETE CASCADE,
  source_column  VARCHAR(200),
  unified_field  VARCHAR(100),
  transform_rule VARCHAR(500),
  display_order  INT          DEFAULT 0,
  UNIQUE (version_id, unified_field)
);

-- =========================
-- Table 8: calls
-- =========================
CREATE TABLE public.calls (
  call_id             SERIAL PRIMARY KEY,
  customer_id         INT          NOT NULL REFERENCES public.customers(customer_id),
  call_ticket_number  VARCHAR(50)  NOT NULL UNIQUE,
  call_type_id        INT          REFERENCES public.call_types(call_type_id),
  call_creation_date  TIMESTAMPTZ,
  merchant_name       VARCHAR(200),
  mid                 VARCHAR(50),
  tid                 VARCHAR(50),
  acquiring_bank_id   INT          REFERENCES public.acquiring_banks(bank_id),
  contact_address     TEXT,
  city                VARCHAR(100),
  district            VARCHAR(100),
  state               VARCHAR(100),
  pincode             VARCHAR(10),
  contact_name        VARCHAR(150),
  contact_phone       VARCHAR(15),
  device_model_id     INT          REFERENCES public.device_models(model_id),
  problem_description TEXT,
  call_status         VARCHAR(50)  NOT NULL DEFAULT 'Pending',
  assigned_to_id      INT          REFERENCES public.pos_staff(staff_id),
  assigned_by_id      INT          REFERENCES public.pos_staff(staff_id),
  assigned_at         TIMESTAMPTZ,
  source_raw_data     JSONB,
  import_batch_id     VARCHAR(50),
  imported_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_customer    ON public.calls (customer_id);
CREATE INDEX idx_calls_status      ON public.calls (call_status);
CREATE INDEX idx_calls_assigned_to ON public.calls (assigned_to_id);
CREATE INDEX idx_calls_assigned_by ON public.calls (assigned_by_id);
CREATE INDEX idx_calls_mid_tid     ON public.calls (mid, tid);
CREATE INDEX idx_calls_creation    ON public.calls (call_creation_date);
CREATE INDEX idx_calls_state_city  ON public.calls (state, city);
CREATE INDEX idx_calls_district    ON public.calls (district);

-- =========================
-- Table 9: closing_requirement_templates
-- =========================
CREATE TABLE public.closing_requirement_templates (
  template_field_id SERIAL PRIMARY KEY,
  customer_id       INT          NOT NULL REFERENCES public.customers(customer_id) ON DELETE CASCADE,
  field_name        VARCHAR(100),
  field_type        VARCHAR(20)  CHECK (field_type IN ('text', 'textarea', 'select', 'photo', 'signature', 'number', 'date')),
  is_required       BOOLEAN      NOT NULL DEFAULT TRUE,
  display_order     INT          DEFAULT 0,
  options_json      JSONB,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_crt_customer ON public.closing_requirement_templates (customer_id);

-- =========================
-- Table 10: call_closures
-- =========================
CREATE TABLE public.call_closures (
  closure_id     SERIAL PRIMARY KEY,
  call_id        INT            NOT NULL UNIQUE REFERENCES public.calls(call_id) ON DELETE CASCADE,
  closed_by_id   INT            REFERENCES public.pos_staff(staff_id),
  closure_status VARCHAR(50),
  visit_in_time  TIMESTAMPTZ,
  visit_out_time TIMESTAMPTZ,
  gps_latitude   DECIMAL(10,8),
  gps_longitude  DECIMAL(11,8),
  remarks        TEXT,
  closed_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- =========================
-- Table 11: closure_field_values
-- =========================
CREATE TABLE public.closure_field_values (
  value_id          SERIAL PRIMARY KEY,
  closure_id        INT          NOT NULL REFERENCES public.call_closures(closure_id) ON DELETE CASCADE,
  template_field_id INT          NOT NULL REFERENCES public.closing_requirement_templates(template_field_id),
  field_value       TEXT,
  file_url          VARCHAR(500),
  submitted_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_cfv_closure ON public.closure_field_values (closure_id);

-- =========================
-- Table 12: call_status_log
-- =========================
CREATE TABLE public.call_status_log (
  log_id        SERIAL PRIMARY KEY,
  call_id       INT          NOT NULL REFERENCES public.calls(call_id) ON DELETE CASCADE,
  old_status    VARCHAR(50),
  new_status    VARCHAR(50),
  changed_by_id INT          REFERENCES public.pos_staff(staff_id),
  change_reason TEXT,
  changed_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_csl_call ON public.call_status_log (call_id);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================

-- Maps auth.uid() to pos_staff.staff_id
CREATE OR REPLACE FUNCTION public.get_current_staff_id()
RETURNS INT AS $$
  SELECT staff_id FROM public.pos_staff
  WHERE auth_user_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns current user's department
CREATE OR REPLACE FUNCTION public.get_current_staff_department()
RETURNS TEXT AS $$
  SELECT department FROM public.pos_staff
  WHERE auth_user_id = auth.uid() AND is_active = TRUE
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recursive: all downline staff IDs for a manager
CREATE OR REPLACE FUNCTION public.get_downline_staff_ids(manager_staff_id INT)
RETURNS SETOF INT AS $$
  WITH RECURSIVE downline AS (
    SELECT staff_id FROM public.pos_staff
    WHERE reports_to_id = manager_staff_id AND is_active = TRUE
    UNION ALL
    SELECT ps.staff_id FROM public.pos_staff ps
    INNER JOIN downline d ON ps.reports_to_id = d.staff_id
    WHERE ps.is_active = TRUE
  )
  SELECT staff_id FROM downline;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
