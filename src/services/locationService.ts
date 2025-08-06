import { Geolocation } from '@capacitor/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

class LocationService {
  async getCurrentLocation(): Promise<LocationData> {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy,
        timestamp: coordinates.timestamp
      };
    } catch (error) {
      console.error('Failed to get location:', error);
      throw error;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Failed to check location permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Failed to request location permissions:', error);
      return false;
    }
  }

  formatLocationForSMS(location: LocationData): string {
    return `Emergency! Current location: https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  }
}

export const locationService = new LocationService();