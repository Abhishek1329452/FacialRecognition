import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {Camera, useCameraDevice, useCameraPermission} from 'react-native-vision-camera';
import {mlService} from '../services/MLService';
import {databaseService} from '../services/DatabaseService';
import {LivenessCheckScreen} from './LivenessCheckScreen';
import {AuthResult} from '../models/types';

interface Props {
  userId: string;
  onSuccess: () => void;
}

type Step = 'camera' | 'liveness' | 'result';

export const AuthenticationScreen: React.FC<Props> = ({userId, onSuccess}) => {
  const device = useCameraDevice('front');
  const {hasPermission, requestPermission} = useCameraPermission();
  // 'any' ref — avoids Camera v4 MemoExoticComponent type conflicts
  const cameraRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep]     = useState<Step>('camera');
  const [result, setResult] = useState<AuthResult | null>(null);

  useEffect(() => {
    if (!hasPermission) requestPermission();
    mlService.initialize().catch(e =>
      Alert.alert('Error', 'Failed to load AI models: ' + String(e)));
  }, [hasPermission, requestPermission]);

  const captureAndDetect = useCallback(async () => {
    if (!cameraRef.current) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto({qualityPrioritization: 'quality'});
      const detections = await mlService.detectFaces(photo as any);
      if (!detections.length) {
        setResult({success: false, message: 'No face detected. Please reposition.'});
        setStep('result');
        return;
      }
      setStep('liveness');
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLivenessSuccess = useCallback(async (isLive: boolean) => {
    if (!isLive) {
      setResult({success: false, message: 'Liveness failed. Try again.'});
      setStep('result');
      return;
    }
    try {
      const photo = await cameraRef.current?.takePhoto({qualityPrioritization: 'quality'});
      if (!photo) throw new Error('Failed to capture');

      const detections = await mlService.detectFaces(photo as any);
      if (!detections.length) throw new Error('Face not detected');

      const embedding  = await mlService.generateEmbedding(photo as any, detections[0]);
      const storedUser = await databaseService.getUser(userId);
      if (!storedUser) throw new Error('User not registered. Please register first.');

      const {match, confidence} = mlService.compareEmbeddings(
        embedding.vector, storedUser.embedding, 0.6);

      if (match) {
        await databaseService.saveAuthenticationRecord({
          id:         `rec_${Date.now()}`,
          userId,
          timestamp:  Date.now(),
          embedding:  JSON.stringify(embedding.vector),
          confidence,
          isLive:     true,
          deviceInfo: 'React Native Device',
          synced:     false,
        });
        setTimeout(onSuccess, 2000);
      }

      setResult({
        success: match, confidence,
        message: match ? 'Authentication successful!' : 'Face does not match.',
      });
      setStep('result');
    } catch (e) {
      setResult({success: false, message: String(e)});
      setStep('result');
    }
  }, [userId, onSuccess]);

  const handleRetry = useCallback(() => { setStep('camera'); setResult(null); }, []);

  if (step === 'liveness') {
    return (
      <LivenessCheckScreen
        userId={userId}
        onSuccess={handleLivenessSuccess}
        onError={err => { setResult({success: false, message: err}); setStep('result'); }}
      />
    );
  }

  if (step === 'result' && result) {
    return (
      <View style={[s.container, {backgroundColor: result.success ? '#E8F5E9' : '#FFEBEE'}]}>
        <View style={s.resultBox}>
          <Text style={[s.resultIcon, {color: result.success ? '#4CAF50' : '#F44336'}]}>
            {result.success ? '✓' : '✗'}
          </Text>
          <Text style={s.message}>{result.message}</Text>
          {result.confidence !== undefined && (
            <Text style={s.confidence}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </Text>
          )}
          <TouchableOpacity style={s.button} onPress={handleRetry}>
            <Text style={s.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device || !hasPermission) {
    return (
      <View style={s.container}>
        <Text style={{color: '#fff', textAlign: 'center', margin: 40}}>
          {!hasPermission ? 'Camera permission required' : 'Camera not available'}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* photo prop removed in v4 — takePhoto() still works */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive
      />
      <View style={s.overlay}>
        <Text style={s.title}>Facial Recognition</Text>
        <Text style={s.subtitle}>Position your face in the frame</Text>
        <View style={s.faceBox} />
        {isLoading
          ? <ActivityIndicator size="large" color="#007AFF" />
          : (
            <TouchableOpacity style={s.captureBtn} onPress={captureAndDetect}>
              <Text style={s.captureBtnText}>Capture</Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container:      {flex: 1, backgroundColor: '#000'},
  overlay:        {...StyleSheet.absoluteFill, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40},
  title:          {color: '#fff', fontSize: 24, fontWeight: 'bold'},
  subtitle:       {color: '#ccc', fontSize: 14, marginTop: 8},
  faceBox:        {width: 240, height: 280, borderWidth: 3, borderColor: '#4CAF50', borderRadius: 20, backgroundColor: 'transparent'},
  captureBtn:     {backgroundColor: '#007AFF', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12},
  captureBtnText: {color: '#fff', fontSize: 18, fontWeight: '600'},
  resultBox:      {flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20},
  resultIcon:     {fontSize: 64, marginBottom: 20},
  message:        {fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 10, color: '#333'},
  confidence:     {fontSize: 14, color: '#666', marginBottom: 30},
  button:         {backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8},
  buttonText:     {color: '#fff', fontSize: 16, fontWeight: '600'},
});