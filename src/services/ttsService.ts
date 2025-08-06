import { TextToSpeech } from '@capacitor-community/text-to-speech';

class TTSService {
  async speak(text: string, priority: 'low' | 'normal' | 'high' = 'normal'): Promise<void> {
    try {
      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient'
      });
    } catch (error) {
      console.error('Failed to speak text:', error);
      // Fallback to console for web testing
      console.log(`TTS: ${text}`);
    }
  }

  async stop(): Promise<void> {
    try {
      await TextToSpeech.stop();
    } catch (error) {
      console.error('Failed to stop TTS:', error);
    }
  }

  async speakBatteryWarning(batteryLevel: number): Promise<void> {
    if (batteryLevel <= 10) {
      await this.speak(`Critical battery warning! Battery level is ${batteryLevel} percent. Please charge your Smart Stick immediately.`, 'high');
    } else if (batteryLevel <= 20) {
      await this.speak(`Low battery warning. Battery level is ${batteryLevel} percent.`, 'normal');
    }
  }

  async speakConnectionStatus(connected: boolean): Promise<void> {
    if (connected) {
      await this.speak('Smart Stick connected successfully.', 'normal');
    } else {
      await this.speak('Smart Stick disconnected.', 'normal');
    }
  }
}

export const ttsService = new TTSService();