export interface FaceDetectionResult {
  bbox: [number, number, number, number]; // [x, y, width, height]
  confidence: number;
  landmarks: Array<{ x: number; y: number }>;
}

export interface FaceEmbedding {
  vector: number[];
  confidence: number;
  timestamp: number;
}

export interface LivenessCheckResult {
  isLive: boolean;
  confidence: number;
  actions: {
    blink: boolean;
    smile: boolean;
    headTurn: boolean;
  };
}

export interface AuthenticationRecord {
  id: string;
  userId: string;
  timestamp: number;
  embedding: string;
  confidence: number;
  isLive: boolean;
  location?: string;
  deviceInfo: string;
  synced: boolean;
  syncedAt?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  faceEmbedding: number[];
  createdAt: number;
  updatedAt: number;
}

export interface SyncPayload {
  recordId: string;
  userId: string;
  embedding: number[];
  confidence: number;
  timestamp: number;
  isLive: boolean;
  deviceInfo: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  confidence?: number;
}

export interface StorageStats {
  totalRecords: number;
  unsynced: number;
  databaseSize: number;
}