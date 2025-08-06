import { Preferences } from '@capacitor/preferences';

export interface UserPreferences {
  vibrationStrength: 'Low' | 'Medium' | 'High';
  turnTiming: '3s' | '5s' | '7s';
  emergencyContact: string;
  batteryLevel?: number;
}

class PreferencesService {
  private readonly PREFS_KEY = 'smart_stick_preferences';
  private readonly BATTERY_KEY = 'smart_stick_battery';

  async getPreferences(): Promise<UserPreferences> {
    try {
      const { value } = await Preferences.get({ key: this.PREFS_KEY });
      if (value) {
        return JSON.parse(value);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }

    // Return default preferences
    return {
      vibrationStrength: 'Medium',
      turnTiming: '5s',
      emergencyContact: ''
    };
  }

  async savePreferences(preferences: UserPreferences): Promise<void> {
    try {
      await Preferences.set({
        key: this.PREFS_KEY,
        value: JSON.stringify(preferences)
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  async getBatteryLevel(): Promise<number | null> {
    try {
      const { value } = await Preferences.get({ key: this.BATTERY_KEY });
      return value ? parseInt(value) : null;
    } catch (error) {
      console.error('Failed to get battery level:', error);
      return null;
    }
  }

  async saveBatteryLevel(level: number): Promise<void> {
    try {
      await Preferences.set({
        key: this.BATTERY_KEY,
        value: level.toString()
      });
    } catch (error) {
      console.error('Failed to save battery level:', error);
    }
  }

  async updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ): Promise<void> {
    const preferences = await this.getPreferences();
    preferences[key] = value;
    await this.savePreferences(preferences);
  }
}

export const preferencesService = new PreferencesService();