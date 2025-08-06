import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.ff592ba250f4481d8c88a839eef34081',
  appName: 'Smart Stick',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: "Scanning for Smart Stick...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No Smart Stick found"
      }
    },
    Geolocation: {
      permissions: {
        location: "always"
      }
    }
  }
};

export default config;