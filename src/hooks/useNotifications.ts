import { useEffect, useState } from 'react';
import { notificationService } from '@/services/notifications';

interface Notification {
  id: number;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type: 'request' | 'approval' | 'system';
}

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const initialNotifications = await notificationService.getNotifications(userId);
      setNotifications(initialNotifications);
      setUnreadCount(initialNotifications.filter(n => !n.isRead).length);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      if (notification.userId === userId) {
        setNotifications(prev => [notification, ...prev]);
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    return unsubscribe;
  }, [userId]);

  const markAsRead = async (notificationId: number) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(prev => prev - 1);
  };

  const markAllAsRead = async () => {
    await Promise.all(
      notifications
        .filter(n => !n.isRead)
        .map(n => notificationService.markAsRead(n.id))
    );
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
};