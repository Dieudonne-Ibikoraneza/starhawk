import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { notificationsApi } from "@/services/notificationsApi";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "./AuthContext";

export interface NotificationItem {
  id: string;
  category: "claim" | "assessment" | "policy" | "alert" | "system";
  title: string;
  body: string;
  createdAt: string;
  timestamp: string;
  read: boolean;
  href?: string;
  // Kept for backward compatibility if components rely on these
  type?: string;
  priority?: string;
  status?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAsUnread: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
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

  const loadRealNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await notificationsApi.getNotifications();
      const rawData = response.data || response; // Handle wrapped vs unwrapped responses
      
      const formattedNotifications: NotificationItem[] = Array.isArray(rawData) ? rawData.map((n: any) => {
        let category: any = 'system';
        let href: string | undefined = undefined;

        if (n.type?.includes('POLICY')) category = 'policy';
        else if (n.type?.includes('CLAIM')) category = 'claim';
        else if (n.type?.includes('ASSESSMENT')) category = 'assessment';

        if (n.referenceId && n.referenceType === 'Policy') {
          href = `/farmer/insurance`; // A default route for policies
        }

        return {
          id: n._id,
          category,
          title: n.title,
          body: n.message,
          createdAt: formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }),
          timestamp: n.createdAt,
          read: n.read,
          href,
          type: n.type,
        };
      }) : [];

      setNotifications(formattedNotifications);
    } catch (err) {
      console.error("Failed to load real notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRealNotifications();
    const interval = setInterval(loadRealNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadRealNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await notificationsApi.markAsRead(id);
    } catch (e) {
      console.error(e);
      loadRealNotifications(); // Revert on failure
    }
  };

  const markAsUnread = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n));
    try {
      await notificationsApi.markAsUnread(id);
    } catch (e) {
      console.error(e);
      loadRealNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await notificationsApi.deleteNotification(id);
    } catch (e) {
      console.error(e);
      loadRealNotifications();
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllAsRead();
    } catch (e) {
      console.error(e);
      loadRealNotifications();
    }
  };

  const clearAll = async () => {
    // We don't have a clear all endpoint on the backend, so we delete them one by one or ignore.
    // For now, we will just visually clear them, or iterate and delete (simplistic approach).
    const current = [...notifications];
    setNotifications([]);
    try {
      for (const n of current) {
        await notificationsApi.deleteNotification(n.id);
      }
    } catch (e) {
      console.error(e);
      loadRealNotifications();
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      refreshNotifications: loadRealNotifications,
      markAsRead,
      markAsUnread,
      markAllAsRead,
      deleteNotification,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

