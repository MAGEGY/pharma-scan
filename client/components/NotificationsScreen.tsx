import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { useNotifications, NotificationType, MedicationReminder, PriceAlert } from '../services/notificationService';
import { EgyptianDrug } from '../../shared/schema';

interface NotificationsScreenProps {
  drugs: EgyptianDrug[];
}

export default function NotificationsScreen({ drugs }: NotificationsScreenProps) {
  const {
    isInitialized,
    hasPermission,
    stats,
    addReminder,
    addPriceAlert,
    getReminders,
    getPriceAlerts,
    updateReminder,
    updatePriceAlert,
    deleteReminder,
    deletePriceAlert,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'reminders' | 'alerts'>('reminders');
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<EgyptianDrug | null>(null);

  // Form states
  const [reminderForm, setReminderForm] = useState({
    dosage: '',
    time: '09:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  const [alertForm, setAlertForm] = useState({
    condition: 'below' as 'below' | 'above' | 'change_percent',
    targetPrice: '',
    conditionValue: '10',
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const [remindersData, alertsData] = await Promise.all([
      getReminders(),
      getPriceAlerts(),
    ]);
    setReminders(remindersData);
    setPriceAlerts(alertsData);
  };

  const requestNotificationPermission = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Notifications Required',
        'Please enable notifications to receive price alerts and medication reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Enable', onPress: () => Platform.OS === 'ios' ? Linking.openURL('app-settings:') : null },
        ]
      );
    }
  };

  const handleAddReminder = async () => {
    if (!selectedDrug || !reminderForm.dosage || !reminderForm.time) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addReminder({
        drugId: selectedDrug.id,
        drugName: selectedDrug.name,
        dosage: reminderForm.dosage,
        time: reminderForm.time,
        days: reminderForm.days,
        enabled: true,
      });

      setShowReminderModal(false);
      setSelectedDrug(null);
      setReminderForm({
        dosage: '',
        time: '09:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      });
      loadNotifications();
      
      Alert.alert('Success', 'Medication reminder added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication reminder');
    }
  };

  const handleAddPriceAlert = async () => {
    if (!selectedDrug || !alertForm.targetPrice) {
      Alert.alert('Error', 'Please select a drug and target price');
      return;
    }

    try {
      await addPriceAlert({
        drugId: selectedDrug.id,
        drugName: selectedDrug.name,
        targetPrice: parseFloat(alertForm.targetPrice),
        condition: alertForm.condition,
        conditionValue: parseFloat(alertForm.conditionValue),
        enabled: true,
      });

      setShowAlertModal(false);
      setSelectedDrug(null);
      setAlertForm({
        condition: 'below',
        targetPrice: '',
        conditionValue: '10',
      });
      loadNotifications();
      
      Alert.alert('Success', 'Price alert added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add price alert');
    }
  };

  const toggleReminder = async (reminder: MedicationReminder) => {
    await updateReminder(reminder.id, { enabled: !reminder.enabled });
    loadNotifications();
  };

  const toggleAlert = async (alert: PriceAlert) => {
    await updatePriceAlert(alert.id, { enabled: !alert.enabled });
    loadNotifications();
  };

  const removeReminder = async (reminder: MedicationReminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete the reminder for ${reminder.drugName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReminder(reminder.id);
            loadNotifications();
          },
        },
      ]
    );
  };

  const removeAlert = async (alert: PriceAlert) => {
    Alert.alert(
      'Delete Alert',
      `Are you sure you want to delete the price alert for ${alert.drugName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePriceAlert(alert.id);
            loadNotifications();
          },
        },
      ]
    );
  };

  const renderReminderItem = (reminder: MedicationReminder) => (
    <View key={reminder.id} style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.drugName}>{reminder.drugName}</Text>
          <Switch
            value={reminder.enabled}
            onValueChange={() => toggleReminder(reminder)}
          />
        </View>
        <Text style={styles.notificationDetail}>Dosage: {reminder.dosage}</Text>
        <Text style={styles.notificationDetail}>Time: {reminder.time}</Text>
        <Text style={styles.notificationDetail}>
          Days: {reminder.days.join(', ').charAt(0).toUpperCase() + reminder.days.join(', ').slice(1)}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeReminder(reminder)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAlertItem = (alert: PriceAlert) => (
    <View key={alert.id} style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.drugName}>{alert.drugName}</Text>
          <Switch
            value={alert.enabled}
            onValueChange={() => toggleAlert(alert)}
          />
        </View>
        <Text style={styles.notificationDetail}>
          Condition: {alert.condition === 'below' ? 'Below' : alert.condition === 'above' ? 'Above' : 'Change %'}
        </Text>
        <Text style={styles.notificationDetail}>
          Target: {alert.targetPrice} EGP
          {alert.condition === 'change_percent' && ` (${alert.conditionValue}%)`}
        </Text>
        {alert.triggered && (
          <Text style={styles.triggeredText}>✓ Triggered</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeAlert(alert)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {!hasPermission && (
          <TouchableOpacity style={styles.permissionButton} onPress={requestNotificationPermission}>
            <Text style={styles.permissionButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        )}
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {stats.activeReminders} Active Reminders • {stats.activeAlerts} Active Price Alerts
          </Text>
        </View>
      )}

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reminders' && styles.activeTab]}
          onPress={() => setActiveTab('reminders')}
        >
          <Text style={[styles.tabText, activeTab === 'reminders' && styles.activeTabText]}>
            Medication Reminders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'alerts' && styles.activeTab]}
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Price Alerts
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'reminders' ? (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowReminderModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Medication Reminder</Text>
            </TouchableOpacity>
            {reminders.map(renderReminderItem)}
            {reminders.length === 0 && (
              <Text style={styles.emptyText}>No medication reminders set</Text>
            )}
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAlertModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Price Alert</Text>
            </TouchableOpacity>
            {priceAlerts.map(renderAlertItem)}
            {priceAlerts.length === 0 && (
              <Text style={styles.emptyText}>No price alerts set</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Reminder Modal */}
      <Modal visible={showReminderModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Medication Reminder</Text>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Select Drug *</Text>
            <ScrollView style={styles.drugList} horizontal>
              {drugs.map((drug) => (
                <TouchableOpacity
                  key={drug.id}
                  style={[
                    styles.drugChip,
                    selectedDrug?.id === drug.id && styles.selectedDrugChip,
                  ]}
                  onPress={() => setSelectedDrug(drug)}
                >
                  <Text
                    style={[
                      styles.drugChipText,
                      selectedDrug?.id === drug.id && styles.selectedDrugChipText,
                    ]}
                  >
                    {drug.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              value={reminderForm.dosage}
              onChangeText={(text) => setReminderForm({ ...reminderForm, dosage: text })}
              placeholder="e.g., 1 tablet, 5ml"
            />

            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.input}
              value={reminderForm.time}
              onChangeText={(text) => setReminderForm({ ...reminderForm, time: text })}
              placeholder="09:00"
            />

            <Text style={styles.label}>Days</Text>
            {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => (
              <TouchableOpacity
                key={day}
                style={styles.dayItem}
                onPress={() => {
                  const days = reminderForm.days.includes(day)
                    ? reminderForm.days.filter((d) => d !== day)
                    : [...reminderForm.days, day];
                  setReminderForm({ ...reminderForm, days });
                }}
              >
                <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Switch
                  value={reminderForm.days.includes(day)}
                  onValueChange={() => {
                    const days = reminderForm.days.includes(day)
                      ? reminderForm.days.filter((d) => d !== day)
                      : [...reminderForm.days, day];
                    setReminderForm({ ...reminderForm, days });
                  }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowReminderModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddReminder}>
              <Text style={styles.saveButtonText}>Add Reminder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Price Alert Modal */}
      <Modal visible={showAlertModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Price Alert</Text>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.label}>Select Drug *</Text>
            <ScrollView style={styles.drugList} horizontal>
              {drugs.map((drug) => (
                <TouchableOpacity
                  key={drug.id}
                  style={[
                    styles.drugChip,
                    selectedDrug?.id === drug.id && styles.selectedDrugChip,
                  ]}
                  onPress={() => setSelectedDrug(drug)}
                >
                  <Text
                    style={[
                      styles.drugChipText,
                      selectedDrug?.id === drug.id && styles.selectedDrugChipText,
                    ]}
                  >
                    {drug.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Alert Condition</Text>
            <View style={styles.conditionButtons}>
              {(['below', 'above', 'change_percent'] as const).map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.conditionButton,
                    alertForm.condition === condition && styles.selectedConditionButton,
                  ]}
                  onPress={() => setAlertForm({ ...alertForm, condition })}
                >
                  <Text
                    style={[
                      styles.conditionButtonText,
                      alertForm.condition === condition && styles.selectedConditionButtonText,
                    ]}
                  >
                    {condition === 'below' ? 'Below Price' : condition === 'above' ? 'Above Price' : 'Change %'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Target Price (EGP) *</Text>
            <TextInput
              style={styles.input}
              value={alertForm.targetPrice}
              onChangeText={(text) => setAlertForm({ ...alertForm, targetPrice: text })}
              placeholder="100.00"
              keyboardType="numeric"
            />

            {alertForm.condition === 'change_percent' && (
              <>
                <Text style={styles.label}>Percentage Change (%)</Text>
                <TextInput
                  style={styles.input}
                  value={alertForm.conditionValue}
                  onChangeText={(text) => setAlertForm({ ...alertForm, conditionValue: text })}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAlertModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleAddPriceAlert}>
              <Text style={styles.saveButtonText}>Add Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  permissionButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  statsContainer: {
    backgroundColor: '#e8f4f8',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 8,
  },
  statsText: {
    textAlign: 'center',
    color: '#2c3e50',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  notificationItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  notificationDetail: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  triggeredText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 40,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    marginTop: 40,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 16,
  },
  drugList: {
    marginBottom: 16,
  },
  drugChip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  selectedDrugChip: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  drugChipText: {
    color: '#6c757d',
    fontSize: 14,
  },
  selectedDrugChipText: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  dayText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  conditionButtons: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  conditionButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  selectedConditionButton: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  conditionButtonText: {
    color: '#6c757d',
    fontWeight: '600',
  },
  selectedConditionButtonText: {
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#6c757d',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#27ae60',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
