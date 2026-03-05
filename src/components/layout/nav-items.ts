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
  UserCheck,
  BarChart3,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: string[]; // if empty, visible to all back-office roles
  adminOnly?: boolean; // requires is_admin flag
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
    label: "Coordination",
    items: [
      {
        title: "Assign Calls",
        url: "/assign",
        icon: UserCheck,
      },
      {
        title: "My Team",
        url: "/team",
        icon: Users,
      },
      {
        title: "Workload",
        url: "/workload",
        icon: BarChart3,
      },
      {
        title: "Activity Log",
        url: "/activity",
        icon: Clock,
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
        adminOnly: true,
      },
      {
        title: "Reports",
        url: "/reports",
        icon: FileSpreadsheet,
        adminOnly: true,
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
        adminOnly: true,
      },
      {
        title: "Banks",
        url: "/master/banks",
        icon: Landmark,
        adminOnly: true,
      },
      {
        title: "Device Models",
        url: "/master/devices",
        icon: Smartphone,
        adminOnly: true,
      },
      {
        title: "Call Types",
        url: "/master/call-types",
        icon: Wrench,
        adminOnly: true,
      },
      {
        title: "Staff",
        url: "/master/staff",
        icon: Users,
        adminOnly: true,
      },
      {
        title: "Closure Templates",
        url: "/master/closure-templates",
        icon: ClipboardList,
        adminOnly: true,
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
        adminOnly: true,
      },
    ],
  },
];
