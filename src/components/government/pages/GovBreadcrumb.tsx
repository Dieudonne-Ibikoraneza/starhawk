import { Fragment } from "react";
import { Home } from "lucide-react";
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
import { regionHref } from "./governmentLeaderboard";
import "./GovBreadcrumb.css";

export type NavTarget = {
  level:
    | "Leaderboard"
    | "Country"
    | "Province"
    | "District"
    | "Sector"
    | "Cell"
    | "Village"
    | "Farmer";
  id?: string;
};
export interface GovBreadcrumbProps {
  items: {
    level: NavTarget["level"];
    id?: string;
    name: string;
    href?: string;
  }[];
  onNavigate?: (target: NavTarget) => void;
}

export function GovBreadcrumb({ items, onNavigate }: GovBreadcrumbProps) {
  if (!items.length) return null;
  const first = items[0];
  const last = items[items.length - 1];
  const middle = items.slice(1, -1);
  const link = (item: typeof first, home = false) => (
    <BreadcrumbLink
      href={
        item.href ?? (item.id ? regionHref(item.id) : "/government/leaderboard")
      }
      title={item.name}
      onClick={(event) => {
        if (
          onNavigate &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          onNavigate({ level: item.level, id: item.id });
        }
      }}
      className="inline-flex min-w-0 items-center gap-1 text-indigo-700"
    >
      {home && <Home className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span
        className={home ? "gov-breadcrumb-home-label truncate" : "truncate"}
      >
        {item.name}
      </span>
    </BreadcrumbLink>
  );
  return (
    <Breadcrumb
      aria-label="Region breadcrumbs"
      className="gov-breadcrumb w-full min-w-0 py-1"
    >
      <BreadcrumbList className="flex-nowrap gap-1.5">
        {items.length === 1 ? (
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate" title={first.name}>
              {first.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem className="gov-breadcrumb-home min-w-0">
              {link(first, true)}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="shrink-0" />
            {middle.length > 0 && (
              <>
                <BreadcrumbItem className="gov-breadcrumb-collapsed shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label="Show parent regions"
                      className="rounded hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
                    >
                      <BreadcrumbEllipsis />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-80 max-w-[calc(100vw-2rem)] overflow-y-auto"
                    >
                      {middle.map((item) => (
                        <DropdownMenuItem
                          key={`${item.level}-${item.id}`}
                          asChild
                        >
                          {link(item)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="gov-breadcrumb-collapsed shrink-0" />
              </>
            )}
            {middle.map((item) => (
              <Fragment key={`${item.level}-${item.id}`}>
                <BreadcrumbItem className="gov-breadcrumb-expanded min-w-0">
                  {link(item)}
                </BreadcrumbItem>
                <BreadcrumbSeparator className="gov-breadcrumb-expanded shrink-0" />
              </Fragment>
            ))}
            <BreadcrumbItem className="min-w-0 flex-1">
              <BreadcrumbPage
                className="truncate font-medium"
                title={last.name}
              >
                {last.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
