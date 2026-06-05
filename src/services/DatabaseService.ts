// Using require to bypass missing @types/react-native-sqlite-storage
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SQLite = require('react-native-sqlite-storage') as any;
SQLite.enablePromise(true);

import {AuthenticationRecord, StorageStats} from '../models/types';
import {DB_NAME, SYNC_QUEUE_LIMIT, MAX_SYNC_RETRIES} from '../models/constants';

export class DatabaseService {
  private db: any = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabase({name: DB_NAME, location: 'default'});
    await this.createTables();
    console.log('[DB] Ready');
  }

  private async createTables(): Promise<void> {
    await this.db.executeSql(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE,
      faceEmbedding TEXT NOT NULL, createdAt INTEGER, updatedAt INTEGER)`);
    await this.db.executeSql(`CREATE TABLE IF NOT EXISTS authentication_records (
      id TEXT PRIMARY KEY, userId TEXT NOT NULL, timestamp INTEGER,
      embedding TEXT, confidence REAL, isLive INTEGER,
      location TEXT, deviceInfo TEXT, synced INTEGER DEFAULT 0, syncedAt INTEGER,
      FOREIGN KEY (userId) REFERENCES users(id))`);
    await this.db.executeSql(`CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY, recordId TEXT, createdAt INTEGER, retries INTEGER DEFAULT 0,
      FOREIGN KEY (recordId) REFERENCES authentication_records(id))`);
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_auth_user ON authentication_records(userId)');
    await this.db.executeSql('CREATE INDEX IF NOT EXISTS idx_auth_synced ON authentication_records(synced)');
  }

  async saveUser(userId: string, name: string, embedding: number[], email?: string): Promise<void> {
    const now = Date.now();
    await this.db.executeSql(
      'INSERT OR REPLACE INTO users (id,name,email,faceEmbedding,createdAt,updatedAt) VALUES (?,?,?,?,?,?)',
      [userId, name, email ?? null, JSON.stringify(embedding), now, now]);
  }

  async saveAuthenticationRecord(record: AuthenticationRecord): Promise<void> {
    await this.db.executeSql(
      'INSERT INTO authentication_records (id,userId,timestamp,embedding,confidence,isLive,location,deviceInfo,synced) VALUES (?,?,?,?,?,?,?,?,?)',
      [record.id, record.userId, record.timestamp, record.embedding,
       record.confidence, record.isLive ? 1 : 0, record.location ?? null, record.deviceInfo, 0]);
    await this.db.executeSql(
      'INSERT INTO sync_queue (id,recordId,createdAt,retries) VALUES (?,?,?,?)',
      [`sync_${record.id}`, record.id, Date.now(), 0]);
  }

  async getUser(userId: string): Promise<{embedding: number[]} | null> {
    const [res] = await this.db.executeSql('SELECT faceEmbedding FROM users WHERE id=?', [userId]);
    if (res.rows.length === 0) return null;
    return {embedding: JSON.parse(res.rows.item(0).faceEmbedding)};
  }

  async getPendingSyncRecords(): Promise<AuthenticationRecord[]> {
    const [res] = await this.db.executeSql(
      `SELECT ar.* FROM authentication_records ar
       INNER JOIN sync_queue sq ON ar.id=sq.recordId
       WHERE ar.synced=0 AND sq.retries<? ORDER BY ar.timestamp ASC LIMIT ?`,
      [MAX_SYNC_RETRIES, SYNC_QUEUE_LIMIT]);
    const records: AuthenticationRecord[] = [];
    for (let i = 0; i < res.rows.length; i++) {
      const r = res.rows.item(i);
      records.push({
        id: r.id, userId: r.userId, timestamp: r.timestamp, embedding: r.embedding,
        confidence: r.confidence, isLive: r.isLive === 1, location: r.location,
        deviceInfo: r.deviceInfo, synced: r.synced === 1, syncedAt: r.syncedAt,
      });
    }
    return records;
  }

  async markRecordSynced(recordId: string): Promise<void> {
    await this.db.executeSql('UPDATE authentication_records SET synced=1,syncedAt=? WHERE id=?', [Date.now(), recordId]);
    await this.db.executeSql('DELETE FROM sync_queue WHERE recordId=?', [recordId]);
  }

  async purgeOldRecords(daysOld = 30): Promise<number> {
    const cutoff = Date.now() - daysOld * 86400000;
    const [res] = await this.db.executeSql(
      'DELETE FROM authentication_records WHERE synced=1 AND syncedAt<?', [cutoff]);
    return res.rowsAffected;
  }

  async getStorageStats(): Promise<StorageStats> {
    const [t] = await this.db.executeSql('SELECT COUNT(*) as count FROM authentication_records');
    const [u] = await this.db.executeSql('SELECT COUNT(*) as count FROM authentication_records WHERE synced=0');
    const total = t.rows.item(0).count;
    return {totalRecords: total, unsynced: u.rows.item(0).count, databaseSize: total * 2};
  }

  async close(): Promise<void> {
    if (this.db) { await this.db.close(); this.db = null; }
  }
}

export const databaseService = new DatabaseService();