import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Drug {
  id: number;
  name: string;
  nameArabic?: string;
  activeIngredient?: string;
}

interface AllergyAlert {
  allergenName: string;
  allergenType: 'drug' | 'food' | 'environmental';
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  recommendation: string;
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

interface ComprehensiveAnalysisResult {
  interactions: DrugInteraction[];
  allergyAlerts: AllergyAlert[];
  dosageRecommendations: DosageCalculation[];
}

interface UserProfile {
  age: number;
  weight: number;
  height?: number;
  gender?: 'male' | 'female' | 'other';
  medicalConditions?: string[];
}

const ComprehensiveAnalysis: React.FC = () => {
  const [selectedDrugs, setSelectedDrugs] = useState<Drug[]>([]);
  const [availableDrugs, setAvailableDrugs] = useState<Drug[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: 30,
    weight: 70,
    height: 170,
    gender: 'male',
    medicalConditions: [],
  });
  
  const [analysisResults, setAnalysisResults] = useState<ComprehensiveAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDrugSelector, setShowDrugSelector] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAvailableDrugs();
  }, []);

  const loadAvailableDrugs = async () => {
    try {
      const response = await fetch('/api/drugs');
      const data = await response.json();
      if (data.success) {
        setAvailableDrugs(data.data);
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    // This should get the auth token from secure storage
    return '';
  };

  const performComprehensiveAnalysis = async () => {
    if (selectedDrugs.length < 1) {
      Alert.alert('Error', 'Please select at least one drug for analysis');
      return;
    }

    setLoading(true);
    try {
      const drugIds = selectedDrugs.map(drug => drug.id);
      const response = await fetch('/api/advanced/comprehensive-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ 
          drugIds,
          userProfile: {
            age: userProfile.age,
            weight: userProfile.weight,
            gender: userProfile.gender,
            medicalConditions: userProfile.medicalConditions,
          }
        }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResults(data.data);
        Alert.alert('Analysis Complete', `Found ${data.data.interactions.length} interaction(s) and ${data.data.allergyAlerts.length} allergy alert(s)`);
      } else {
        Alert.alert('Error', data.error || 'Failed to perform analysis');
      }
    } catch (error) {
      console.error('Error performing analysis:', error);
      Alert.alert('Error', 'Failed to perform analysis');
    } finally {
      setLoading(false);
    }
  };

  const addDrugToSelection = (drug: Drug) => {
    if (!selectedDrugs.find(d => d.id === drug.id)) {
      setSelectedDrugs([...selectedDrugs, drug]);
    }
    setShowDrugSelector(false);
    setSearchQuery('');
  };

  const removeDrugFromSelection = (drugId: number) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
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

  const getFilteredDrugs = () => {
    if (!searchQuery) return availableDrugs;
    return availableDrugs.filter(drug => 
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.nameArabic?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const renderSelectedDrug = (drug: Drug) => (
    <View style={styles.selectedDrugCard}>
      <View style={styles.selectedDrugInfo}>
        <Text style={styles.selectedDrugName}>{drug.name}</Text>
        {drug.activeIngredient && (
          <Text style={styles.selectedDrugIngredient}>{drug.activeIngredient}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeDrugButton}
        onPress={() => removeDrugFromSelection(drug.id)}
      >
        <Ionicons name="close-circle" size={24} color="#F44336" />
      </TouchableOpacity>
    </View>
  );

  const renderDrugOption = (drug: Drug) => (
    <TouchableOpacity
      style={styles.drugOption}
      onPress={() => addDrugToSelection(drug)}
    >
      <View style={styles.drugOptionInfo}>
        <Text style={styles.drugOptionName}>{drug.name}</Text>
        {drug.nameArabic && (
          <Text style={styles.drugOptionArabic}>{drug.nameArabic}</Text>
        )}
        {drug.activeIngredient && (
          <Text style={styles.drugOptionIngredient}>{drug.activeIngredient}</Text>
        )}
      </View>
      <Ionicons name="add-circle" size={24} color="#007AFF" />
    </TouchableOpacity>
  );

  const renderInteraction = (interaction: DrugInteraction) => (
    <View style={[styles.resultCard, { borderLeftColor: getSeverityColor(interaction.severity) }]}>
      <Text style={styles.resultTitle}>{interaction.drug1Name} + {interaction.drug2Name}</Text>
      <View style={styles.resultHeader}>
        <Text style={[styles.severityBadge, { backgroundColor: getSeverityColor(interaction.severity) }]}>
          {interaction.severity.toUpperCase()}
        </Text>
        <Text style={styles.evidenceLevel}>Evidence: {interaction.evidenceLevel}</Text>
      </View>
      <Text style={styles.resultDescription}>{interaction.description}</Text>
      {interaction.recommendation && (
        <Text style={styles.recommendation}>{interaction.recommendation}</Text>
      )}
    </View>
  );

  const renderAllergyAlert = (alert: AllergyAlert) => (
    <View style={[styles.resultCard, { borderLeftColor: getSeverityColor(alert.severity) }]}>
      <Text style={styles.resultTitle}>Allergy Alert: {alert.allergenName}</Text>
      <View style={styles.resultHeader}>
        <Text style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
          {alert.severity.toUpperCase()}
        </Text>
        <Text style={styles.allergenType}>{alert.allergenType}</Text>
      </View>
      <Text style={styles.resultDescription}>Reaction: {alert.reaction}</Text>
      <Text style={styles.recommendation}>{alert.recommendation}</Text>
    </View>
  );

  const renderDosageRecommendation = (dosage: DosageCalculation) => (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>{dosage.drugName}</Text>
      <View style={styles.dosageInfo}>
        <Text style={styles.dosageAmount}>{dosage.calculatedDose} {dosage.unit}</Text>
        <Text style={styles.dosageFrequency}>{dosage.frequency}</Text>
      </View>
      {dosage.maxDailyDose && (
        <Text style={styles.maxDose}>Max daily: {dosage.maxDailyDose} {dosage.unit}</Text>
      )}
      <Text style={styles.ageGroup}>Age group: {dosage.ageGroup}</Text>
      <Text style={styles.notes}>{dosage.notes}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Comprehensive Analysis</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowProfileModal(true)}
        >
          <Ionicons name="person" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Selected Drugs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Medications</Text>
          {selectedDrugs.length === 0 ? (
            <Text style={styles.emptyText}>No medications selected</Text>
          ) : (
            <FlatList
              data={selectedDrugs}
              renderItem={({ item }) => renderSelectedDrug(item)}
              keyExtractor={item => item.id.toString()}
              scrollEnabled={false}
            />
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowDrugSelector(true)}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Medication</Text>
          </TouchableOpacity>
        </View>

        {/* Analysis Button */}
        <TouchableOpacity
          style={[styles.analyzeButton, loading && styles.disabledButton]}
          onPress={performComprehensiveAnalysis}
          disabled={loading}
        >
          <Ionicons name="search" size={24} color="white" />
          <Text style={styles.analyzeButtonText}>
            {loading ? 'Analyzing...' : 'Analyze Interactions'}
          </Text>
        </TouchableOpacity>

        {/* Results Section */}
        {analysisResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            
            {/* Interactions */}
            {analysisResults.interactions.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Drug Interactions ({analysisResults.interactions.length})</Text>
                <FlatList
                  data={analysisResults.interactions}
                  renderItem={({ item }) => renderInteraction(item)}
                  keyExtractor={(item, index) => `interaction-${index}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Allergy Alerts */}
            {analysisResults.allergyAlerts.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Allergy Alerts ({analysisResults.allergyAlerts.length})</Text>
                <FlatList
                  data={analysisResults.allergyAlerts}
                  renderItem={({ item }) => renderAllergyAlert(item)}
                  keyExtractor={(item, index) => `allergy-${index}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {/* Dosage Recommendations */}
            {analysisResults.dosageRecommendations.length > 0 && (
              <View style={styles.resultSection}>
                <Text style={styles.resultSectionTitle}>Dosage Recommendations ({analysisResults.dosageRecommendations.length})</Text>
                <FlatList
                  data={analysisResults.dosageRecommendations}
                  renderItem={({ item }) => renderDosageRecommendation(item)}
                  keyExtractor={(item, index) => `dosage-${index}`}
                  scrollEnabled={false}
                />
              </View>
            )}

            {analysisResults.interactions.length === 0 && 
             analysisResults.allergyAlerts.length === 0 && 
             analysisResults.dosageRecommendations.length === 0 && (
              <Text style={styles.noResultsText}>No issues found with your selected medications.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Drug Selector Modal */}
      <Modal visible={showDrugSelector} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Medication</Text>
            <TouchableOpacity onPress={() => setShowDrugSelector(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Search medications..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          <FlatList
            data={getFilteredDrugs()}
            renderItem={({ item }) => renderDrugOption(item)}
            keyExtractor={item => item.id.toString()}
            style={styles.drugList}
          />
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>User Profile</Text>
            <TouchableOpacity onPress={() => setShowProfileModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={userProfile.age.toString()}
            onChangeText={(text) => setUserProfile({ ...userProfile, age: parseInt(text) || 0 })}
            placeholder="Age"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={userProfile.weight.toString()}
            onChangeText={(text) => setUserProfile({ ...userProfile, weight: parseFloat(text) || 0 })}
            placeholder="Weight in kg"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={userProfile.height?.toString() || ''}
            onChangeText={(text) => setUserProfile({ ...userProfile, height: parseFloat(text) || undefined })}
            placeholder="Height in cm"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowProfileModal(false)}
          >
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  selectedDrugCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedDrugInfo: {
    flex: 1,
  },
  selectedDrugName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDrugIngredient: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeDrugButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    padding: 18,
    borderRadius: 8,
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultSection: {
    marginBottom: 20,
  },
  resultSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  evidenceLevel: {
    fontSize: 12,
    color: '#666',
  },
  allergenType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  resultDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  recommendation: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  dosageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dosageAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dosageFrequency: {
    fontSize: 14,
    color: '#666',
  },
  maxDose: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
  ageGroup: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noResultsText: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  drugList: {
    flex: 1,
  },
  drugOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drugOptionInfo: {
    flex: 1,
  },
  drugOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  drugOptionArabic: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  drugOptionIngredient: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ComprehensiveAnalysis;
