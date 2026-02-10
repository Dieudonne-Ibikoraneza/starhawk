import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface ModernTableProps {
  columns: TableColumn[];
  data: any[];
  searchPlaceholder?: string;
  searchKeys?: string[]; // Keys to search in
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
  className?: string;
}

export function ModernTable({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKeys = [],
  onRowClick,
  emptyMessage = "No data found",
  className = "",
}: ModernTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter((row) => {
        if (searchKeys.length === 0) {
          // Search in all string values
          return Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
        return searchKeys.some((key) => {
          const value = row[key];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      })
    : data;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase tracking-wider ${column.className || ""}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={index}
                    onClick={() => onRowClick?.(row)}
                    className={`hover:bg-gray-50 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`py-4 px-6 text-sm text-gray-900 ${column.className || ""}`}
                      >
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key] || "-"}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
export function StatusBadge({
  status,
  variant = "default",
}: {
  status: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "danger":
        return "bg-red-100 text-red-800 border-red-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Auto-detect variant from status if not provided
  const autoVariant = variant === "default" ? (() => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("paid") || statusLower.includes("active") || statusLower.includes("completed") || statusLower.includes("approved")) {
      return "success";
    }
    if (statusLower.includes("pending") || statusLower.includes("processing")) {
      return "warning";
    }
    if (statusLower.includes("outstanding") || statusLower.includes("overdue") || statusLower.includes("rejected") || statusLower.includes("cancelled")) {
      return "danger";
    }
    if (statusLower.includes("submitted") || statusLower.includes("review")) {
      return "info";
    }
    return "default";
  })() : variant;

  return (
    <Badge
      className={`${getVariantStyles()} border px-2.5 py-0.5 text-xs font-medium rounded-full`}
      variant="outline"
    >
      {status}
    </Badge>
  );
}

