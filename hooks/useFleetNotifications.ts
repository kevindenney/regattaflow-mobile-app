import { useState, useEffect } from 'react';
import { fleetSocialService, FleetNotification } from '@/services/FleetSocialService';

export function useFleetNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<FleetNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadNotifications();
  }, [userId]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    const subscription = fleetSocialService.subscribeToNotifications(
      userId,
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        if (!newNotification.isRead) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;

    try {
      const data = await fleetSocialService.getNotifications(userId, { limit: 50 });
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fleetSocialService.markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      await fleetSocialService.markAllNotificationsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}
