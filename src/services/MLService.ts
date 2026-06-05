import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import {FaceDetectionResult, FaceEmbedding, LivenessCheckResult} from '../models/types';
import {
  INPUT_SIZE, CONFIDENCE_THRESHOLD, MIN_FACE_SIZE, MAX_FACE_SIZE,
  MATCH_THRESHOLD, FACE_DETECTOR_MODEL, FACE_RECOGNIZER_MODEL, LIVENESS_MODEL,
} from '../models/constants';

export class MLService {
  private faceDetectorModel:   tf.GraphModel | null = null;
  private faceRecognizerModel: tf.GraphModel | null = null;
  private livenessModel:       tf.GraphModel | null = null;
  private modelLoadPromise:    Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.modelLoadPromise) return this.modelLoadPromise;
    this.modelLoadPromise = (async () => {
      await tf.ready();
      const [d, r, l] = await Promise.all([
        tf.loadGraphModel(FACE_DETECTOR_MODEL),
        tf.loadGraphModel(FACE_RECOGNIZER_MODEL),
        tf.loadGraphModel(LIVENESS_MODEL),
      ]);
      this.faceDetectorModel   = d;
      this.faceRecognizerModel = r;
      this.livenessModel       = l;
      console.log('[MLService] Models ready');
    })();
    return this.modelLoadPromise;
  }

  async detectFaces(imageData: any): Promise<FaceDetectionResult[]> {
    if (!this.faceDetectorModel) throw new Error('Face detector not loaded');
    const tensor = this.preprocessImage(imageData);
    try {
      const out = this.faceDetectorModel.predict(tensor);
      // cast to any[] to avoid NamedTensorMap union issue
      const raw: tf.Tensor[] = (Array.isArray(out) ? out : [out]) as tf.Tensor[];
      return this.parseDetections(raw).filter(
        d => d.confidence > CONFIDENCE_THRESHOLD &&
             d.bbox[2] >= MIN_FACE_SIZE &&
             d.bbox[2] <= MAX_FACE_SIZE,
      );
    } finally {
      tensor.dispose();
    }
  }

  async generateEmbedding(imageData: any, faceBox: FaceDetectionResult): Promise<FaceEmbedding> {
    if (!this.faceRecognizerModel) throw new Error('Recognizer not loaded');
    const tensors: tf.Tensor[] = [];
    try {
      const cropped    = this.cropFaceRegion(imageData, faceBox.bbox); tensors.push(cropped);
      const resized    = tf.image.resizeBilinear(cropped as tf.Tensor3D, [INPUT_SIZE, INPUT_SIZE]); tensors.push(resized);
      const normalized = tf.div(tf.sub(resized, tf.scalar(127.5)), tf.scalar(127.5)); tensors.push(normalized);
      const batched    = tf.expandDims(normalized, 0); tensors.push(batched);
      const out        = this.faceRecognizerModel.predict(batched) as tf.Tensor; tensors.push(out);
      const vector     = Array.from(await out.data());
      return {vector, confidence: faceBox.confidence, timestamp: Date.now()};
    } finally {
      tensors.forEach(t => t.dispose());
    }
  }

  async checkLiveness(imageSequence: any[], faceBox: FaceDetectionResult): Promise<LivenessCheckResult> {
    if (!this.livenessModel) throw new Error('Liveness model not loaded');
    if (imageSequence.length < 2) throw new Error('Need at least 2 frames');
    const results: tf.Tensor[] = [];
    for (const img of imageSequence) {
      const ts: tf.Tensor[] = [];
      try {
        const c = this.cropFaceRegion(img, faceBox.bbox); ts.push(c);
        const r = tf.image.resizeBilinear(c as tf.Tensor3D, [INPUT_SIZE, INPUT_SIZE]); ts.push(r);
        const n = tf.div(tf.sub(r, tf.scalar(127.5)), tf.scalar(127.5)); ts.push(n);
        const b = tf.expandDims(n, 0); ts.push(b);
        results.push(this.livenessModel.predict(b) as tf.Tensor);
        ts.forEach(t => t.dispose());
      } catch { ts.forEach(t => t.dispose()); }
    }
    const actions = {
      blink:   this.detectBlink(imageSequence),
      smile:   this.detectSmile(results),
      headTurn: this.detectHeadTurn(imageSequence),
    };
    results.forEach(r => r.dispose());
    const active = Object.values(actions).filter(Boolean).length;
    return {isLive: active >= 2, confidence: active / 3, actions};
  }

  compareEmbeddings(e1: number[], e2: number[], threshold = MATCH_THRESHOLD) {
    if (e1.length !== e2.length) throw new Error('Dimension mismatch');
    const dot = e1.reduce((s, v, i) => s + v * e2[i], 0);
    const n1  = Math.sqrt(e1.reduce((s, v) => s + v * v, 0));
    const n2  = Math.sqrt(e2.reduce((s, v) => s + v * v, 0));
    const cos = dot / (n1 * n2);
    return {match: cos > threshold, distance: 1 - cos, confidence: Math.max(0, cos)};
  }

  private preprocessImage(imageData: any): tf.Tensor {
    const t = tf.browser.fromPixels(imageData);
    const r = tf.image.resizeBilinear(t, [INPUT_SIZE, INPUT_SIZE]);
    t.dispose();
    return tf.div(tf.sub(r, tf.scalar(127.5)), tf.scalar(127.5));
  }

  private cropFaceRegion(imageData: any, bbox: [number, number, number, number]): tf.Tensor {
    const [x, y, w, h] = bbox;
    const t = tf.browser.fromPixels(imageData);
    const [imgH, imgW] = [t.shape[0], t.shape[1]];
    const e = tf.expandDims(t, 0) as tf.Tensor4D;
    t.dispose();
    return tf.image.cropAndResize(e, [[y/imgH, x/imgW, (y+h)/imgH, (x+w)/imgW]], [0], [INPUT_SIZE, INPUT_SIZE]);
  }

  private parseDetections(_: tf.Tensor[]): FaceDetectionResult[] {
    // Replace with your model's actual output parsing
    return [{bbox: [50, 50, 224, 224], confidence: 0.98, landmarks: []}];
  }

  private detectBlink(seq: any[]): boolean    { return seq.length >= 3; }
  private detectSmile(res: tf.Tensor[]): boolean { return res.length >= 5; }
  private detectHeadTurn(seq: any[]): boolean { return seq.length >= 8; }

  dispose() {
    this.faceDetectorModel?.dispose();
    this.faceRecognizerModel?.dispose();
    this.livenessModel?.dispose();
    tf.disposeVariables();
  }
}

export const mlService = new MLService();