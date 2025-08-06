import { Device } from '@capacitor/device';

export interface SMSOptions {
  number: string;
  message: string;
}

class SMSService {
  async sendSMS(options: SMSOptions): Promise<void> {
    try {
      // Check if we're on a mobile platform
      const info = await Device.getInfo();
      
      if (info.platform === 'android' || info.platform === 'ios') {
        // Use the device's SMS app
        const smsUrl = `sms:${options.number}?body=${encodeURIComponent(options.message)}`;
        window.open(smsUrl, '_system');
      } else {
        // Fallback for web/testing
        console.log('SMS would be sent:', options);
        alert(`SMS would be sent to ${options.number}: ${options.message}`);
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  async canSendSMS(): Promise<boolean> {
    try {
      const info = await Device.getInfo();
      return info.platform === 'android' || info.platform === 'ios';
    } catch (error) {
      console.error('Failed to check SMS capability:', error);
      return false;
    }
  }
}

export const smsService = new SMSService();