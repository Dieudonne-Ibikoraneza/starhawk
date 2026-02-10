"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Building2, 
  MapPin, 
  FileText, 
  BarChart3, 
  Settings,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NavigationMenu() {
  const navigate = useNavigate();

  // All role dashboards removed
  const roleDashboards: any[] = [];

  const handleRoleSwitch = (path: string) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-muted/50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">AI Agri-Insurance Platform</h1>
        </div>

        {/* Role Dashboards Grid - Removed (no dashboards available) */}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• All role dashboards have been removed</p>
              <p>• Platform is currently in maintenance mode</p>
              <p>• Enhanced platform features are still available via direct routes</p>
              <p>• Contact administrator for access to specific features</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
