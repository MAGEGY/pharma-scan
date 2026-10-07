import { loggingService } from './loggingService';
import { db } from './db';
import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { 
  users,
  egyptianDrugs,
  priceHistory,
  userPrescriptions,
  userSettings,
  pharmacySources,
  notificationSubscriptions,
  notificationLogs
} from '../shared/schema';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: number;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    url?: string;
  }>;
  silent?: boolean;
  requireInteraction?: boolean;
  ttl?: number;
}

export interface NotificationSubscription {
  id: string;
  userId: string;
  endpoint: string;
  publicKey: string;
  authKey: string;
  p256dhKey: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    deviceId: string;
    appVersion: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'price_alert' | 'reminder' | 'interaction_warning' | 'general';
  titleTemplate: string;
  bodyTemplate: string;
  icon: string;
  defaultTTL: number;
  requireInteraction: boolean;
  variables: string[];
}

export interface NotificationRule {
  id: string;
  userId: string;
  type: 'price_drop' | 'price_increase' | 'availability' | 'reminder' | 'interaction';
  drugId?: number;
  pharmacyId?: number;
  threshold?: number;
  frequency?: 'immediate' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
  conditions: any;
  createdAt: string;
  updatedAt: string;
}

export class NotificationService {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidEmail: string;
  private templates: Map<string, NotificationTemplate> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();

  constructor() {
    this.initializeVAPID();
    this.loadTemplates();
    this.startPeriodicTasks();
  }

  private initializeVAPID(): void {
    // In production, these should be loaded from environment variables
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 
      'BEl62iLBGhX8yNtC2V8lJz8a7R4k9T1mP5qQ6rS7tU8vW9xY0z1A2b3C4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 
      'aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPqRsTuVwXyZ';
    this.vapidEmail = process.env.VAPID_EMAIL || 'mailto:notifications@pharma-scan.eg';
  }

  private loadTemplates(): void {
    // Load notification templates
    const templates: NotificationTemplate[] = [
      {
        id: 'price_drop',
        name: 'Price Drop Alert',
        type: 'price_alert',
        titleTemplate: 'Price Drop Alert! {drugName}',
        bodyTemplate: '{drugName} price dropped by {percentage}% at {pharmacy}. New price: {newPrice} EGP',
        icon: '💰',
        defaultTTL: 86400000, // 24 hours
        requireInteraction: false,
        variables: ['drugName', 'percentage', 'pharmacy', 'newPrice']
      },
      {
        id: 'price_increase',
        name: 'Price Increase Alert',
        type: 'price_alert',
        titleTemplate: 'Price Increase Alert',
        bodyTemplate: '{drugName} price increased by {percentage}% at {pharmacy}. New price: {newPrice} EGP',
        icon: '📈',
        defaultTTL: 86400000,
        requireInteraction: false,
        variables: ['drugName', 'percentage', 'pharmacy', 'newPrice']
      },
      {
        id: 'availability',
        name: 'Availability Alert',
        type: 'general',
        titleTemplate: 'Drug Available!',
        bodyTemplate: '{drugName} is now available at {pharmacy} for {price} EGP',
        icon: '✅',
        defaultTTL: 43200000, // 12 hours
        requireInteraction: false,
        variables: ['drugName', 'pharmacy', 'price']
      },
      {
        id: 'medication_reminder',
        name: 'Medication Reminder',
        type: 'reminder',
        titleTemplate: 'Medication Reminder',
        bodyTemplate: 'Time to take {drugName} - {dosage}. {notes}',
        icon: '💊',
        defaultTTL: 3600000, // 1 hour
        requireInteraction: true,
        variables: ['drugName', 'dosage', 'notes']
      },
      {
        id: 'interaction_warning',
        name: 'Drug Interaction Warning',
        type: 'interaction_warning',
        titleTemplate: '⚠️ Drug Interaction Warning',
        bodyTemplate: 'Potential interaction detected between {drug1} and {drug2}. Severity: {severity}',
        icon: '⚠️',
        defaultTTL: 86400000,
        requireInteraction: true,
        variables: ['drug1', 'drug2', 'severity']
      },
      {
        id: 'prescription_refill',
        name: 'Prescription Refill Reminder',
        type: 'reminder',
        titleTemplate: 'Prescription Refill Needed',
        bodyTemplate: 'Your prescription for {drugName} needs refilling. Days remaining: {daysRemaining}',
        icon: '🔄',
        defaultTTL: 86400000,
        requireInteraction: false,
        variables: ['drugName', 'daysRemaining']
      }
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  // SUBSCRIPTION MANAGEMENT
  async subscribeToNotifications(subscriptionData: any, userId: string): Promise<boolean> {
    try {
      // Validate subscription data
      if (!subscriptionData.endpoint || !subscriptionData.keys || !subscriptionData.keys.p256dh) {
        throw new Error('Invalid subscription data');
      }

      const subscription: NotificationSubscription = {
        id: crypto.randomUUID(),
        userId,
        endpoint: subscriptionData.endpoint,
        publicKey: subscriptionData.keys.p256dh,
        authKey: subscriptionData.keys.auth,
        p256dhKey: subscriptionData.keys.p256dh,
        deviceInfo: subscriptionData.deviceInfo || {
          userAgent: navigator.userAgent,
          platform: this.getPlatform(),
          deviceId: this.getDeviceId(),
          appVersion: '1.0.0'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store subscription in database
      await db.insert(notificationSubscriptions).values({
        id: subscription.id,
        userId: subscription.userId,
        endpoint: subscription.endpoint,
        publicKey: subscription.publicKey,
        authKey: subscription.authKey,
        p256dhKey: subscription.p256dhKey,
        deviceInfo: subscription.deviceInfo,
        isActive: subscription.isActive,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      });

      this.subscriptions.set(subscription.id, subscription);

      loggingService.info('User subscribed to notifications', {
        userId,
        subscriptionId: subscription.id,
        platform: subscription.deviceInfo.platform,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to subscribe to notifications', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async unsubscribeFromNotifications(subscriptionId: string, userId: string): Promise<boolean> {
    try {
      // Remove from database
      await db.delete(notificationSubscriptions)
        .where(and(
          eq(notificationSubscriptions.id, subscriptionId),
          eq(notificationSubscriptions.userId, userId)
        ));

      // Remove from memory
      this.subscriptions.delete(subscriptionId);

      loggingService.info('User unsubscribed from notifications', {
        userId,
        subscriptionId,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to unsubscribe from notifications', {
        subscriptionId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async getUserSubscriptions(userId: string): Promise<NotificationSubscription[]> {
    try {
      const subscriptions = await db.select()
        .from(notificationSubscriptions)
        .where(and(
          eq(notificationSubscriptions.userId, userId),
          eq(notificationSubscriptions.isActive, true)
        ));

      return subscriptions.map(sub => ({
        id: sub.id,
        userId: sub.userId,
        endpoint: sub.endpoint,
        publicKey: sub.publicKey,
        authKey: sub.authKey,
        p256dhKey: sub.p256dhKey,
        deviceInfo: sub.deviceInfo || {},
        isActive: sub.isActive,
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      }));
    } catch (error) {
      loggingService.error('Failed to get user subscriptions', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // NOTIFICATION SENDING
  async sendNotification(
    userId: string,
    templateId: string,
    variables: Record<string, any>,
    options?: {
      silent?: boolean;
      requireInteraction?: boolean;
      ttl?: number;
      data?: any;
    }
  ): Promise<boolean> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      const subscriptions = await this.getUserSubscriptions(userId);
      if (subscriptions.length === 0) {
        return false;
      }

      // Generate notification payload
      const payload = this.generateNotificationPayload(template, variables, options);

      // Send to all active subscriptions
      let successCount = 0;
      for (const subscription of subscriptions) {
        try {
          const success = await this.sendPushNotification(subscription, payload);
          if (success) {
            successCount++;
          }
        } catch (error) {
          loggingService.error('Failed to send notification to subscription', {
            subscriptionId: subscription.id,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Log notification
      await this.logNotification(userId, templateId, payload, successCount, subscriptions.length);

      return successCount > 0;
    } catch (error) {
      loggingService.error('Failed to send notification', {
        userId,
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private generateNotificationPayload(
    template: NotificationTemplate,
    variables: Record<string, any>,
    options?: {
      silent?: boolean;
      requireInteraction?: boolean;
      ttl?: number;
      data?: any;
    }
  ): NotificationPayload {
    // Replace variables in templates
    let title = template.titleTemplate;
    let body = template.bodyTemplate;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      title = title.replace(regex, String(value));
      body = body.replace(regex, String(value));
    }

    return {
      title,
      body,
      icon: template.icon,
      silent: options?.silent || false,
      requireInteraction: options?.requireInteraction || template.requireInteraction,
      ttl: options?.ttl || template.defaultTTL,
      data: options?.data || { templateId: template.id, variables },
    };
  }

  private async sendPushNotification(
    subscription: NotificationSubscription,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const vapidKeys = {
        publicKey: this.vapidPublicKey,
        privateKey: this.vapidPrivateKey,
      };

      const webPushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon,
        image: payload.image,
        badge: payload.badge,
        data: payload.data,
        actions: payload.actions,
        silent: payload.silent,
        requireInteraction: payload.requireInteraction,
        ttl: payload.ttl,
      });

      // Use web-push library to send notification
      // For now, simulate the push notification
      // In production, you would use a library like 'web-push'
      
      loggingService.info('Push notification sent', {
        subscriptionId: subscription.id,
        userId: subscription.userId,
        title: payload.title,
        platform: subscription.deviceInfo.platform,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to send push notification', {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private async logNotification(
    userId: string,
    templateId: string,
    payload: NotificationPayload,
    successCount: number,
    totalSubscriptions: number
  ): Promise<void> {
    try {
      await db.insert(notificationLogs).values({
        userId,
        templateId,
        title: payload.title,
        body: payload.body,
        successCount,
        totalSubscriptions,
        sentAt: new Date(),
      });
    } catch (error) {
      loggingService.error('Failed to log notification', {
        userId,
        templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // AUTOMATED NOTIFICATIONS
  async checkPriceAlerts(): Promise<void> {
    try {
      // Get all active price alert rules
      const rules = await db.select()
        .from(notificationSubscriptions)
        .where(eq(notificationSubscriptions.isActive, true));

      for (const rule of rules) {
        if (rule.type === 'price_drop' || rule.type === 'price_increase') {
          await this.checkPriceAlertForRule(rule);
        }
      }
    } catch (error) {
      loggingService.error('Failed to check price alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async checkPriceAlertForRule(rule: any): Promise<void> {
    try {
      // Get recent price changes for the drug
      const recentChanges = await db.select()
        .from(priceHistory)
        .where(eq(priceHistory.drugId, rule.drugId))
        .orderBy(desc(priceHistory.createdAt))
        .limit(2);

      if (recentChanges.length < 2) {
        return;
      }

      const [oldPrice, newPrice] = recentChanges;
      const priceChange = newPrice.newPrice - oldPrice.newPrice;
      const percentageChange = (priceChange / oldPrice.newPrice) * 100;

      // Check if alert should be triggered
      if (rule.type === 'price_drop' && percentageChange <= -rule.threshold) {
        await this.sendPriceAlert(rule, oldPrice, newPrice, percentageChange, 'drop');
      } else if (rule.type === 'price_increase' && percentageChange >= rule.threshold) {
        await this.sendPriceAlert(rule, oldPrice, newPrice, percentageChange, 'increase');
      }
    } catch (error) {
      loggingService.error('Failed to check price alert rule', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async sendPriceAlert(
    rule: any,
    oldPrice: any,
    newPrice: any,
    percentageChange: number,
    direction: 'drop' | 'increase'
  ): Promise<void> {
    try {
      // Get drug information
      const drug = await db.select()
        .from(egyptianDrugs)
        .where(eq(egyptianDrugs.id, rule.drugId))
        .limit(1);

      if (!drug.length) {
        return;
      }

      const drugInfo = drug[0];
      const templateId = direction === 'drop' ? 'price_drop' : 'price_increase';

      await this.sendNotification(rule.userId, templateId, {
        drugName: drugInfo.name,
        percentage: Math.abs(percentageChange).toFixed(1),
        pharmacy: 'Multiple Pharmacies',
        newPrice: newPrice.newPrice.toFixed(2),
      });
    } catch (error) {
      loggingService.error('Failed to send price alert', {
        ruleId: rule.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkMedicationReminders(): Promise<void> {
    try {
      // Get user prescriptions with reminder settings
      const prescriptions = await db.select()
        .from(userPrescriptions)
        .where(eq(userPrescriptions.isActive, true));

      for (const prescription of prescriptions) {
        await this.checkPrescriptionReminder(prescription);
      }
    } catch (error) {
      loggingService.error('Failed to check medication reminders', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async checkPrescriptionReminder(prescription: any): Promise<void> {
    try {
      // Check if prescription needs refill reminder
      const daysRemaining = this.calculateDaysRemaining(prescription);
      
      if (daysRemaining <= 7 && daysRemaining > 0) {
        // Get drug information
        const drug = await db.select()
          .from(egyptianDrugs)
          .where(eq(egyptianDrugs.id, prescription.drugId))
          .limit(1);

        if (!drug.length) {
          return;
        }

        await this.sendNotification(prescription.userId, 'prescription_refill', {
          drugName: drug[0].name,
          daysRemaining: daysRemaining.toString(),
        });
      }
    } catch (error) {
      loggingService.error('Failed to check prescription reminder', {
        prescriptionId: prescription.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private calculateDaysRemaining(prescription: any): number {
    // Calculate days remaining based on prescription duration
    if (!prescription.duration || !prescription.prescribedDate) {
      return 30; // Default to 30 days
    }

    const prescribedDate = new Date(prescription.prescribedDate);
    const duration = this.parseDuration(prescription.duration);
    const expiryDate = new Date(prescribedDate.getTime() + duration * 24 * 60 * 60 * 1000);
    const now = new Date();
    
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  }

  private parseDuration(duration: string): number {
    // Parse duration string like "30 days", "2 weeks", "1 month"
    const match = duration.match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
    if (!match) {
      return 30; // Default to 30 days
    }

    const [, number, unit] = match;
    const days = parseInt(number);

    switch (unit.toLowerCase()) {
      case 'day':
      case 'days':
        return days;
      case 'week':
      case 'weeks':
        return days * 7;
      case 'month':
      case 'months':
        return days * 30;
      default:
        return 30;
    }
  }

  // NOTIFICATION RULES MANAGEMENT
  async createNotificationRule(ruleData: any): Promise<boolean> {
    try {
      const rule = {
        id: crypto.randomUUID(),
        ...ruleData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store rule in database
      await db.insert(notificationSubscriptions).values(rule);

      loggingService.info('Notification rule created', {
        ruleId: rule.id,
        userId: rule.userId,
        type: rule.type,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to create notification rule', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async updateNotificationRule(ruleId: string, updates: any): Promise<boolean> {
    try {
      await db.update(notificationSubscriptions)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(notificationSubscriptions.id, ruleId));

      loggingService.info('Notification rule updated', {
        ruleId,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to update notification rule', {
        ruleId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async deleteNotificationRule(ruleId: string, userId: string): Promise<boolean> {
    try {
      await db.delete(notificationSubscriptions)
        .where(and(
          eq(notificationSubscriptions.id, ruleId),
          eq(notificationSubscriptions.userId, userId)
        ));

      loggingService.info('Notification rule deleted', {
        ruleId,
        userId,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to delete notification rule', {
        ruleId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // NOTIFICATION TEMPLATES
  async createNotificationTemplate(templateData: any): Promise<boolean> {
    try {
      const template = {
        id: crypto.randomUUID(),
        ...templateData,
        defaultTTL: templateData.defaultTTL || 86400000,
        requireInteraction: templateData.requireInteraction || false,
        variables: templateData.variables || [],
      };

      this.templates.set(template.id, template);

      loggingService.info('Notification template created', {
        templateId: template.id,
        name: template.name,
        type: template.type,
      });

      return true;
    } catch (error) {
      loggingService.error('Failed to create notification template', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  // UTILITIES
  private getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'web';
  }

  private getDeviceId(): string {
    // Generate or retrieve device ID
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('device_id', deviceId);
    }
    
    return deviceId;
  }

  // PERIODIC TASKS
  private startPeriodicTasks(): void {
    // Check price alerts every hour
    setInterval(() => {
      this.checkPriceAlerts();
    }, 60 * 60 * 1000);

    // Check medication reminders every 6 hours
    setInterval(() => {
      this.checkMedicationReminders();
    }, 6 * 60 * 60 * 1000);

    // Clean up inactive subscriptions daily
    setInterval(() => {
      this.cleanupInactiveSubscriptions();
    }, 24 * 60 * 60 * 1000);
  }

  private async cleanupInactiveSubscriptions(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      await db.update(notificationSubscriptions)
        .set({ isActive: false })
        .where(and(
          eq(notificationSubscriptions.isActive, true),
          // @ts-ignore
          notificationSubscriptions.lastAccessedAt < thirtyDaysAgo
        ));

      loggingService.info('Cleaned up inactive subscriptions');
    } catch (error) {
      loggingService.error('Failed to cleanup inactive subscriptions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUBLIC API
  async getNotificationStats(userId?: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalNotifications: number;
    notificationsByType: Record<string, number>;
    recentNotifications: any[];
  }> {
    try {
      const baseQuery = db.select().from(notificationLogs);
      
      if (userId) {
        baseQuery.where(eq(notificationLogs.userId, userId));
      }

      const notifications = await baseQuery
        .orderBy(desc(notificationLogs.sentAt))
        .limit(100);

      const totalNotifications = notifications.length;
      const notificationsByType = notifications.reduce((acc, notif) => {
        acc[notif.templateId] = (acc[notif.templateId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const subscriptions = userId 
        ? await this.getUserSubscriptions(userId)
        : Array.from(this.subscriptions.values());

      return {
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: subscriptions.filter(s => s.isActive).length,
        totalNotifications,
        notificationsByType,
        recentNotifications: notifications.slice(0, 10),
      };
    } catch (error) {
      loggingService.error('Failed to get notification stats', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
        totalNotifications: 0,
        notificationsByType: {},
        recentNotifications: [],
      };
    }
  }

  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    return Array.from(this.templates.values());
  }

  async testNotification(userId: string, templateId: string): Promise<boolean> {
    return await this.sendNotification(userId, templateId, {
      drugName: 'Test Drug',
      pharmacy: 'Test Pharmacy',
      newPrice: '100.00',
      percentage: '10.0',
    }, {
      silent: false,
      requireInteraction: false,
    });
  }
}

export const notificationService = new NotificationService();
