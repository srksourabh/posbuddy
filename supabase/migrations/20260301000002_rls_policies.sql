-- ============================================================
-- POSBUDDY RLS Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acquiring_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.column_mapping_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_requirement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closure_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_status_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Master Data: read-only for all authenticated users
-- Admin (service_role) handles inserts/updates
-- ============================================================

CREATE POLICY "auth_read_customers" ON public.customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_banks" ON public.acquiring_banks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_call_types" ON public.call_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_read_device_models" ON public.device_models
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- pos_staff: all authenticated can read active staff
-- ============================================================

CREATE POLICY "auth_read_staff" ON public.pos_staff
  FOR SELECT TO authenticated
  USING (is_active = true);

-- ============================================================
-- calls: FSE sees own assigned, Back Office sees all
-- ============================================================

CREATE POLICY "fse_read_own_calls" ON public.calls
  FOR SELECT TO authenticated
  USING (
    assigned_to_id = public.get_current_staff_id()
    AND public.get_current_staff_department() = 'FSE'
  );

CREATE POLICY "backoffice_read_all_calls" ON public.calls
  FOR SELECT TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

CREATE POLICY "fse_update_own_calls" ON public.calls
  FOR UPDATE TO authenticated
  USING (
    assigned_to_id = public.get_current_staff_id()
    AND public.get_current_staff_department() = 'FSE'
  )
  WITH CHECK (
    assigned_to_id = public.get_current_staff_id()
  );

CREATE POLICY "backoffice_insert_calls" ON public.calls
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

CREATE POLICY "backoffice_update_calls" ON public.calls
  FOR UPDATE TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

-- ============================================================
-- column_mapping_versions: Back Office only
-- ============================================================

CREATE POLICY "backoffice_manage_mapping_versions" ON public.column_mapping_versions
  FOR ALL TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

-- ============================================================
-- customer_column_mappings: Back Office only
-- ============================================================

CREATE POLICY "backoffice_manage_column_mappings" ON public.customer_column_mappings
  FOR ALL TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

-- ============================================================
-- closing_requirement_templates: all read, Back Office manages
-- ============================================================

CREATE POLICY "auth_read_closure_templates" ON public.closing_requirement_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "backoffice_manage_closure_templates" ON public.closing_requirement_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

CREATE POLICY "backoffice_update_closure_templates" ON public.closing_requirement_templates
  FOR UPDATE TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

CREATE POLICY "backoffice_delete_closure_templates" ON public.closing_requirement_templates
  FOR DELETE TO authenticated
  USING (
    public.get_current_staff_department() IS DISTINCT FROM 'FSE'
  );

-- ============================================================
-- call_closures: FSE inserts own, all read via call access
-- ============================================================

CREATE POLICY "fse_insert_closure" ON public.call_closures
  FOR INSERT TO authenticated
  WITH CHECK (
    closed_by_id = public.get_current_staff_id()
    AND EXISTS (
      SELECT 1 FROM public.calls
      WHERE call_id = call_closures.call_id
        AND assigned_to_id = public.get_current_staff_id()
    )
  );

CREATE POLICY "auth_read_closures" ON public.call_closures
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.calls WHERE call_id = call_closures.call_id)
  );

-- ============================================================
-- closure_field_values: FSE inserts own, all read via closure
-- ============================================================

CREATE POLICY "fse_insert_field_values" ON public.closure_field_values
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.call_closures
      WHERE closure_id = closure_field_values.closure_id
        AND closed_by_id = public.get_current_staff_id()
    )
  );

CREATE POLICY "auth_read_field_values" ON public.closure_field_values
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.call_closures WHERE closure_id = closure_field_values.closure_id)
  );

-- ============================================================
-- call_status_log: append-only for all, read via call access
-- ============================================================

CREATE POLICY "auth_insert_status_log" ON public.call_status_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_read_status_log" ON public.call_status_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.calls WHERE call_id = call_status_log.call_id)
  );
