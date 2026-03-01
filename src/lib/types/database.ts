export type CallStatus =
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Closed"
  | "Cancelled";

export type StaffDepartment = "FSE" | "Back Office" | "Stock" | "Management";

export type ClosureFieldType =
  | "text"
  | "textarea"
  | "select"
  | "photo"
  | "signature"
  | "number"
  | "date";

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          customer_id: number;
          customer_name: string;
          customer_code: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id?: number;
          customer_name: string;
          customer_code: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_name?: string;
          customer_code?: string;
          is_active?: boolean;
        };
      };
      acquiring_banks: {
        Row: {
          bank_id: number;
          bank_name: string;
          bank_code: string | null;
          is_active: boolean;
        };
        Insert: {
          bank_id?: number;
          bank_name: string;
          bank_code?: string | null;
          is_active?: boolean;
        };
        Update: {
          bank_name?: string;
          bank_code?: string | null;
          is_active?: boolean;
        };
      };
      call_types: {
        Row: {
          call_type_id: number;
          call_type_name: string;
        };
        Insert: {
          call_type_id?: number;
          call_type_name: string;
        };
        Update: {
          call_type_name?: string;
        };
      };
      device_models: {
        Row: {
          model_id: number;
          model_name: string;
          is_active: boolean;
        };
        Insert: {
          model_id?: number;
          model_name: string;
          is_active?: boolean;
        };
        Update: {
          model_name?: string;
          is_active?: boolean;
        };
      };
      pos_staff: {
        Row: {
          staff_id: number;
          auth_user_id: string | null;
          hr_user_id: string;
          hr_emp_code: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          designation: string | null;
          department: string | null;
          reports_to_id: number | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          date_of_joining: string | null;
          is_active: boolean;
          deactivated_at: string | null;
          last_synced_at: string;
        };
        Insert: {
          staff_id?: number;
          auth_user_id?: string | null;
          hr_user_id: string;
          hr_emp_code: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          designation?: string | null;
          department?: string | null;
          reports_to_id?: number | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          date_of_joining?: string | null;
          is_active?: boolean;
          deactivated_at?: string | null;
          last_synced_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pos_staff"]["Insert"]>;
      };
      column_mapping_versions: {
        Row: {
          version_id: number;
          customer_id: number;
          version_label: string | null;
          effective_from: string | null;
          is_current: boolean;
          notes: string | null;
          created_at: string;
          created_by: number | null;
        };
        Insert: {
          version_id?: number;
          customer_id: number;
          version_label?: string | null;
          effective_from?: string | null;
          is_current?: boolean;
          notes?: string | null;
          created_at?: string;
          created_by?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["column_mapping_versions"]["Insert"]
        >;
      };
      customer_column_mappings: {
        Row: {
          mapping_id: number;
          version_id: number;
          source_column: string | null;
          unified_field: string | null;
          transform_rule: string | null;
          display_order: number | null;
        };
        Insert: {
          mapping_id?: number;
          version_id: number;
          source_column?: string | null;
          unified_field?: string | null;
          transform_rule?: string | null;
          display_order?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["customer_column_mappings"]["Insert"]
        >;
      };
      calls: {
        Row: {
          call_id: number;
          customer_id: number;
          call_ticket_number: string;
          call_type_id: number | null;
          call_creation_date: string | null;
          merchant_name: string | null;
          mid: string | null;
          tid: string | null;
          acquiring_bank_id: number | null;
          contact_address: string | null;
          city: string | null;
          district: string | null;
          state: string | null;
          pincode: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          device_model_id: number | null;
          problem_description: string | null;
          call_status: string;
          assigned_to_id: number | null;
          assigned_by_id: number | null;
          assigned_at: string | null;
          source_raw_data: Record<string, unknown> | null;
          import_batch_id: string | null;
          imported_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          call_id?: number;
          customer_id: number;
          call_ticket_number: string;
          call_type_id?: number | null;
          call_creation_date?: string | null;
          merchant_name?: string | null;
          mid?: string | null;
          tid?: string | null;
          acquiring_bank_id?: number | null;
          contact_address?: string | null;
          city?: string | null;
          district?: string | null;
          state?: string | null;
          pincode?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          device_model_id?: number | null;
          problem_description?: string | null;
          call_status?: string;
          assigned_to_id?: number | null;
          assigned_by_id?: number | null;
          assigned_at?: string | null;
          source_raw_data?: Record<string, unknown> | null;
          import_batch_id?: string | null;
          imported_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["calls"]["Insert"]>;
      };
      closing_requirement_templates: {
        Row: {
          template_field_id: number;
          customer_id: number;
          field_name: string | null;
          field_type: string | null;
          is_required: boolean;
          display_order: number | null;
          options_json: unknown | null;
          is_active: boolean;
        };
        Insert: {
          template_field_id?: number;
          customer_id: number;
          field_name?: string | null;
          field_type?: string | null;
          is_required?: boolean;
          display_order?: number | null;
          options_json?: unknown | null;
          is_active?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["closing_requirement_templates"]["Insert"]
        >;
      };
      call_closures: {
        Row: {
          closure_id: number;
          call_id: number;
          closed_by_id: number | null;
          closure_status: string | null;
          visit_in_time: string | null;
          visit_out_time: string | null;
          gps_latitude: number | null;
          gps_longitude: number | null;
          remarks: string | null;
          closed_at: string;
        };
        Insert: {
          closure_id?: number;
          call_id: number;
          closed_by_id?: number | null;
          closure_status?: string | null;
          visit_in_time?: string | null;
          visit_out_time?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          remarks?: string | null;
          closed_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["call_closures"]["Insert"]
        >;
      };
      closure_field_values: {
        Row: {
          value_id: number;
          closure_id: number;
          template_field_id: number;
          field_value: string | null;
          file_url: string | null;
          submitted_at: string;
        };
        Insert: {
          value_id?: number;
          closure_id: number;
          template_field_id: number;
          field_value?: string | null;
          file_url?: string | null;
          submitted_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["closure_field_values"]["Insert"]
        >;
      };
      call_status_log: {
        Row: {
          log_id: number;
          call_id: number;
          old_status: string | null;
          new_status: string | null;
          changed_by_id: number | null;
          change_reason: string | null;
          changed_at: string;
        };
        Insert: {
          log_id?: number;
          call_id: number;
          old_status?: string | null;
          new_status?: string | null;
          changed_by_id?: number | null;
          change_reason?: string | null;
          changed_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["call_status_log"]["Insert"]
        >;
      };
    };
    Functions: {
      get_current_staff_id: {
        Args: Record<string, never>;
        Returns: number;
      };
      get_current_staff_department: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_downline_staff_ids: {
        Args: { manager_staff_id: number };
        Returns: number[];
      };
    };
  };
}
