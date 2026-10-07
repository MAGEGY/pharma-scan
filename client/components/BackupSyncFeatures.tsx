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
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Backup {
  id: string;
  backupType: 'manual' | 'auto' | 'sync';
  cloudProvider?: string;
  syncStatus: 'pending' | 'syncing' | 'completed' | 'failed';
  backupSize: number;
  createdAt: string;
  lastSyncAt?: string;
}

interface UsageStats {
  totalScans: number;
  totalSearches: number;
  totalExports: number;
  totalBackups: number;
  avgSessionDuration: number;
  mostUsedFeatures: Array<{ feature: string; count: number }>;
}

interface PriceTrend {
  id: string;
  drugId: number;
  drugName: string;
  currentPrice: number;
  previousPrice: number;
  priceChange: number;
  priceChangePercent: number;
  trendDirection: 'up' | 'down' | 'stable';
  trendStrength: 'weak' | 'moderate' | 'strong';
  predictedPrice: number;
  confidence: number;
  analysisPeriod: string;
  lastUpdated: string;
}

interface MarketIntelligence {
  id: string;
  drugId: number;
  drugName: string;
  availabilityStatus: 'available' | 'limited' | 'out_of_stock' | 'discontinued';
  stockLevel?: number;
  demandLevel: 'low' | 'medium' | 'high' | 'very_high';
  seasonality?: 'high_season' | 'low_season' | 'stable';
  recommendedAction: string;
  reliability: number;
  lastChecked: string;
}

interface ExportRecord {
  id: string;
  exportType: 'pdf' | 'email' | 'print' | 'csv';
  contentType: string;
  fileName?: string;
  fileSize?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

const BackupSyncFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'backup' | 'analytics' | 'trends' | 'intelligence' | 'exports'>('backup');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [priceTrends, setPriceTrends] = useState<PriceTrend[]>([]);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence[]>([]);
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [selectedExportType, setSelectedExportType] = useState<'pdf' | 'csv' | 'email'>('pdf');
  const [selectedContentType, setSelectedContentType] = useState<'prescription_history' | 'analysis_results' | 'price_comparison'>('prescription_history');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadBackups(),
        loadUsageStats(),
        loadPriceTrends(),
        loadMarketIntelligence(),
        loadExports(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async (): Promise<string> => {
    // This should get the auth token from secure storage
    return '';
  };

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/backup-sync/backups', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setBackups(data.data);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await fetch('/api/backup-sync/analytics/stats', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsageStats(data.data);
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const loadPriceTrends = async () => {
    try {
      const response = await fetch('/api/backup-sync/price-trends/1', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPriceTrends(data.data);
      }
    } catch (error) {
      console.error('Error loading price trends:', error);
    }
  };

  const loadMarketIntelligence = async () => {
    try {
      const response = await fetch('/api/backup-sync/market-intelligence/1', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMarketIntelligence(data.data);
      }
    } catch (error) {
      console.error('Error loading market intelligence:', error);
    }
  };

  const loadExports = async () => {
    try {
      const response = await fetch('/api/backup-sync/exports', {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setExports(data.data);
      }
    } catch (error) {
      console.error('Error loading exports:', error);
    }
  };

  const createBackup = async (backupType: 'manual' | 'auto') => {
    try {
      const response = await fetch('/api/backup-sync/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          backupType,
          cloudProvider: 'google_drive',
          isEncrypted: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setBackups([data.data, ...backups]);
        setShowBackupModal(false);
        Alert.alert('Success', 'Backup created successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup');
    }
  };

  const createExport = async () => {
    try {
      const response = await fetch('/api/backup-sync/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          exportType: selectedExportType,
          contentType: selectedContentType,
          format: selectedExportType === 'email' ? 'pdf' : selectedExportType,
          deliveryMethod: selectedExportType === 'email' ? 'email' : 'download',
          recipientEmail: selectedExportType === 'email' ? 'user@example.com' : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setExports([data.data, ...exports]);
        setShowExportModal(false);
        Alert.alert('Success', 'Export created successfully');
      } else {
        Alert.alert('Error', data.error || 'Failed to create export');
      }
    } catch (error) {
      console.error('Error creating export:', error);
      Alert.alert('Error', 'Failed to create export');
    }
  };

  const downloadExport = async (exportId: string) => {
    try {
      const response = await fetch(`/api/backup-sync/export/${exportId}/download`, {
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      const data = await response.json();
      if (data.success && data.data.downloadUrl) {
        // In a real app, this would open the download URL
        Alert.alert('Download Started', 'Your export is being downloaded');
      } else {
        Alert.alert('Error', 'Export not found or expired');
      }
    } catch (error) {
      console.error('Error downloading export:', error);
      Alert.alert('Error', 'Failed to download export');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return '#F44336';
      case 'down': return '#4CAF50';
      default: return '#FF9800';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return '#4CAF50';
      case 'limited': return '#FF9800';
      case 'out_of_stock': return '#F44336';
      case 'discontinued': return '#757575';
      default: return '#757575';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'failed': return '#F44336';
      default: return '#757575';
    }
  };

  const renderBackupItem = (backup: Backup) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>
          {backup.backupType.charAt(0).toUpperCase() + backup.backupType.slice(1)} Backup
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(backup.syncStatus) }]}>
            {backup.syncStatus.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>
          Size: {formatFileSize(backup.backupSize)}
        </Text>
        <Text style={styles.itemDetail}>
          Created: {new Date(backup.createdAt).toLocaleDateString()}
        </Text>
        {backup.lastSyncAt && (
          <Text style={styles.itemDetail}>
            Last Sync: {new Date(backup.lastSyncAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      {backup.cloudProvider && (
        <Text style={styles.cloudProvider}>
          <Ionicons name="cloud" size={16} color="#007AFF" /> {backup.cloudProvider}
        </Text>
      )}
    </View>
  );

  const renderUsageStat = (label: string, value: number | string, icon: string) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color="#007AFF" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderTrendItem = (trend: PriceTrend) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{trend.drugName}</Text>
        <View style={styles.trendContainer}>
          <Ionicons 
            name={trend.trendDirection === 'up' ? 'arrow-up' : trend.trendDirection === 'down' ? 'arrow-down' : 'remove'} 
            size={16} 
            color={getTrendColor(trend.trendDirection)} 
          />
          <Text style={[styles.trendText, { color: getTrendColor(trend.trendDirection) }]}>
            {trend.priceChangePercent > 0 ? '+' : ''}{trend.priceChangePercent.toFixed(1)}%
          </Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>
          Current: EGP {trend.currentPrice.toFixed(2)}
        </Text>
        <Text style={styles.itemDetail}>
          Predicted: EGP {trend.predictedPrice.toFixed(2)}
        </Text>
        <Text style={styles.itemDetail}>
          Confidence: {(trend.confidence * 100).toFixed(0)}%
        </Text>
        <Text style={styles.itemDetail}>
          Period: {trend.analysisPeriod}
        </Text>
      </View>
    </View>
  );

  const renderIntelligenceItem = (intelligence: MarketIntelligence) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>{intelligence.drugName}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getAvailabilityColor(intelligence.availabilityStatus) }]}>
            {intelligence.availabilityStatus.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>
          Demand: {intelligence.demandLevel.toUpperCase()}
        </Text>
        <Text style={styles.itemDetail}>
          Stock Level: {intelligence.stockLevel || 'N/A'}
        </Text>
        {intelligence.seasonality && (
          <Text style={styles.itemDetail}>
            Seasonality: {intelligence.seasonality.replace('_', ' ')}
          </Text>
        )}
        <Text style={styles.itemDetail}>
          Reliability: {intelligence.reliability}/10
        </Text>
        <Text style={styles.recommendation}>
          {intelligence.recommendedAction}
        </Text>
      </View>
    </View>
  );

  const renderExportItem = (exportRecord: ExportRecord) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>
          {exportRecord.contentType.replace('_', ' ').toUpperCase()}
        </Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor(exportRecord.status) }]}>
            {exportRecord.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>
          Type: {exportRecord.exportType.toUpperCase()}
        </Text>
        <Text style={styles.itemDetail}>
          Created: {new Date(exportRecord.createdAt).toLocaleDateString()}
        </Text>
        {exportRecord.fileSize && (
          <Text style={styles.itemDetail}>
            Size: {formatFileSize(exportRecord.fileSize)}
          </Text>
        )}
        {exportRecord.expiresAt && (
          <Text style={styles.itemDetail}>
            Expires: {new Date(exportRecord.expiresAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      {exportRecord.status === 'completed' && exportRecord.exportType !== 'email' && (
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => downloadExport(exportRecord.id)}
        >
          <Ionicons name="download" size={16} color="white" />
          <Text style={styles.downloadButtonText}>Download</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {(['backup', 'analytics', 'trends', 'intelligence', 'exports'] as const).map(tab => (
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
        {activeTab === 'backup' && (
          <View>
            <View style={styles.settingsSection}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Auto Backup</Text>
                <Switch
                  value={autoBackupEnabled}
                  onValueChange={setAutoBackupEnabled}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowBackupModal(true)}
            >
              <Ionicons name="cloud-upload" size={24} color="white" />
              <Text style={styles.actionButtonText}>Create Backup</Text>
            </TouchableOpacity>

            <FlatList
              data={backups}
              renderItem={({ item }) => renderBackupItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'analytics' && usageStats && (
          <View>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>
            <View style={styles.statsGrid}>
              {renderUsageStat('Total Scans', usageStats.totalScans, 'camera')}
              {renderUsageStat('Total Searches', usageStats.totalSearches, 'search')}
              {renderUsageStat('Total Exports', usageStats.totalExports, 'download')}
              {renderUsageStat('Total Backups', usageStats.totalBackups, 'cloud-upload')}
            </View>
            
            <Text style={styles.sectionTitle}>Most Used Features</Text>
            <FlatList
              data={usageStats.mostUsedFeatures}
              renderItem={({ item }) => (
                <View style={styles.featureItem}>
                  <Text style={styles.featureName}>{item.feature}</Text>
                  <Text style={styles.featureCount}>{item.count} times</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'trends' && (
          <View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {/* Refresh trends */}}
            >
              <Ionicons name="refresh" size={24} color="white" />
              <Text style={styles.actionButtonText}>Refresh Trends</Text>
            </TouchableOpacity>

            <FlatList
              data={priceTrends}
              renderItem={({ item }) => renderTrendItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'intelligence' && (
          <View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {/* Refresh intelligence */}}
            >
              <Ionicons name="analytics" size={24} color="white" />
              <Text style={styles.actionButtonText}>Refresh Intelligence</Text>
            </TouchableOpacity>

            <FlatList
              data={marketIntelligence}
              renderItem={({ item }) => renderIntelligenceItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'exports' && (
          <View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowExportModal(true)}
            >
              <Ionicons name="document" size={24} color="white" />
              <Text style={styles.actionButtonText}>Create Export</Text>
            </TouchableOpacity>

            <FlatList
              data={exports}
              renderItem={({ item }) => renderExportItem(item)}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Backup Modal */}
      <Modal visible={showBackupModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Backup</Text>
          
          <Text style={styles.label}>Backup Type</Text>
          <View style={styles.pickerContainer}>
            {(['manual', 'auto'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.pickerOption, styles.pickerOptionSelected]}
                onPress={() => {/* Select backup type */}}
              >
                <Text style={styles.pickerOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowBackupModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => createBackup('manual')}
            >
              <Text style={styles.saveButtonText}>Create Backup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExportModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Create Export</Text>
          
          <Text style={styles.label}>Export Type</Text>
          <View style={styles.pickerContainer}>
            {(['pdf', 'csv', 'email'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  selectedExportType === type && styles.pickerOptionSelected
                ]}
                onPress={() => setSelectedExportType(type)}
              >
                <Text style={styles.pickerOptionText}>{type.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Content Type</Text>
          <View style={styles.pickerContainer}>
            {(['prescription_history', 'analysis_results', 'price_comparison'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  selectedContentType === type && styles.pickerOptionSelected
                ]}
                onPress={() => setSelectedContentType(type)}
              >
                <Text style={styles.pickerOptionText}>
                  {type.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowExportModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={createExport}
            >
              <Text style={styles.saveButtonText}>Create Export</Text>
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
  settingsSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  featureCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
  statusContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cloudProvider: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  recommendation: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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

export default BackupSyncFeatures;
