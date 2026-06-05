// ML constants
export const INPUT_SIZE = 224;
export const EMBEDDING_SIZE = 512;
export const MIN_FACE_SIZE = 50;
export const MAX_FACE_SIZE = 500;
export const CONFIDENCE_THRESHOLD = 0.75;
export const LIVENESS_THRESHOLD = 0.6;
export const MATCH_THRESHOLD = 0.6;
export const LIVENESS_REQUIRED_ACTIONS = 2;
export const FRAMES_PER_LIVENESS_STEP = 10;
export const LIVENESS_STEP_DURATION_MS = 3000;

// Database constants
export const DB_NAME = 'facialrecognition.db';
export const SYNC_BATCH_SIZE = 50;
export const MAX_SYNC_RETRIES = 3;
export const PURGE_DAYS_DEFAULT = 30;
export const SYNC_QUEUE_LIMIT = 100;

// Model paths
export const FACE_DETECTOR_MODEL = 'assets://face_detector.tflite';
export const FACE_RECOGNIZER_MODEL = 'assets://face_recognizer.tflite';
export const LIVENESS_MODEL = 'assets://liveness_detector.tflite';

// AWS
export const AWS_ENDPOINT =
  'https://YOUR_API_GATEWAY_URL.execute-api.region.amazonaws.com/prod';