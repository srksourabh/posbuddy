"use client";

import { useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  fetchTemplatesForCustomer,
  saveTemplateField,
  deleteTemplateField,
  reorderTemplateFields,
} from "@/app/(backoffice)/master/closure-templates/actions";
import type { TemplateField } from "@/app/(backoffice)/master/closure-templates/actions";

const FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "photo",
  "signature",
  "number",
  "date",
] as const;

interface Customer {
  customer_id: number;
  customer_name: string;
  customer_code: string;
}

interface ClosureTemplateManagerProps {
  customers: Customer[];
}

interface FieldForm {
  template_field_id?: number;
  field_name: string;
  field_type: string;
  is_required: boolean;
  options_csv: string;
}

const emptyForm: FieldForm = {
  field_name: "",
  field_type: "text",
  is_required: false,
  options_csv: "",
};

export function ClosureTemplateManager({
  customers,
}: ClosureTemplateManagerProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editForm, setEditForm] = useState<FieldForm>(emptyForm);

  const loadFields = async (customerId: number) => {
    setLoading(true);
    try {
      const data = await fetchTemplatesForCustomer(customerId);
      setFields(data);
    } catch {
      toast.error("Failed to load template fields");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    const id = Number(value);
    setSelectedCustomerId(id);
    setShowForm(false);
    setEditForm(emptyForm);
    loadFields(id);
  };

  const handleAddNew = () => {
    setEditForm(emptyForm);
    setShowForm(true);
  };

  const handleEdit = (field: TemplateField) => {
    setEditForm({
      template_field_id: field.template_field_id,
      field_name: field.field_name ?? "",
      field_type: field.field_type ?? "text",
      is_required: field.is_required,
      options_csv: Array.isArray(field.options_json)
        ? field.options_json.join(", ")
        : "",
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!selectedCustomerId || !editForm.field_name.trim()) {
      toast.error("Field name is required");
      return;
    }

    startTransition(async () => {
      const optionsArr =
        editForm.field_type === "select" && editForm.options_csv.trim()
          ? editForm.options_csv.split(",").map((o) => o.trim()).filter(Boolean)
          : null;

      const result = await saveTemplateField({
        template_field_id: editForm.template_field_id,
        customer_id: selectedCustomerId,
        field_name: editForm.field_name.trim(),
        field_type: editForm.field_type,
        is_required: editForm.is_required,
        display_order: editForm.template_field_id
          ? fields.find((f) => f.template_field_id === editForm.template_field_id)
              ?.display_order ?? fields.length
          : fields.length,
        options_json: optionsArr,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          editForm.template_field_id ? "Field updated" : "Field added"
        );
        setShowForm(false);
        setEditForm(emptyForm);
        loadFields(selectedCustomerId);
      }
    });
  };

  const handleDelete = (fieldId: number) => {
    if (!selectedCustomerId) return;
    startTransition(async () => {
      const result = await deleteTemplateField(fieldId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Field removed");
        loadFields(selectedCustomerId);
      }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0 || !selectedCustomerId) return;
    const updated = [...fields];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setFields(updated);

    startTransition(async () => {
      const reorderData = updated.map((f, i) => ({
        template_field_id: f.template_field_id,
        display_order: i,
      }));
      const result = await reorderTemplateFields(reorderData);
      if (result.error) toast.error(result.error);
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= fields.length - 1 || !selectedCustomerId) return;
    const updated = [...fields];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setFields(updated);

    startTransition(async () => {
      const reorderData = updated.map((f, i) => ({
        template_field_id: f.template_field_id,
        display_order: i,
      }));
      const result = await reorderTemplateFields(reorderData);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <div className="space-y-6">
      {/* Customer Selector */}
      <div className="max-w-sm">
        <Label>Customer</Label>
        <Select
          value={selectedCustomerId?.toString() ?? ""}
          onValueChange={handleCustomerChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent position="popper">
            {customers.map((c) => (
              <SelectItem key={c.customer_id} value={c.customer_id.toString()}>
                {c.customer_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* No customer selected */}
      {!selectedCustomerId && (
        <p className="text-sm text-muted-foreground">
          Select a customer above to manage their closure form fields.
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading fields...
        </div>
      )}

      {/* Fields List */}
      {selectedCustomerId && !loading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {fields.length} field{fields.length !== 1 ? "s" : ""} configured
            </p>
            <Button size="sm" onClick={handleAddNew} disabled={showForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {editForm.template_field_id ? "Edit Field" : "Add New Field"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Field Name *</Label>
                    <Input
                      value={editForm.field_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, field_name: e.target.value })
                      }
                      placeholder="e.g., Serial Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select
                      value={editForm.field_type}
                      onValueChange={(v) =>
                        setEditForm({ ...editForm, field_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {FIELD_TYPES.map((ft) => (
                          <SelectItem key={ft} value={ft}>
                            {ft.charAt(0).toUpperCase() + ft.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editForm.field_type === "select" && (
                  <div className="space-y-2">
                    <Label>Options (comma-separated)</Label>
                    <Input
                      value={editForm.options_csv}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          options_csv: e.target.value,
                        })
                      }
                      placeholder="e.g., Working, Not Working, Replaced"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is_required"
                    checked={editForm.is_required}
                    onCheckedChange={(checked) =>
                      setEditForm({
                        ...editForm,
                        is_required: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="is_required" className="text-sm">
                    Required field
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {editForm.template_field_id ? "Update" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setEditForm(emptyForm);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Field Cards */}
          {fields.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No closure fields configured for this customer. Click &quot;Add
              Field&quot; to get started.
            </p>
          )}

          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div
                key={field.template_field_id}
                className="flex items-center gap-3 rounded-lg border px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={idx === 0 || isPending}
                    onClick={() => handleMoveUp(idx)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={idx === fields.length - 1 || isPending}
                    onClick={() => handleMoveDown(idx)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {field.field_name ?? "Unnamed"}
                    </span>
                    {field.is_required && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {field.field_type ?? "text"}
                    </Badge>
                    {field.field_type === "select" &&
                      Array.isArray(field.options_json) && (
                        <span className="text-xs text-muted-foreground truncate">
                          {field.options_json.join(", ")}
                        </span>
                      )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(field)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(field.template_field_id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
