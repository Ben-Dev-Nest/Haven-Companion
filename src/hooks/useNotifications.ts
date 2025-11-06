import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreferences {
  enabled: boolean;
  check_in_time: string;
  permission: NotificationPermission;
}

export const useNotifications = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: false,
    check_in_time: '09:00',
    permission: 'default',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPreferences(prev => ({ ...prev, permission: Notification.permission }));
    }
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(prev => ({
          ...prev,
          enabled: data.enabled,
          check_in_time: data.check_in_time.substring(0, 5), // HH:MM format
        }));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not supported',
        description: 'Notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPreferences(prev => ({ ...prev, permission }));
      
      if (permission === 'granted') {
        // Register service worker if not already registered
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        }
        return true;
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const updatePreferences = async (enabled: boolean, checkInTime: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // If enabling notifications, request permission first
      if (enabled && preferences.permission !== 'granted') {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          enabled,
          check_in_time: `${checkInTime}:00`,
        });

      if (error) throw error;

      setPreferences(prev => ({
        ...prev,
        enabled,
        check_in_time: checkInTime,
      }));

      // Schedule the notification
      if (enabled) {
        scheduleNotification(checkInTime);
      }

      toast({
        title: 'Preferences saved',
        description: enabled 
          ? `Daily check-in reminder set for ${checkInTime}`
          : 'Notifications disabled',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleNotification = (checkInTime: string) => {
    // Calculate milliseconds until the check-in time
    const [hours, minutes] = checkInTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilNotification = scheduledTime.getTime() - now.getTime();

    // Clear any existing timeout
    const existingTimeout = (window as any).notificationTimeout;
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      showNotification();
      // Schedule the next one for tomorrow
      scheduleNotification(checkInTime);
    }, timeUntilNotification);

    (window as any).notificationTimeout = timeoutId;
  };

  const showNotification = async () => {
    if (preferences.permission === 'granted' && preferences.enabled) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Haven Daily Check-in', {
          body: 'How are you feeling today? Take a moment to check in with yourself.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'daily-checkin',
          requireInteraction: false,
        });

        // Update last notification sent
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('notification_preferences')
            .update({ last_notification_sent: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    }
  };

  const testNotification = () => {
    showNotification();
  };

  return {
    preferences,
    loading,
    updatePreferences,
    testNotification,
  };
};
