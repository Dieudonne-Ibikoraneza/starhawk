// Light theme utilities for dashboard components

export const dashboardTheme = {
  // Card styling - white background
  card: "bg-white border border-gray-200 shadow-sm",
  cardHeader: "border-gray-200",
  cardTitle: "text-gray-900",
  cardDescription: "text-gray-600",
  
  // Button styling
  buttonPrimary: "bg-[rgba(20,40,75,1)] hover:bg-[rgba(15,30,56,1)] text-white border border-[rgba(20,40,75,1)]",
  buttonSecondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
  
  // Input styling
  input: "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500",
  select: "bg-gray-50 border-gray-300 text-gray-900",
  textarea: "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500",
  
  // Text colors
  textPrimary: "text-gray-900",
  textSecondary: "text-gray-600",
  textMuted: "text-gray-500",
  
  // Background colors
  backgroundPrimary: "bg-gray-50",
  backgroundSecondary: "bg-white",
  
  // Border colors
  borderPrimary: "border-gray-200",
  borderSecondary: "border-gray-300",
  
  // Accent colors
  accentGreen: "text-[rgba(20,40,75,1)]",
  accentBlue: "text-blue-600",
  accentOrange: "text-orange-600",
  accentPurple: "text-purple-600",
  
  // Status colors - light theme
  success: "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  error: "text-rose-700 bg-rose-50 border-rose-200",
  info: "text-cyan-700 bg-cyan-50 border-cyan-200",
  
  // Notification colors - light theme
  notificationSuccess: "text-emerald-700 bg-emerald-100 border-emerald-300",
  notificationWarning: "text-amber-700 bg-amber-100 border-amber-300",
  notificationError: "text-rose-700 bg-rose-100 border-rose-300",
  notificationInfo: "text-cyan-700 bg-cyan-100 border-cyan-300"
};

export const applyDarkTheme = (className: string = "") => {
  return `${dashboardTheme.card} ${className}`;
};

export const getCardTheme = () => dashboardTheme.card;
export const getTextTheme = () => dashboardTheme.textPrimary;
export const getButtonTheme = () => dashboardTheme.buttonPrimary;
export const getInputTheme = () => dashboardTheme.input;
