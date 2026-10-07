import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ComprehensiveAnalysis from './ComprehensiveAnalysis';
import BackupSyncFeatures from './BackupSyncFeatures';

interface Allergy {
  id: string;
  allergenType: 'drug' | 'food' | 'environmental';
  allergenName: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

interface Prescription {
  id: string;
  drugId: number;
  drugName: string;
  dosage: string;
  frequency: string;
  duration?: string;
  prescribedBy?: string;
  prescribedDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

interface DrugInteraction {
  drug1Id: number;
  drug1Name: string;
  drug2Id: number;
  drug2Name: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  interactionType: string;
  description: string;
  recommendation?: string;
  evidenceLevel: 'theoretical' | 'limited' | 'moderate' | 'strong';
}

interface DosageCalculation {
  drugName: string;
  calculatedDose: number;
  unit: string;
  frequency: string;
  maxDailyDose?: number;
  notes: string;
  ageGroup: string;
  weightRange?: string;
}

interface UserSettings {
  id: string;
  enableDrugInteractionChecker: boolean;
  enableAllergyAlerts: boolean;
  enableDosageCalculator: boolean;
  preferredLanguage: string;
  preferredUnits: 'metric' | 'imperial';
  notificationsEnabled: boolean;
  darkMode: boolean;
}

const AdvancedFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'allergies' | 'prescriptions' | 'interactions' | 'dosage' | 'settings' | 'comprehensive' | 'backup-sync'>('allergies');
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
  const [dosageCalculations, setDosageCalculations] = useState<DosageCalculation[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAddAllergyModal, setShowAddAllergyModal] = useState(false);
  const [showAddPrescriptionModal, setShowAddPrescriptionModal] = useState(false);
  const [showDosageCalculatorModal, setShowDosageCalculatorModal] = useState(false);
  const [showInteractionCheckerModal, setShowInteractionCheckerModal] = useState(false);
  
  // Form states
  const [newAllergy, setNewAllergy] = useState<{
    allergenType: 'drug' | 'food' | 'environmental';
    allergenName: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
    notes: string;
  }>({
    allergenType: 'drug',
    allergenName: '',
    severity: 'mild',
    reaction: '',
    notes: '',
  });
  
  const [newPrescription, setNewPrescription] = useState({
    drugId: 0,
    drugName: '',
    dosage: '',
    frequency: '',
    duration: '',
    prescribedBy: '',
    notes: '',
  });
  
  const [dosageCalculation, setDosageCalculation] = useState({
    drugId: 0,
    age: 30,
    weight: 70,
    condition: '',
  });
  
  const [interactionDrugs, setInteractionDrugs] = useState<number[]>([]);
  const [availableDrugs, setAvailableDrugs] = useState<any[]>([]);
  const [selectedDrugsForInteraction, setSelectedDrugsForInteraction] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data
      await Promise.all([
        loadAllergies(),
        loadPrescriptions(),
        loadSettings(),
        loadAvailableDrugs(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllergies = async () => {
    try {
      const response = await fetch('/api/advanced/allergies', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAllergies(data.data);
      }
    } catch (error) {
      console.error('Error loading allergies:', error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await fetch('/api/advanced/prescriptions', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.data);
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/advanced/settings', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAvailableDrugs = async () => {
    try {
      const response = await fetch('/api/drugs', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAvailableDrugs(data.data);
      }
    } catch (error) {
      console.error('Error loading available drugs:', error);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    // This should get the auth token from secure storage
    // For now, return empty string - in production, use AsyncStorage or Keychain
    try {
      // const token = await AsyncStorage.getItem('authToken');
      // return token || '';
      return '';
    } catch (error) {
      console.error('Error getting auth token:', error);
      return '';
    }
  };

  const addAllergy = async () => {
    if (!newAllergy.allergenName.trim()) {
      Alert.alert('Error', 'Please enter an allergen name');
      return;
    }

    try {
      const response = await fetch('/api/advanced/allergies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(newAllergy),
      });

      const data = await response.json();
      if (data.success) {
        setAllergies([...allergies, data.data]);
        setShowAddAllergyModal(false);
        setNewAllergy({
          allergenType: 'drug',
          allergenName: '',
          severity: 'mild',
          reaction: '',
          notes: '',
        });
        Alert.alert('Success', 'Allergy added successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to add allergy');
      }
    } catch (error) {
      console.error('Error adding allergy:', error);
      Alert.alert('Error', 'Failed to add allergy');
    }
  };

  const addPrescription = async () => {
    if (!newPrescription.drugName.trim() || !newPrescription.dosage.trim() || !newPrescription.frequency.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/advanced/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(newPrescription),
      });

      const data = await response.json();
      if (data.success) {
        setPrescriptions([...prescriptions, data.data]);
        setShowAddPrescriptionModal(false);
        setNewPrescription({
          drugId: 0,
          drugName: '',
          dosage: '',
          frequency: '',
          duration: '',
          prescribedBy: '',
          notes: '',
        });
        Alert.alert('Success', 'Prescription added successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to add prescription');
      }
    } catch (error) {
      console.error('Error adding prescription:', error);
      Alert.alert('Error', 'Failed to add prescription');
    }
  };

  const calculateDosage = async () => {
    if (dosageCalculation.drugId === 0 || dosageCalculation.age <= 0 || dosageCalculation.weight <= 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/advanced/dosage/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(dosageCalculation),
      });

      const data = await response.json();
      if (data.success) {
        setDosageCalculations([...dosageCalculations, data.data]);
        setShowDosageCalculatorModal(false);
        Alert.alert('Success', 'Dosage calculated successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to calculate dosage');
      }
    } catch (error) {
      console.error('Error calculating dosage:', error);
      Alert.alert('Error', 'Failed to calculate dosage');
    }
  };

  const checkInteractions = async () => {
    if (interactionDrugs.length < 2) {
      Alert.alert('Error', 'Please select at least 2 drugs to check for interactions');
      return;
    }

    try {
      const response = await fetch('/api/advanced/interactions/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ drugIds: interactionDrugs }),
      });

      const data = await response.json();
      if (data.success) {
        setInteractions(data.data);
        setShowInteractionCheckerModal(false);
        Alert.alert('Success', `Found ${data.data.length} interaction(s)`);
      } else {
        Alert.alert('Error', data.error || 'Failed to check interactions');
      }
    } catch (error) {
      console.error('Error checking interactions:', error);
      Alert.alert('Error', 'Failed to check interactions');
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/advanced/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(newSettings),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        Alert.alert('Success', 'Settings updated successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const deleteAllergy = async (allergyId: string) => {
    try {
      const response = await fetch(`/api/advanced/allergies/${allergyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setAllergies(allergies.filter(a => a.id !== allergyId));
        Alert.alert('Success', 'Allergy deleted successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to delete allergy');
      }
    } catch (error) {
      console.error('Error deleting allergy:', error);
      Alert.alert('Error', 'Failed to delete allergy');
    }
  };

  const deletePrescription = async (prescriptionId: string) => {
    try {
      const response = await fetch(`/api/advanced/prescriptions/${prescriptionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId));
        Alert.alert('Success', 'Prescription deleted successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to delete prescription');
      }
    } catch (error) {
      console.error('Error deleting prescription:', error);
      Alert.alert('Error', 'Failed to delete prescription');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
      case 'minor':
        return '#4CAF50';
      case 'moderate':
        return '#FF9800';
      case 'severe':
      case 'major':
        return '#F44336';
      case 'contraindicated':
        return '#D32F2F';
      default:
        return '#757575';
    }
  };

  const renderAllergyItem = (item: Allergy) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.allergenName}</Text>
        <TouchableOpacity onPress={() => deleteAllergy(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemType}>{item.allergenType}</Text>
        <Text style={[styles.itemSeverity, { color: getSeverityColor(item.severity) }]}>
          {item.severity}
        </Text>
      </View>
      {item.reaction && <Text style={styles.itemDescription}>{item.reaction}</Text>}
      {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
    </View>
  );

  const renderPrescriptionItem = (item: Prescription) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{item.drugName}</Text>
        <TouchableOpacity onPress={() => deletePrescription(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemType}>{item.dosage}</Text>
        <Text style={styles.itemFrequency}>{item.frequency}</Text>
      </View>
      {item.duration && <Text style={styles.itemDescription}>Duration: {item.duration}</Text>}
      {item.prescribedBy && <Text style={styles.itemDescription}>Prescribed by: {item.prescribedBy}</Text>}
      {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
    </View>
  );

  const renderInteractionItem = (item: DrugInteraction) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.drug1Name} + {item.drug2Name}</Text>
      <Text style={[styles.itemSeverity, { color: getSeverityColor(item.severity) }]}>
        {item.severity}
      </Text>
      <Text style={styles.itemDescription}>{item.description}</Text>
      {item.recommendation && <Text style={styles.itemNotes}>{item.recommendation}</Text>}
      <Text style={styles.itemType}>Evidence: {item.evidenceLevel}</Text>
    </View>
  );

  const renderDosageItem = (item: DosageCalculation) => (
    <View style={styles.itemCard}>
      <Text style={styles.itemTitle}>{item.drugName}</Text>
      <Text style={styles.itemDescription}>
        Dose: {item.calculatedDose} {item.unit}
      </Text>
      <Text style={styles.itemFrequency}>{item.frequency}</Text>
      {item.maxDailyDose && (
        <Text style={styles.itemDescription}>Max daily: {item.maxDailyDose} {item.unit}</Text>
      )}
      <Text style={styles.itemType}>Age group: {item.ageGroup}</Text>
      <Text style={styles.itemNotes}>{item.notes}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {(['allergies', 'prescriptions', 'interactions', 'dosage', 'settings', 'comprehensive', 'backup-sync'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'comprehensive' && (
          <ComprehensiveAnalysis />
        )}

        {activeTab === 'backup-sync' && (
          <BackupSyncFeatures />
        )}

        {activeTab === 'allergies' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddAllergyModal(true)}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Allergy</Text>
            </TouchableOpacity>
            <FlatList
              data={allergies}
              renderItem={({ item }) => renderAllergyItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'prescriptions' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddPrescriptionModal(true)}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add Prescription</Text>
            </TouchableOpacity>
            <FlatList
              data={prescriptions}
              renderItem={({ item }) => renderPrescriptionItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'interactions' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowInteractionCheckerModal(true)}
            >
              <Ionicons name="search" size={24} color="white" />
              <Text style={styles.addButtonText}>Check Interactions</Text>
            </TouchableOpacity>
            <FlatList
              data={interactions}
              renderItem={({ item }) => renderInteractionItem(item)}
              keyExtractor={(item, index) => `${item.drug1Id}-${item.drug2Id}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'dosage' && (
          <View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowDosageCalculatorModal(true)}
            >
              <Ionicons name="calculator" size={24} color="white" />
              <Text style={styles.addButtonText}>Calculate Dosage</Text>
            </TouchableOpacity>
            <FlatList
              data={dosageCalculations}
              renderItem={({ item }) => renderDosageItem(item)}
              keyExtractor={(item, index) => `${item.drugName}-${index}`}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'settings' && settings && (
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Drug Interaction Checker</Text>
              <TouchableOpacity
                style={[styles.toggle, settings.enableDrugInteractionChecker && styles.toggleOn]}
                onPress={() => updateSettings({ enableDrugInteractionChecker: !settings.enableDrugInteractionChecker })}
              >
                <View style={[styles.toggleKnob, settings.enableDrugInteractionChecker && styles.toggleKnobOn]} />
              </TouchableOpacity>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Allergy Alerts</Text>
              <TouchableOpacity
                style={[styles.toggle, settings.enableAllergyAlerts && styles.toggleOn]}
                onPress={() => updateSettings({ enableAllergyAlerts: !settings.enableAllergyAlerts })}
              >
                <View style={[styles.toggleKnob, settings.enableAllergyAlerts && styles.toggleKnobOn]} />
              </TouchableOpacity>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Dosage Calculator</Text>
              <TouchableOpacity
                style={[styles.toggle, settings.enableDosageCalculator && styles.toggleOn]}
                onPress={() => updateSettings({ enableDosageCalculator: !settings.enableDosageCalculator })}
              >
                <View style={[styles.toggleKnob, settings.enableDosageCalculator && styles.toggleKnobOn]} />
              </TouchableOpacity>
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <TouchableOpacity
                style={[styles.toggle, settings.notificationsEnabled && styles.toggleOn]}
                onPress={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              >
                <View style={[styles.toggleKnob, settings.notificationsEnabled && styles.toggleKnobOn]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Allergy Modal */}
      <Modal visible={showAddAllergyModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Allergy</Text>
          
          <Text style={styles.label}>Allergen Type</Text>
          <View style={styles.pickerContainer}>
            {(['drug', 'food', 'environmental'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, newAllergy.allergenType === type && styles.pickerOptionSelected]}
                onPress={() => setNewAllergy({ ...newAllergy, allergenType: type })}
              >
                <Text style={styles.pickerOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Allergen Name</Text>
          <TextInput
            style={styles.input}
            value={newAllergy.allergenName}
            onChangeText={(text) => setNewAllergy({ ...newAllergy, allergenName: text })}
            placeholder="Enter allergen name"
          />

          <Text style={styles.label}>Severity</Text>
          <View style={styles.pickerContainer}>
            {(['mild', 'moderate', 'severe'] as const).map(severity => (
              <TouchableOpacity
                key={severity}
                style={[styles.pickerOption, newAllergy.severity === severity && styles.pickerOptionSelected]}
                onPress={() => setNewAllergy({ ...newAllergy, severity })}
              >
                <Text style={styles.pickerOptionText}>{severity}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Reaction</Text>
          <TextInput
            style={styles.input}
            value={newAllergy.reaction}
            onChangeText={(text) => setNewAllergy({ ...newAllergy, reaction: text })}
            placeholder="Describe the reaction"
            multiline
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            value={newAllergy.notes}
            onChangeText={(text) => setNewAllergy({ ...newAllergy, notes: text })}
            placeholder="Additional notes"
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddAllergyModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addAllergy}>
              <Text style={styles.saveButtonText}>Add Allergy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Prescription Modal */}
      <Modal visible={showAddPrescriptionModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add Prescription</Text>
          
          <Text style={styles.label}>Drug Name</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.drugName}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, drugName: text })}
            placeholder="Enter drug name"
          />

          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.dosage}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, dosage: text })}
            placeholder="e.g., 500mg"
          />

          <Text style={styles.label}>Frequency</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.frequency}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, frequency: text })}
            placeholder="e.g., twice daily"
          />

          <Text style={styles.label}>Duration</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.duration}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, duration: text })}
            placeholder="e.g., 7 days"
          />

          <Text style={styles.label}>Prescribed By</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.prescribedBy}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, prescribedBy: text })}
            placeholder="Doctor's name"
          />

          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={styles.input}
            value={newPrescription.notes}
            onChangeText={(text) => setNewPrescription({ ...newPrescription, notes: text })}
            placeholder="Additional notes"
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddPrescriptionModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={addPrescription}>
              <Text style={styles.saveButtonText}>Add Prescription</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dosage Calculator Modal */}
      <Modal visible={showDosageCalculatorModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Calculate Dosage</Text>
          
          <Text style={styles.label}>Drug ID</Text>
          <TextInput
            style={styles.input}
            value={dosageCalculation.drugId.toString()}
            onChangeText={(text) => setDosageCalculation({ ...dosageCalculation, drugId: parseInt(text) || 0 })}
            placeholder="Enter drug ID"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={dosageCalculation.age.toString()}
            onChangeText={(text) => setDosageCalculation({ ...dosageCalculation, age: parseInt(text) || 0 })}
            placeholder="Enter age"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={dosageCalculation.weight.toString()}
            onChangeText={(text) => setDosageCalculation({ ...dosageCalculation, weight: parseFloat(text) || 0 })}
            placeholder="Enter weight in kg"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Condition (optional)</Text>
          <TextInput
            style={styles.input}
            value={dosageCalculation.condition}
            onChangeText={(text) => setDosageCalculation({ ...dosageCalculation, condition: text })}
            placeholder="Specific condition or indication"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDosageCalculatorModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={calculateDosage}>
              <Text style={styles.saveButtonText}>Calculate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interaction Checker Modal */}
      <Modal visible={showInteractionCheckerModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Check Drug Interactions</Text>
          
          <Text style={styles.label}>Drug IDs (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={interactionDrugs.join(',')}
            onChangeText={(text) => setInteractionDrugs(text.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)))}
            placeholder="e.g., 1, 2, 3"
            keyboardType="numeric"
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowInteractionCheckerModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={checkInteractions}>
              <Text style={styles.saveButtonText}>Check Interactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 14,
    color: '#666',
    marginRight: 16,
  },
  itemSeverity: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemFrequency: {
    fontSize: 14,
    color: '#666',
  },
  itemDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  itemNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: 15,
    justifyContent: 'center',
  },
  toggleOn: {
    backgroundColor: '#007AFF',
  },
  toggleKnob: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
    position: 'absolute',
    left: 2,
  },
  toggleKnobOn: {
    left: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  pickerOption: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdvancedFeatures;
