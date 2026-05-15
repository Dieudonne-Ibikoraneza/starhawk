import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import assessmentsApiService from "@/services/assessmentsApi";
import { getClaims } from "@/services/claimsApi";
import { getUserId } from "@/services/authAPI";
import { formatDistanceToNow } from "date-fns";
import { Notification } from "@/lib/mock-data";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  id: string;
  category: "claim" | "assessment" | "policy" | "alert" | "system";
  type: string;
  title: string;
  body: string;
  message: string; // for backward compatibility with page
  priority: "high" | "medium" | "low";
  createdAt: string;
  timestamp: string; // for backward compatibility with page
  read: boolean;
  status: "read" | "unread"; // for backward compatibility with page
  href?: string;
  farmerId?: string;
  farmerName?: string;
  location?: string;
  assessmentId?: string;
  claimId?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = user?.id || localStorage.getItem("userId");
  const role = (user?.role || localStorage.getItem("role") || "").toLowerCase();

  const loadRealNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [assessmentsResp, claimsResp] = await Promise.allSettled([
        assessmentsApiService.getAllAssessments(),
        getClaims()
      ]);

      const notificationsList: NotificationItem[] = [];

      // Process assessments
      if (assessmentsResp.status === 'fulfilled') {
        const assessmentsData = (assessmentsResp.value as any).data || assessmentsResp.value || [];
        const assessmentsArray = Array.isArray(assessmentsData) ? assessmentsData : (assessmentsData.items || assessmentsData.results || []);
        
        assessmentsArray.forEach((a: any) => {
          const aId = a._id || a.id;
          const status = (a.status || "").toLowerCase();
          const date = a.createdAt || a.updatedAt || new Date().toISOString();
          const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });
          
          const farm = a.farmId || a.farm || {};
          const farmer = farm.farmerId || farm.farmer || {};
          const farmerName = farmer.firstName && farmer.lastName 
            ? `${farmer.firstName} ${farmer.lastName}` 
            : farmer.name || "Unknown Farmer";
          const location = farm.locationName || farm.location || "Unknown Location";

          if (role === 'assessor') {
            const assessorId = a.assessorId || a.assessor?._id || a.assessor?.id;
            if (assessorId && String(assessorId) === String(userId) && (status === 'pending' || status === 'in_progress')) {
              notificationsList.push({
                id: `a-${aId}`,
                category: "assessment",
                type: "new_assignment",
                title: "New Assessment Assigned",
                body: `You have a new assessment for ${farmerName}.`,
                message: `You have a new assessment for ${farmerName}.`,
                priority: "high",
                createdAt: timeAgo,
                timestamp: date,
                read: false,
                status: "unread",
                href: "/assessor/risk-assessments",
                farmerName,
                location,
                assessmentId: aId
              });
            }
          } else if (role === 'insurer') {
            if (status === 'submitted') {
              notificationsList.push({
                id: `a-${aId}`,
                category: "assessment",
                type: "assessment_submitted",
                title: "Assessment Submitted",
                body: `An assessment for ${farmerName} has been submitted.`,
                message: `An assessment for ${farmerName} has been submitted.`,
                priority: "medium",
                createdAt: timeAgo,
                timestamp: date,
                read: false,
                status: "unread",
                href: "/insurer/assessments",
                farmerName,
                location,
                assessmentId: aId
              });
            }
          }
        });
      }

      // Process claims
      if (claimsResp.status === 'fulfilled') {
        const claimsData = (claimsResp.value as any).data || claimsResp.value || [];
        const claimsArray = Array.isArray(claimsData) ? claimsData : (claimsData.items || claimsData.results || []);
        
        claimsArray.forEach((c: any) => {
          const cId = c._id || c.id;
          const status = (c.status || "").toLowerCase();
          const date = c.createdAt || c.updatedAt || new Date().toISOString();
          const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });

          const farmer = c.farmerId || c.farmer || {};
          const farmerName = farmer.firstName && farmer.lastName 
            ? `${farmer.firstName} ${farmer.lastName}` 
            : farmer.name || "Gad KALISA"; // Mock name from screenshot if not found
          const location = c.location || "Unknown Location";

          if (role === 'assessor') {
            const assessorId = c.assessorId || c.assessor?._id || c.assessor?.id;
            if (assessorId && String(assessorId) === String(userId) && status === 'pending') {
              notificationsList.push({
                id: `c-${cId}`,
                category: "claim",
                type: "claim_assignment",
                title: "New Claim Assessment",
                body: `You have been assigned to assess claim ${c.claimNumber || cId} for farmer ${farmerName}.`,
                message: `You have been assigned to assess claim ${c.claimNumber || cId} for farmer ${farmerName}.`,
                priority: "high",
                createdAt: timeAgo,
                timestamp: date,
                read: false,
                status: "unread",
                href: "/assessor/loss-assessments",
                farmerName,
                location,
                claimId: cId
              });
            }
          } else if (role === 'insurer') {
            if (status === 'pending' || status === 'submitted') {
              notificationsList.push({
                id: `c-${cId}`,
                category: "claim",
                type: "claim_received",
                title: "New Claim Received",
                body: `A new claim ${c.claimNumber || cId} has been filed.`,
                message: `A new claim ${c.claimNumber || cId} has been filed.`,
                priority: "high",
                createdAt: timeAgo,
                timestamp: date,
                read: false,
                status: "unread",
                href: "/insurer/claims",
                farmerName,
                location,
                claimId: cId
              });
            }
          }
        });
      }

      // Sort by date (newest first)
      setNotifications(notificationsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId, role]);

  useEffect(() => {
    loadRealNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(loadRealNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRealNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications: loadRealNotifications,
      markAsRead,
      markAllAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
