-- Add is_admin flag to pos_staff table
-- Super admins can designate certain staff as admins who get access to the admin panel
ALTER TABLE pos_staff ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Helper function to check if current user is an admin
CREATE OR REPLACE FUNCTION get_current_staff_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM pos_staff WHERE auth_user_id = auth.uid() AND is_active = true LIMIT 1),
    false
  );
$$;
