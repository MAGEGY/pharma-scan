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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { EgyptianDrug } from '../../shared/schema';

const { width } = Dimensions.get('window');

interface DrugInteractionResult {
  interactions: Array<{
    id: string;
    drug1Name: string;
    drug2Name: string;
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    description: string;
    mechanism: string;
    clinicalEffects: string[];
    recommendations: string[];
    evidence: {
      level: string;
      source: string;
      references: string[];
    };
    onset: string;
    duration: string;
    monitoring: string[];
    management: string[];
    alternatives: string[];
  }>;
  summary: {
    totalInteractions: number;
    majorInteractions: number;
    moderateInteractions: number;
    minorInteractions: number;
    contraindicatedInteractions: number;
  };
  warnings: {
    critical: string[];
    caution: string[];
    informational: string[];
  };
  recommendations: {
    immediate: string[];
    monitoring: string[];
    lifestyle: string[];
  };
  checkedAt: string;
}

interface DrugSearchResult {
  id: number;
  name: string;
  activeIngredient?: string;
}

interface DrugInteractionCheckerProps {
  drugs: EgyptianDrug[];
}

export default function DrugInteractionChecker({ drugs }: DrugInteractionCheckerProps) {
  const [selectedDrugs, setSelectedDrugs] = useState<DrugSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DrugSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [interactionResult, setInteractionResult] = useState<DrugInteractionResult | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<any>(null);

  // Mock API functions (in production, these would call the actual backend)
  const searchDrugs = async (query: string): Promise<DrugSearchResult[]> => {
    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const filtered = drugs
        .filter(drug => 
          drug.name.toLowerCase().includes(query.toLowerCase()) ||
          drug.nameArabic?.toLowerCase().includes(query.toLowerCase()) ||
          drug.activeIngredient?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 10)
        .map(drug => ({
          id: drug.id,
          name: drug.name,
          activeIngredient: drug.activeIngredient,
        }));
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const checkInteractions = async (drugIds: number[]): Promise<DrugInteractionResult> => {
    setIsChecking(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock interaction data
      const mockResult: DrugInteractionResult = {
        interactions: [
          {
            id: '1',
            drug1Name: selectedDrugs[0]?.name || 'Drug 1',
            drug2Name: selectedDrugs[1]?.name || 'Drug 2',
            severity: 'major',
            description: 'Increased risk of bleeding due to additive effects on platelet function and coagulation',
            mechanism: 'Both drugs affect platelet aggregation and coagulation pathways',
            clinicalEffects: ['Increased bleeding time', 'Gastrointestinal bleeding', 'Ecchymosis'],
            recommendations: [
              'Avoid combination if possible',
              'Monitor blood parameters frequently',
              'Consider alternative medications'
            ],
            evidence: {
              level: 'A',
              source: 'Clinical Pharmacology',
              references: ['Study 1', 'Study 2']
            },
            onset: 'immediate',
            duration: 'temporary',
            monitoring: ['Complete blood count', 'Coagulation tests'],
            management: ['Dose adjustment', 'Discontinue if bleeding occurs'],
            alternatives: ['Alternative drug 1', 'Alternative drug 2']
          }
        ],
        summary: {
          totalInteractions: 1,
          majorInteractions: 1,
          moderateInteractions: 0,
          minorInteractions: 0,
          contraindicatedInteractions: 0
        },
        warnings: {
          critical: ['Major interaction detected between selected medications'],
          caution: [],
          informational: []
        },
        recommendations: {
          immediate: ['Consult healthcare provider before combining these medications'],
          monitoring: ['Monitor for signs of bleeding'],
          lifestyle: ['Avoid activities that increase bleeding risk']
        },
        checkedAt: new Date().toISOString()
      };
      
      setInteractionResult(mockResult);
      return mockResult;
    } catch (error) {
      console.error('Interaction check error:', error);
      Alert.alert('Error', 'Failed to check drug interactions');
      return {
        interactions: [],
        summary: {
          totalInteractions: 0,
          majorInteractions: 0,
          moderateInteractions: 0,
          minorInteractions: 0,
          contraindicatedInteractions: 0
        },
        warnings: { critical: [], caution: [], informational: [] },
        recommendations: { immediate: [], monitoring: [], lifestyle: [] },
        checkedAt: new Date().toISOString()
      };
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchDrugs(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const addDrug = (drug: DrugSearchResult) => {
    if (selectedDrugs.length >= 5) {
      Alert.alert('Limit Reached', 'You can check interactions for up to 5 medications at once');
      return;
    }

    if (selectedDrugs.some(d => d.id === drug.id)) {
      Alert.alert('Duplicate', 'This medication is already selected');
      return;
    }

    setSelectedDrugs([...selectedDrugs, drug]);
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeDrug = (drugId: number) => {
    setSelectedDrugs(selectedDrugs.filter(d => d.id !== drugId));
    if (selectedDrugs.length <= 2) {
      setInteractionResult(null);
    }
  };

  const handleCheckInteractions = () => {
    if (selectedDrugs.length < 2) {
      Alert.alert('Insufficient Drugs', 'Please select at least 2 medications to check for interactions');
      return;
    }

    const drugIds = selectedDrugs.map(d => d.id);
    checkInteractions(drugIds);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'major':
      case 'contraindicated':
        return '#e74c3c';
      case 'moderate':
        return '#f39c12';
      case 'minor':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'major':
      case 'contraindicated':
        return '⚠️';
      case 'moderate':
        return '⚡';
      case 'minor':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  const renderDrugItem = (drug: DrugSearchResult) => (
    <TouchableOpacity
      key={drug.id}
      style={styles.drugItem}
      onPress={() => addDrug(drug)}
    >
      <View style={styles.drugItemContent}>
        <Text style={styles.drugName}>{drug.name}</Text>
        {drug.activeIngredient && (
          <Text style={styles.activeIngredient}>{drug.activeIngredient}</Text>
        )}
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );

  const renderSelectedDrug = (drug: DrugSearchResult) => (
    <View key={drug.id} style={styles.selectedDrugItem}>
      <View style={styles.selectedDrugContent}>
        <Text style={styles.selectedDrugName}>{drug.name}</Text>
        {drug.activeIngredient && (
          <Text style={styles.selectedDrugIngredient}>{drug.activeIngredient}</Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeDrug(drug.id)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInteractionItem = (interaction: any) => (
    <TouchableOpacity
      key={interaction.id}
      style={[styles.interactionItem, { borderLeftColor: getSeverityColor(interaction.severity) }]}
      onPress={() => {
        setSelectedInteraction(interaction);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.interactionHeader}>
        <View style={styles.interactionTitle}>
          <Text style={styles.interactionDrugs}>
            {interaction.drug1Name} + {interaction.drug2Name}
          </Text>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(interaction.severity) }]}>
            <Text style={styles.severityText}>
              {getSeverityIcon(interaction.severity)} {interaction.severity.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.interactionDescription} numberOfLines={2}>
        {interaction.description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Drug Interaction Checker</Text>
        <Text style={styles.subtitle}>Check for potential interactions between medications</Text>
      </View>

      <View style={styles.selectedDrugsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Selected Medications ({selectedDrugs.length}/5)</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowSearchModal(true)}
            disabled={selectedDrugs.length >= 5}
          >
            <Text style={styles.addButtonText}>+ Add Drug</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedDrugsList}>
          {selectedDrugs.map(renderSelectedDrug)}
          {selectedDrugs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No medications selected</Text>
              <Text style={styles.emptySubtext}>Tap "Add Drug" to start</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {selectedDrugs.length >= 2 && (
        <View style={styles.checkSection}>
          <TouchableOpacity
            style={[styles.checkButton, isChecking && styles.checkButtonDisabled]}
            onPress={handleCheckInteractions}
            disabled={isChecking}
          >
            {isChecking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkButtonText}>Check Interactions</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {interactionResult && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Interaction Results</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryNumber}>{interactionResult.summary.totalInteractions}</Text>
                <Text style={styles.summaryLabel}>Total</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#e74c3c' }]}>
                  {interactionResult.summary.majorInteractions + interactionResult.summary.contraindicatedInteractions}
                </Text>
                <Text style={styles.summaryLabel}>Major</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#f39c12' }]}>
                  {interactionResult.summary.moderateInteractions}
                </Text>
                <Text style={styles.summaryLabel}>Moderate</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryNumber, { color: '#27ae60' }]}>
                  {interactionResult.summary.minorInteractions}
                </Text>
                <Text style={styles.summaryLabel}>Minor</Text>
              </View>
            </View>
          </View>

          {interactionResult.warnings.critical.length > 0 && (
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>⚠️ Critical Warnings</Text>
              {interactionResult.warnings.critical.map((warning, index) => (
                <Text key={index} style={styles.warningText}>• {warning}</Text>
              ))}
            </View>
          )}

          {interactionResult.warnings.caution.length > 0 && (
            <View style={styles.cautionSection}>
              <Text style={styles.cautionTitle}>⚡ Cautions</Text>
              {interactionResult.warnings.caution.map((warning, index) => (
                <Text key={index} style={styles.cautionText}>• {warning}</Text>
              ))}
            </View>
          )}

          <ScrollView style={styles.interactionsList}>
            {interactionResult.interactions.map(renderInteractionItem)}
          </ScrollView>

          {interactionResult.recommendations.immediate.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={styles.recommendationsTitle}>📋 Immediate Recommendations</Text>
              {interactionResult.recommendations.immediate.map((rec, index) => (
                <Text key={index} style={styles.recommendationText}>• {rec}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSearchModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Search Medications</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by drug name or active ingredient..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>

          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={({ item }) => renderDrugItem(item)}
              keyExtractor={(item) => item.id.toString()}
              style={styles.searchResults}
              ListEmptyComponent={
                searchQuery.length > 2 ? (
                  <View style={styles.noResults}>
                    <Text style={styles.noResultsText}>No medications found</Text>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </Modal>

      {/* Interaction Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Interaction Details</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedInteraction && (
            <ScrollView style={styles.detailsContainer}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Medications</Text>
                <Text style={styles.detailText}>{selectedInteraction.drug1Name}</Text>
                <Text style={styles.detailText}>+</Text>
                <Text style={styles.detailText}>{selectedInteraction.drug2Name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Severity</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedInteraction.severity) }]}>
                  <Text style={styles.severityText}>
                    {getSeverityIcon(selectedInteraction.severity)} {selectedInteraction.severity.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Description</Text>
                <Text style={styles.detailText}>{selectedInteraction.description}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Mechanism</Text>
                <Text style={styles.detailText}>{selectedInteraction.mechanism}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Clinical Effects</Text>
                {selectedInteraction.clinicalEffects.map((effect: string, index: number) => (
                  <Text key={index} style={styles.detailText}>• {effect}</Text>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Recommendations</Text>
                {selectedInteraction.recommendations.map((rec: string, index: number) => (
                  <Text key={index} style={styles.detailText}>• {rec}</Text>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Monitoring Required</Text>
                {selectedInteraction.monitoring.map((monitor: string, index: number) => (
                  <Text key={index} style={styles.detailText}>• {monitor}</Text>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Alternatives</Text>
                {selectedInteraction.alternatives.map((alt: string, index: number) => (
                  <Text key={index} style={styles.detailText}>• {alt}</Text>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Evidence Level</Text>
                <Text style={styles.detailText}>{selectedInteraction.evidence.level} - {selectedInteraction.evidence.source}</Text>
              </View>
            </ScrollView>
          )}
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedDrugsSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedDrugsList: {
    flexDirection: 'row',
  },
  selectedDrugItem: {
    backgroundColor: '#e8f4f8',
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 150,
    maxWidth: 200,
  },
  selectedDrugContent: {
    paddingRight: 20,
  },
  selectedDrugName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  selectedDrugIngredient: {
    fontSize: 12,
    color: '#6c757d',
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
  },
  checkSection: {
    padding: 16,
  },
  checkButton: {
    backgroundColor: '#27ae60',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  warningSection: {
    backgroundColor: '#fdf2f2',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  cautionSection: {
    backgroundColor: '#fffbf0',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cautionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f39c12',
    marginBottom: 8,
  },
  cautionText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  interactionsList: {
    flex: 1,
  },
  interactionItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  interactionHeader: {
    marginBottom: 8,
  },
  interactionTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  interactionDrugs: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  interactionDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  recommendationsSection: {
    backgroundColor: '#f0f8f0',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    fontSize: 16,
    color: '#3498db',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  placeholder: {
    width: 50,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchResults: {
    flex: 1,
  },
  drugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  drugItemContent: {
    flex: 1,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activeIngredient: {
    fontSize: 14,
    color: '#6c757d',
  },
  addIcon: {
    fontSize: 20,
    color: '#3498db',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#6c757d',
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
    marginBottom: 4,
  },
});
