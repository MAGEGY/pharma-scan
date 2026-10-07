import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { EgyptianDrug } from '../../shared/schema';

// Notification types
export enum NotificationType {
  PRICE_ALERT = 'price_alert',
  MEDICATION_REMINDER = 'medication_reminder',
  PRICE_DROP = 'price_drop',
  STOCK_AVAILABLE = 'stock_available',
  GENERIC_AVAILABLE = 'generic_available',
}

// Notification data interface
export interface NotificationData {
  type: NotificationType;
  drugId?: number;
  drugName?: string;
  price?: number;
  oldPrice?: number;
  message: string;
  scheduledTime?: Date;
  recurring?: boolean;
  recurringInterval?: 'daily' | 'weekly' | 'monthly';
}

// Reminder interface
export interface MedicationReminder {
  id: string;
  drugId: number;
  drugName: string;
  dosage: string;
  time: string; // HH:MM format
  days: string[]; // ['monday', 'tuesday', ...]
  enabled: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

// Price alert interface
export interface PriceAlert {
  id: string;
  drugId: number;
  drugName: string;
  targetPrice: number;
  condition: 'below' | 'above' | 'change_percent';
  conditionValue: number;
  enabled: boolean;
  createdAt: Date;
  triggered: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  PERMISSION_STATUS: '@notification_permission_status',
  REMINDERS: '@medication_reminders',
  PRICE_ALERTS: '@price_alerts',
  DEVICE_TOKEN: '@notification_device_token',
};

// Notification service
export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private deviceToken: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('❌ Notification permissions denied');
        return false;
      }

      // Get device token
      this.deviceToken = await this.getDeviceToken();
      if (this.deviceToken) {
        console.log('📱 Device token obtained:', this.deviceToken);
      }

      this.isInitialized = true;
      console.log('✅ Notification service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === 'granted';
        await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_STATUS, granted.toString());
        return granted;
      } else {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          const granted = newStatus === 'granted';
          await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_STATUS, granted.toString());
          return granted;
        }
        return true;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Get device token for push notifications
  private async getDeviceToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('⚠️ Physical device required for push notifications');
        return null;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync();
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, token);
      return token;
    } catch (error) {
      console.error('Error getting device token:', error);
      return null;
    }
  }

  // Schedule local notification
  async scheduleNotification(data: NotificationData): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const notificationId = this.generateNotificationId();
      
      const content = {
        title: this.getNotificationTitle(data),
        body: data.message,
        data: {
          type: data.type,
          drugId: data.drugId,
          drugName: data.drugName,
          price: data.price,
          oldPrice: data.oldPrice,
        },
        sound: 'default',
      };

      let trigger: Notifications.NotificationTriggerInput | undefined;

      if (data.scheduledTime) {
        trigger = new Date(data.scheduledTime);
        
        // Handle recurring notifications
        if (data.recurring && data.recurringInterval) {
          const seconds = this.getRecurringIntervalSeconds(data.recurringInterval);
          trigger = {
            seconds,
            repeats: true,
          };
        }
      }

      await Notifications.scheduleNotificationAsync(notificationId, {
        content,
        trigger,
      });

      console.log(`📅 Scheduled notification: ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`🗑️ Cancelled notification: ${notificationId}`);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Send immediate notification
  async sendNotification(data: NotificationData): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await Notifications.scheduleNotificationAsync(this.generateNotificationId(), {
        content: {
          title: this.getNotificationTitle(data),
          body: data.message,
          data: {
            type: data.type,
            drugId: data.drugId,
            drugName: data.drugName,
            price: data.price,
            oldPrice: data.oldPrice,
          },
          sound: 'default',
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Get notification title based on type
  private getNotificationTitle(data: NotificationData): string {
    switch (data.type) {
      case NotificationType.PRICE_ALERT:
        return '💊 Price Alert';
      case NotificationType.MEDICATION_REMINDER:
        return '⏰ Medication Reminder';
      case NotificationType.PRICE_DROP:
        return '📉 Price Drop!';
      case NotificationType.STOCK_AVAILABLE:
        return '✅ Back in Stock';
      case NotificationType.GENERIC_AVAILABLE:
        return '💰 Generic Available';
      default:
        return 'Pharma-Scan';
    }
  }

  // Generate notification ID
  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get recurring interval in seconds
  private getRecurringIntervalSeconds(interval: 'daily' | 'weekly' | 'monthly'): number {
    switch (interval) {
      case 'daily':
        return 24 * 60 * 60; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60; // 30 days (approximate)
      default:
        return 24 * 60 * 60;
    }
  }

  // Medication reminder management
  async addMedicationReminder(reminder: Omit<MedicationReminder, 'id' | 'createdAt'>): Promise<string> {
    const newReminder: MedicationReminder = {
      ...reminder,
      id: this.generateNotificationId(),
      createdAt: new Date(),
    };

    // Save to storage
    const reminders = await this.getMedicationReminders();
    reminders.push(newReminder);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));

    // Schedule notifications for each day
    for (const day of reminder.days) {
      const scheduledTime = this.getNextScheduledTime(reminder.time, day);
      if (scheduledTime) {
        await this.scheduleNotification({
          type: NotificationType.MEDICATION_REMINDER,
          drugId: reminder.drugId,
          drugName: reminder.drugName,
          message: `Time to take ${reminder.drugName} - ${reminder.dosage}`,
          scheduledTime,
          recurring: true,
          recurringInterval: 'weekly',
        });
      }
    }

    console.log(`💊 Added medication reminder for ${reminder.drugName}`);
    return newReminder.id;
  }

  // Get all medication reminders
  async getMedicationReminders(): Promise<MedicationReminder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reminders:', error);
      return [];
    }
  }

  // Update medication reminder
  async updateMedicationReminder(id: string, updates: Partial<MedicationReminder>): Promise<void> {
    const reminders = await this.getMedicationReminders();
    const index = reminders.findIndex(r => r.id === id);
    
    if (index !== -1) {
      reminders[index] = { ...reminders[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
      
      // Reschedule notifications if time or days changed
      if (updates.time || updates.days || updates.enabled !== undefined) {
        await this.rescheduleReminderNotifications(reminders[index]);
      }
    }
  }

  // Delete medication reminder
  async deleteMedicationReminder(id: string): Promise<void> {
    const reminders = await this.getMedicationReminders();
    const filteredReminders = reminders.filter(r => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(filteredReminders));
    
    console.log(`🗑️ Deleted medication reminder: ${id}`);
  }

  // Price alert management
  async addPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>): Promise<string> {
    const newAlert: PriceAlert = {
      ...alert,
      id: this.generateNotificationId(),
      createdAt: new Date(),
      triggered: false,
    };

    // Save to storage
    const alerts = await this.getPriceAlerts();
    alerts.push(newAlert);
    await AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(alerts));

    console.log(`💰 Added price alert for ${alert.drugName}`);
    return newAlert.id;
  }

  // Get all price alerts
  async getPriceAlerts(): Promise<PriceAlert[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRICE_ALERTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return [];
    }
  }

  // Update price alert
  async updatePriceAlert(id: string, updates: Partial<PriceAlert>): Promise<void> {
    const alerts = await this.getPriceAlerts();
    const index = alerts.findIndex(a => a.id === id);
    
    if (index !== -1) {
      alerts[index] = { ...alerts[index], ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(alerts));
    }
  }

  // Delete price alert
  async deletePriceAlert(id: string): Promise<void> {
    const alerts = await this.getPriceAlerts();
    const filteredAlerts = alerts.filter(a => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.PRICE_ALERTS, JSON.stringify(filteredAlerts));
    
    console.log(`🗑️ Deleted price alert: ${id}`);
  }

  // Check price alerts against new prices
  async checkPriceAlerts(drugId: number, newPrice: number, drugName: string): Promise<void> {
    const alerts = await this.getPriceAlerts();
    const relevantAlerts = alerts.filter(alert => 
      alert.drugId === drugId && 
      alert.enabled && 
      !alert.triggered
    );

    for (const alert of relevantAlerts) {
      let shouldTrigger = false;
      let message = '';

      switch (alert.condition) {
        case 'below':
          if (newPrice <= alert.targetPrice) {
            shouldTrigger = true;
            message = `${drugName} price dropped to ${newPrice} EGP (below your target of ${alert.targetPrice} EGP)`;
          }
          break;
        case 'above':
          if (newPrice >= alert.targetPrice) {
            shouldTrigger = true;
            message = `${drugName} price increased to ${newPrice} EGP (above your target of ${alert.targetPrice} EGP)`;
          }
          break;
        case 'change_percent':
          // This would require tracking previous prices
          // For now, just check if price changed significantly
          if (Math.abs(newPrice - alert.targetPrice) / alert.targetPrice * 100 >= alert.conditionValue) {
            shouldTrigger = true;
            message = `${drugName} price changed significantly to ${newPrice} EGP`;
          }
          break;
      }

      if (shouldTrigger) {
        await this.sendNotification({
          type: NotificationType.PRICE_ALERT,
          drugId,
          drugName,
          price: newPrice,
          message,
        });

        // Mark alert as triggered
        await this.updatePriceAlert(alert.id, { triggered: true });
      }
    }
  }

  // Get next scheduled time for a reminder
  private getNextScheduledTime(time: string, day: string): Date | null {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const now = new Date();
      const scheduledDate = new Date();
      
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Find the next occurrence of the specified day
      const dayMap: Record<string, number> = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
      };
      
      const targetDay = dayMap[day.toLowerCase()];
      const currentDay = now.getDay();
      
      let daysToAdd = (targetDay - currentDay + 7) % 7;
      if (daysToAdd === 0 && scheduledDate <= now) {
        daysToAdd = 7; // Next week
      }
      
      scheduledDate.setDate(now.getDate() + daysToAdd);
      
      return scheduledDate;
    } catch (error) {
      console.error('Error calculating scheduled time:', error);
      return null;
    }
  }

  // Reschedule reminder notifications
  private async rescheduleReminderNotifications(reminder: MedicationReminder): Promise<void> {
    // Cancel existing notifications for this reminder
    // This would require tracking notification IDs per reminder
    
    if (reminder.enabled) {
      // Schedule new notifications
      for (const day of reminder.days) {
        const scheduledTime = this.getNextScheduledTime(reminder.time, day);
        if (scheduledTime) {
          await this.scheduleNotification({
            type: NotificationType.MEDICATION_REMINDER,
            drugId: reminder.drugId,
            drugName: reminder.drugName,
            message: `Time to take ${reminder.drugName} - ${reminder.dosage}`,
            scheduledTime,
            recurring: true,
            recurringInterval: 'weekly',
          });
        }
      }
    }
  }

  // Get notification statistics
  async getNotificationStats() {
    const reminders = await this.getMedicationReminders();
    const alerts = await this.getPriceAlerts();
    const permissionStatus = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_STATUS);
    
    return {
      isInitialized: this.isInitialized,
      hasPermission: permissionStatus === 'true',
      deviceToken: this.deviceToken,
      totalReminders: reminders.length,
      activeReminders: reminders.filter(r => r.enabled).length,
      totalAlerts: alerts.length,
      activeAlerts: alerts.filter(a => a.enabled).length,
      triggeredAlerts: alerts.filter(a => a.triggered).length,
    };
  }
}

// React hook for notifications
export function useNotifications() {
  const [notificationService] = useState(() => NotificationService.getInstance());
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const initializeNotifications = async () => {
      const initialized = await notificationService.initialize();
      setIsInitialized(initialized);
      
      const notificationStats = await notificationService.getNotificationStats();
      setStats(notificationStats);
      setHasPermission(notificationStats.hasPermission);
    };

    initializeNotifications();
  }, [notificationService]);

  const addReminder = useCallback(async (reminder: Omit<MedicationReminder, 'id' | 'createdAt'>) => {
    const id = await notificationService.addMedicationReminder(reminder);
    const newStats = await notificationService.getNotificationStats();
    setStats(newStats);
    return id;
  }, [notificationService]);

  const addPriceAlert = useCallback(async (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>) => {
    const id = await notificationService.addPriceAlert(alert);
    const newStats = await notificationService.getNotificationStats();
    setStats(newStats);
    return id;
  }, [notificationService]);

  const sendNotification = useCallback(async (data: NotificationData) => {
    await notificationService.sendNotification(data);
  }, [notificationService]);

  return {
    isInitialized,
    hasPermission,
    stats,
    addReminder,
    addPriceAlert,
    sendNotification,
    getReminders: notificationService.getMedicationReminders.bind(notificationService),
    getPriceAlerts: notificationService.getPriceAlerts.bind(notificationService),
    updateReminder: notificationService.updateMedicationReminder.bind(notificationService),
    updatePriceAlert: notificationService.updatePriceAlert.bind(notificationService),
    deleteReminder: notificationService.deleteMedicationReminder.bind(notificationService),
    deletePriceAlert: notificationService.deletePriceAlert.bind(notificationService),
    checkPriceAlerts: notificationService.checkPriceAlerts.bind(notificationService),
  };
}

export default NotificationService;
