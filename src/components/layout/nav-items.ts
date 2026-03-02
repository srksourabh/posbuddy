import {
  LayoutDashboard,
  Phone,
  Upload,
  Users,
  Settings,
  Building2,
  Landmark,
  Smartphone,
  FileSpreadsheet,
  Wrench,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: string[]; // if empty, visible to all
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Calls",
        url: "/calls",
        icon: Phone,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        title: "Import Calls",
        url: "/import",
        icon: Upload,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: FileSpreadsheet,
        roles: ["Back Office", "Management"],
      },
    ],
  },
  {
    label: "Master Data",
    items: [
      {
        title: "Customers",
        url: "/master/customers",
        icon: Building2,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Banks",
        url: "/master/banks",
        icon: Landmark,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Device Models",
        url: "/master/devices",
        icon: Smartphone,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Call Types",
        url: "/master/call-types",
        icon: Wrench,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Staff",
        url: "/master/staff",
        icon: Users,
        roles: ["Back Office", "Management"],
      },
      {
        title: "Closure Templates",
        url: "/master/closure-templates",
        icon: ClipboardList,
        roles: ["Back Office", "Management"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Column Mappings",
        url: "/settings/mappings",
        icon: Settings,
        roles: ["Back Office", "Management"],
      },
    ],
  },
];
