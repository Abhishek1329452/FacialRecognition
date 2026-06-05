import axios, {AxiosInstance} from 'axios';
import {databaseService} from './DatabaseService';
import {SyncPayload} from '../models/types';
import {AWS_ENDPOINT, SYNC_BATCH_SIZE} from '../models/constants';

export class SyncService {
  private apiClient: AxiosInstance;
  private isSyncing = false;

  constructor() {
    this.apiClient = axios.create({
      baseURL: AWS_ENDPOINT,
      timeout: 30000,
      headers: {'Content-Type': 'application/json'},
    });
  }

  async syncPendingRecords(): Promise<{
    success: number;
    failed: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      return {success: 0, failed: 0, error: 'Sync already in progress'};
    }

    this.isSyncing = true;
    let successCount = 0;
    let failCount = 0;

    try {
      const pending = await databaseService.getPendingSyncRecords();

      if (pending.length === 0) {
        console.log('[SyncService] No pending records');
        return {success: 0, failed: 0};
      }

      console.log(`[SyncService] Syncing ${pending.length} records...`);

      for (let i = 0; i < pending.length; i += SYNC_BATCH_SIZE) {
        const batch = pending.slice(i, i + SYNC_BATCH_SIZE);

        const payloads: SyncPayload[] = batch.map(record => ({
          recordId: record.id,
          userId: record.userId,
          embedding: JSON.parse(record.embedding),
          confidence: record.confidence,
          timestamp: record.timestamp,
          isLive: record.isLive,
          deviceInfo: record.deviceInfo,
        }));

        try {
          await this.apiClient.post('/sync/records', {records: payloads});
          for (const record of batch) {
            await databaseService.markRecordSynced(record.id);
            successCount++;
          }
        } catch (batchError) {
          console.error('[SyncService] Batch failed:', batchError);
          failCount += batch.length;
        }
      }

      await databaseService.purgeOldRecords(7);

      console.log(
        `[SyncService] Done: ${successCount} ok, ${failCount} failed`,
      );
      return {success: successCount, failed: failCount};
    } catch (error) {
      return {success: successCount, failed: failCount, error: String(error)};
    } finally {
      this.isSyncing = false;
    }
  }

  async verifyOnlineStatus(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async updateUserEmbedding(
    userId: string,
    embedding: number[],
  ): Promise<boolean> {
    try {
      await this.apiClient.put(`/users/${userId}/embedding`, {
        embedding,
        timestamp: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const syncService = new SyncService();