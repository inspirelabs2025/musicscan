import { Capacitor } from '@capacitor/core';

export class NativeAudioRecorder {
  static async startRecording() {
    if (Capacitor.isNativePlatform()) {
      // Use native audio recording
      const { MediaRecorder } = await import('@capacitor-community/media');
      return MediaRecorder.startRecording({
        format: 'mp4', // iOS compatible
        quality: 'high'
      });
    } else {
      // Fallback naar web MediaRecorder API
      return this.startWebRecording();
    }
  }
  
  static async stopRecording() {
    // Implementation
  }
}