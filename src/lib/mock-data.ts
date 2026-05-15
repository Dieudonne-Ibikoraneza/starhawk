export interface Notification {
  id: string;
  category: "claim" | "assessment" | "policy" | "alert" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  href?: string;
}

export const initialNotifications: Notification[] = [
  {
    id: "1",
    category: "claim",
    title: "New Claim Submitted",
    body: "Gad KALISA has submitted a new claim for Flood damage.",
    createdAt: "2 hours ago",
    read: false,
    href: "/insurer/claims"
  },
  {
    id: "2",
    category: "assessment",
    title: "Assessment Ready",
    body: "Drone assessment for BEANS Field is ready for review.",
    createdAt: "5 hours ago",
    read: false,
    href: "/insurer/assessments"
  }
];
