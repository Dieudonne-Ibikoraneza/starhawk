import { useState } from "react";
import { Search, Sparkles, AlignLeft } from "lucide-react";
// import { SidebarTrigger } from "@/components/ui/sidebar"; // We don't have this exact component, but we can use a Button to toggle sidebar state if needed, or just use a custom trigger.
// For now I'll use a standard Button as a placeholder or check DashboardLayout
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationsPopover } from "./NotificationsPopover";
import { GlobalSearch } from "./GlobalSearch";
import { Menu } from "lucide-react";

export function Topbar({ 
  onToggleSidebar, 
  sidebarCollapsed,
  userName, 
  userEmail,
  userRole 
}: { 
  onToggleSidebar?: () => void, 
  sidebarCollapsed?: boolean,
  userName?: string, 
  userEmail?: string,
  userRole?: string 
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground mr-2"
          onClick={onToggleSidebar}
        >
          <AlignLeft className="h-5 w-5" />
        </Button>

        <button
          onClick={() => setSearchOpen(true)}
          className="group relative hidden h-10 flex-1 max-w-xl items-center gap-2 rounded-lg border border-border/60 bg-secondary/60 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary md:flex"
        >
          <Search className="h-4 w-4" />
          <span className="truncate text-gray-500 font-medium">Search for farmers, farms, policies, claims…</span>
          <kbd className="ml-auto hidden items-center gap-1 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium md:inline-flex">
            ⌘ K
          </kbd>
        </button>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSearchOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" className="hidden gap-1.5 text-muted-foreground hover:text-foreground lg:inline-flex">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </Button>

          <NotificationsPopover />

          <div className="hidden items-center gap-3 rounded-full border border-border/60 bg-card py-1 pl-1 pr-3 shadow-sm sm:flex">
            <Avatar className="h-7 w-7 ring-2 ring-indigo-50 border-white">
              <AvatarFallback className="bg-indigo-600 text-[10px] font-semibold text-white">
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EM'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden flex-col leading-[1.1] md:flex">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{userName || 'Elena Moreno'}</span>
              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{userEmail || 'elena@starhawk.com'}</span>
            </div>
            <Badge variant="secondary" className="ml-1 h-5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-0 text-[9px] font-bold">PRO</Badge>
          </div>

          <Avatar className="h-8 w-8 sm:hidden">
            <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
               {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'EM'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
