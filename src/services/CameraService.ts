// react-native-vision-camera v4 — Camera is a MemoExoticComponent, not a class
// We use 'any' for the ref type to avoid version-specific type conflicts
import {MutableRefObject} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

export class CameraService {
  private cameraRef: MutableRefObject<any> | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    // iOS: handled via Info.plist + vision-camera's useCameraPermission hook in screens
    return true;
  }

  async captureFrame(): Promise<string> {
    if (!this.cameraRef?.current) throw new Error('Camera not ready');
    const photo = await this.cameraRef.current.takePhoto({
      qualityPrioritization: 'quality',
      skipMetadata: true,
    });
    return photo.path;
  }

  async captureFrameFast(): Promise<string> {
    if (!this.cameraRef?.current) throw new Error('Camera not ready');
    const photo = await this.cameraRef.current.takePhoto({
      qualityPrioritization: 'speed',
      skipMetadata: true,
    });
    return photo.path;
  }

  setCameraRef(ref: MutableRefObject<any>): void {
    this.cameraRef = ref;
  }

  isCameraReady(): boolean {
    return !!(this.cameraRef?.current);
  }
}

export const cameraService = new CameraService();