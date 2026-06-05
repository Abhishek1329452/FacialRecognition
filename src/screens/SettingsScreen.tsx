import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import {databaseService} from '../services/DatabaseService';
import {syncService} from '../services/SyncService';
import {StorageStats} from '../models/types';

export const SettingsScreen: React.FC = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const s = await databaseService.getStorageStats();
      setStats(s);
    } catch (e) {
      console.error('Stats error:', e);
    }
  }, []);

  useEffect(() => {
    loadStats();
    syncService.verifyOnlineStatus().then(setIsOnline);
  }, [loadStats]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.syncPendingRecords();
      Alert.alert(
        'Sync Complete',
        `✓ ${result.success} synced\n✗ ${result.failed} failed`,
      );
      await loadStats();
    } catch (e) {
      Alert.alert('Sync Error', String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePurge = () => {
    Alert.alert(
      'Purge Records',
      'Delete all synced records older than 30 days?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Purge', style: 'destructive',
          onPress: async () => {
            const count = await databaseService.purgeOldRecords(30);
            Alert.alert('Done', `${count} records deleted`);
            await loadStats();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.card}>
          <Row label="Total Records" value={String(stats?.totalRecords ?? '—')} />
          <Row label="Unsynced" value={String(stats?.unsynced ?? '—')} highlight />
          <Row label="Database Size" value={`${stats?.databaseSize ?? 0} KB`} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.dot, {backgroundColor: isOnline ? '#4CAF50' : '#F44336'}]} />
              <Text style={styles.value}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.button, isSyncing && styles.buttonDisabled]}
            onPress={handleSync}
            disabled={isSyncing}>
            {isSyncing
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Sync Now</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dangerButton} onPress={handlePurge}>
            <Text style={styles.dangerText}>Purge Old Records (30+ days)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const Row = ({label, value, highlight}: {label: string; value: string; highlight?: boolean}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, highlight && styles.highlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  section: {marginTop: 24, paddingHorizontal: 16},
  sectionTitle: {fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, textTransform: 'uppercase'},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  label: {fontSize: 15, color: '#333'},
  value: {fontSize: 15, color: '#666', fontWeight: '500'},
  highlight: {color: '#F44336'},
  statusRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  dot: {width: 8, height: 8, borderRadius: 4},
  button: {
    backgroundColor: '#007AFF', borderRadius: 8,
    padding: 12, alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: {opacity: 0.6},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  dangerButton: {
    borderWidth: 1, borderColor: '#F44336', borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  dangerText: {color: '#F44336', fontSize: 15, fontWeight: '500'},
});