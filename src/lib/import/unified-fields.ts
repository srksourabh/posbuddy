/** The unified field names that every customer's Excel columns get mapped to. */
export const UNIFIED_FIELDS = [
  { key: "call_ticket_number", label: "Ticket Number", required: true },
  { key: "call_type", label: "Call Type", required: false },
  { key: "call_creation_date", label: "Call Date", required: false },
  { key: "merchant_name", label: "Merchant Name", required: false },
  { key: "mid", label: "MID", required: false },
  { key: "tid", label: "TID", required: false },
  { key: "acquiring_bank", label: "Acquiring Bank", required: false },
  { key: "contact_address", label: "Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "district", label: "District", required: false },
  { key: "state", label: "State", required: false },
  { key: "pincode", label: "Pincode", required: false },
  { key: "contact_name", label: "Contact Name", required: false },
  { key: "contact_phone", label: "Contact Phone", required: false },
  { key: "device_model", label: "Device Model", required: false },
  { key: "problem_description", label: "Problem Description", required: false },
] as const;

export type UnifiedFieldKey = (typeof UNIFIED_FIELDS)[number]["key"];
