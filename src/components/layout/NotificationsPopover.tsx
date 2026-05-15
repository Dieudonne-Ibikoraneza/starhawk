import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, CheckCheck, AlertTriangle, FileText, Wallet, ClipboardCheck, Satellite, Trash2 } from "lucide-react";
import { initialNotifications, Notification } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const categoryIcon = {
  claim: Wallet,
  assessment: ClipboardCheck,
  policy: FileText,
  alert: AlertTriangle,
  system: Satellite,
} as const;

const categoryColor = {
  claim: "text-info bg-info/10",
  assessment: "text-warning-foreground bg-warning/15",
  policy: "text-primary bg-primary/10",
  alert: "text-danger bg-danger/10",
  system: "text-muted-foreground bg-muted",
} as const;

export function NotificationsPopover() {
  const [items, setItems] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  const markRead = (id: string) => setItems((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems((p) => p.map((n) => ({ ...n, read: true })));
  const clear = () => setItems([]);

  const openItem = (n: Notification) => {
    markRead(n.id);
    if (n.href) {
      setOpen(false);
      navigate(n.href);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200 shadow-sm">
          <Bell className="h-5 w-5 text-slate-500" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-in zoom-in duration-300">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 sm:w-[400px] bg-card/90 backdrop-blur-xl border-border/60 shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="font-display text-sm font-semibold">Notifications</p>
            <p className="text-[11px] text-muted-foreground">{unread} unread · {items.length} total</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={markAll} disabled={unread === 0}>
              <CheckCheck className="mr-1 h-3 w-3" />Mark all read
            </Button>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border/60 px-3 py-2">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "all" ? "All" : `Unread${unread > 0 ? ` (${unread})` : ""}`}
            </button>
          ))}
        </div>

        <div className="max-h-[420px] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">No {filter === "unread" ? "unread " : ""}notifications.</p>
            </div>
          ) : (
            visible.map((n) => {
              const Icon = categoryIcon[n.category];
              return (
                <div
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={cn(
                    "group flex cursor-pointer items-start gap-3 border-b border-border/40 px-4 py-3 transition-colors hover:bg-muted/40",
                    !n.read && "bg-primary/[0.03]"
                  )}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", categoryColor[n.category])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm leading-tight", !n.read && "font-semibold")}>{n.title}</p>
                      {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{n.createdAt}</p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground" onClick={clear} disabled={items.length === 0}>
            <Trash2 className="mr-1 h-3 w-3" />Clear all
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
