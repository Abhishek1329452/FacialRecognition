import React, {useState, useCallback, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {mlService} from '../services/MLService';
import {FaceDetectionResult} from '../models/types';

interface Props {
  userId: string;
  onSuccess: (isLive: boolean) => void;
  onError: (error: string) => void;
}

type ActiveStep = 'blink' | 'smile' | 'turn';
type Step = ActiveStep | 'processing' | 'complete';

const STEP_CONFIG: Record<ActiveStep, {instruction: string; icon: string; duration: number}> = {
  blink: {instruction: 'Blink your eyes slowly', icon: '👁️', duration: 3000},
  smile: {instruction: 'Smile naturally',         icon: '😊', duration: 3000},
  turn:  {instruction: 'Turn your head slightly', icon: '↔️', duration: 3000},
};
const STEP_ORDER: ActiveStep[] = ['blink', 'smile', 'turn'];

const PLACEHOLDER_BOX: FaceDetectionResult = {
  bbox: [0, 0, 224, 224], confidence: 0.9, landmarks: [],
};

export const LivenessCheckScreen: React.FC<Props> = ({onSuccess, onError}) => {
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  // 'any' ref avoids Camera v4 MemoExoticComponent type issues
  const cameraRef = useRef<any>(null);
  const framesCaptured = useRef<any[]>([]);

  const [currentStep, setCurrentStep] = useState<Step>('blink');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const captureFrames = useCallback(async (step: ActiveStep) => {
    if (!cameraRef.current) return;
    const frameCount = 10;
    const interval = STEP_CONFIG[step].duration / frameCount;
    for (let i = 0; i < frameCount; i++) {
      try {
        const photo = await cameraRef.current.takePhoto({qualityPrioritization: 'speed'});
        framesCaptured.current.push(photo);
        setProgress((i + 1) / frameCount);
      } catch {/* skip bad frame */}
      // Fixed: wrap resolver in arrow fn to satisfy setTimeout type
      await new Promise<void>(r => setTimeout(() => r(), interval));
    }
  }, []);

  const processLiveness = useCallback(async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    try {
      const result = await mlService.checkLiveness(framesCaptured.current, PLACEHOLDER_BOX);
      if (result.isLive && result.confidence > 0.6) {
        setCurrentStep('complete');
        onSuccess(true);
      } else {
        onError('Liveness check failed. Please try again.');
      }
    } catch (e) {
      onError(`Liveness error: ${String(e)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [onSuccess, onError]);

  useEffect(() => {
    const isActive = STEP_ORDER.includes(currentStep as ActiveStep);
    if (!isActive) return;
    const step = currentStep as ActiveStep;
    const timer = setTimeout(async () => {
      await captureFrames(step);
      const idx = STEP_ORDER.indexOf(step);
      if (idx < STEP_ORDER.length - 1) {
        framesCaptured.current = [];
        setProgress(0);
        setCurrentStep(STEP_ORDER[idx + 1]);
      } else {
        await processLiveness();
      }
    }, 1000);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  if (!device || !hasPermission) {
    return (
      <View style={s.container}>
        <Text style={s.errorText}>
          {!hasPermission ? 'Camera permission required' : 'Camera not available'}
        </Text>
      </View>
    );
  }

  const activeConfig = STEP_ORDER.includes(currentStep as ActiveStep)
    ? STEP_CONFIG[currentStep as ActiveStep]
    : null;

  return (
    <View style={s.container}>
      {/* photo prop removed in v4 — takePhoto() works without it */}
      <Camera
        ref={cameraRef}
        device={device}
        isActive
        style={StyleSheet.absoluteFill}
      />
      <View style={s.overlay}>
        <Text style={s.title}>Liveness Verification</Text>

        {activeConfig && (
          <View style={s.box}>
            <Text style={s.bigIcon}>{activeConfig.icon}</Text>
            <Text style={s.instruction}>{activeConfig.instruction}</Text>
            <View style={s.bar}>
              <View style={[s.fill, {width: `${progress * 100}%` as any}]} />
            </View>
          </View>
        )}

        {isProcessing && (
          <View style={s.box}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={s.subText}>Verifying liveness...</Text>
          </View>
        )}

        {currentStep === 'complete' && (
          <View style={[s.box, {backgroundColor: 'rgba(76,175,80,0.9)'}]}>
            <Text style={s.bigIcon}>✓</Text>
            <Text style={s.boldText}>Liveness Verified!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:   {flex: 1, backgroundColor: '#000'},
  overlay:     {...StyleSheet.absoluteFill, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40},
  title:       {color: '#fff', fontSize: 24, fontWeight: 'bold'},
  box:         {backgroundColor: 'rgba(0,0,0,0.8)', padding: 20, borderRadius: 15, alignItems: 'center', marginHorizontal: 20},
  bigIcon:     {fontSize: 48, marginBottom: 10},
  instruction: {color: '#fff', fontSize: 16, marginBottom: 15, textAlign: 'center'},
  bar:         {width: 200, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden'},
  fill:        {height: '100%', backgroundColor: '#4CAF50'},
  subText:     {color: '#fff', fontSize: 16, marginTop: 15},
  boldText:    {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  errorText:   {color: '#fff', fontSize: 16, textAlign: 'center', margin: 40},
});