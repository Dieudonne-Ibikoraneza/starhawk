import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import SignatureCaptureModal from "@/components/common/SignatureCaptureModal";
import { useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "FARMER" | "INSURER" | "ASSESSOR" | "ADMIN" | "GOVERNMENT";
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [signatureCollected, setSignatureCollected] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50/50">
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-4 rounded-full bg-indigo-500/10 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin relative" />
          <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest relative">
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/role-selection" replace />;
  }

  const userRole = user.role.toUpperCase();
  
  if (userRole !== allowedRole) {
    // Determine the user's correct dashboard route based on their authenticated role
    const dashboardRoutes: Record<string, string> = {
      FARMER: "/farmer/dashboard",
      INSURER: "/insurer/dashboard",
      ASSESSOR: "/assessor/dashboard",
      ADMIN: "/admin/dashboard",
      GOVERNMENT: "/government-analytics",
    };

    const targetRoute = dashboardRoutes[userRole] || "/role-selection";
    return <Navigate to={targetRoute} replace />;
  }

  // Check if Farmer needs to provide a signature
  const needsSignature = userRole === "FARMER" && !user.signatureUrl && !signatureCollected;

  return (
    <>
      {children}
      {needsSignature && (
        <SignatureCaptureModal onSuccess={() => setSignatureCollected(true)} />
      )}
    </>
  );
}
