import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const notificationsApi = {
  getNotifications: async (unreadOnly?: boolean) => {
    const query = unreadOnly ? '?unreadOnly=true' : '';
    const response = await axios.get(`${API_URL}/notifications${query}`, getAuthHeaders());
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, getAuthHeaders());
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await axios.patch(`${API_URL}/notifications/${id}/read`, {}, getAuthHeaders());
    return response.data;
  },

  markAsUnread: async (id: string) => {
    const response = await axios.patch(`${API_URL}/notifications/${id}/unread`, {}, getAuthHeaders());
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await axios.patch(`${API_URL}/notifications/${id}/delete`, {}, getAuthHeaders());
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await axios.patch(`${API_URL}/notifications/read-all`, {}, getAuthHeaders());
    return response.data;
  }
};
