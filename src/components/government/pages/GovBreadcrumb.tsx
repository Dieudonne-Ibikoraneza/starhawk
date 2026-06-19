import React from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home } from "lucide-react";

export type NavTarget = { level: "Leaderboard" | "Sector" | "Cell" | "Village" | "Farmer"; id?: string };

export interface GovBreadcrumbProps {
  items: { level: NavTarget["level"]; id?: string; name: string }[];
  onNavigate?: (target: NavTarget) => void;
}

export function GovBreadcrumb({ items, onNavigate }: GovBreadcrumbProps) {
  if (!items || items.length === 0) return null;

  const first = items[0];
  const last = items[items.length - 1];
  const middle = items.slice(1, -1);

  return (
    <Breadcrumb className="py-1">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink 
            className="flex items-center gap-1 cursor-pointer whitespace-nowrap"
            onClick={() => onNavigate?.({ level: first.level, id: first.id })}
          >
            <Home className="h-3.5 w-3.5" /> 
            <span className="hidden sm:inline">{first.name}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 1 && <BreadcrumbSeparator />}

        {/* Mobile: Ellipsis Dropdown for middle items if there are any */}
        {middle.length > 0 && (
          <>
            <BreadcrumbItem className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 focus:outline-none">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middle.map((item, idx) => (
                    <DropdownMenuItem 
                      key={idx}
                      onClick={() => onNavigate?.({ level: item.level, id: item.id })}
                    >
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="sm:hidden" />
          </>
        )}

        {/* Desktop: Show middle items inline */}
        {middle.map((item, idx) => (
          <React.Fragment key={idx}>
            <BreadcrumbItem className="hidden sm:inline-flex">
              <BreadcrumbLink
                className="cursor-pointer whitespace-nowrap"
                onClick={() => onNavigate?.({ level: item.level, id: item.id })}
              >
                {item.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:inline-flex" />
          </React.Fragment>
        ))}

        {/* Last Item (Current Page) */}
        {items.length > 1 && (
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[150px] truncate sm:max-w-none">
              {last.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
