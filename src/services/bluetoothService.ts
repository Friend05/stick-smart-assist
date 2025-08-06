import { BleClient, BleDevice, numbersToDataView, dataViewToNumbers } from '@capacitor-community/bluetooth-le';

export interface SmartStickDevice {
  device: BleDevice;
  connected: boolean;
}

class BluetoothService {
  private device: BleDevice | null = null;
  private connected = false;
  private batteryCallback: ((battery: number) => void) | null = null;
  
  // ESP32 service and characteristic UUIDs (you'll need to match these with your ESP32 code)
  private readonly SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
  private readonly CONTROL_CHAR_UUID = '87654321-4321-4321-4321-cba987654321';
  private readonly BATTERY_CHAR_UUID = '11111111-2222-3333-4444-555555555555';

  async initialize(): Promise<void> {
    try {
      await BleClient.initialize();
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      throw error;
    }
  }

  async scanForDevices(): Promise<BleDevice[]> {
    try {
      await BleClient.requestLEScan(
        { services: [this.SERVICE_UUID] },
        (result) => {
          console.log('Found device:', result);
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
      }, 10000);

      return [];
    } catch (error) {
      console.error('Failed to scan for devices:', error);
      throw error;
    }
  }

  async connect(device: BleDevice): Promise<void> {
    try {
      await BleClient.connect(device.deviceId);
      this.device = device;
      this.connected = true;
      
      // Start listening for battery updates
      await this.startBatteryMonitoring();
    } catch (error) {
      console.error('Failed to connect to device:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.device) {
        await BleClient.disconnect(this.device.deviceId);
        this.device = null;
        this.connected = false;
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.device || !this.connected) {
      throw new Error('Not connected to Smart Stick');
    }

    try {
      const data = new TextEncoder().encode(command);
      await BleClient.write(
        this.device.deviceId,
        this.SERVICE_UUID,
        this.CONTROL_CHAR_UUID,
        numbersToDataView(Array.from(data))
      );
    } catch (error) {
      console.error('Failed to send command:', error);
      throw error;
    }
  }

  private async startBatteryMonitoring(): Promise<void> {
    if (!this.device) return;

    try {
      await BleClient.startNotifications(
        this.device.deviceId,
        this.SERVICE_UUID,
        this.BATTERY_CHAR_UUID,
        (value) => {
          const data = new TextDecoder().decode(value.buffer);
          // Expecting format "BAT:72"
          const match = data.match(/BAT:(\d+)/);
          if (match && this.batteryCallback) {
            const batteryLevel = parseInt(match[1]);
            this.batteryCallback(batteryLevel);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start battery monitoring:', error);
    }
  }

  setBatteryCallback(callback: (battery: number) => void): void {
    this.batteryCallback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getDevice(): BleDevice | null {
    return this.device;
  }

  // Direction commands
  async turnLeft(): Promise<void> {
    await this.sendCommand('L');
  }

  async turnRight(): Promise<void> {
    await this.sendCommand('R');
  }

  async uTurn(): Promise<void> {
    await this.sendCommand('U');
  }

  async stop(): Promise<void> {
    await this.sendCommand('END');
  }

  // Test commands
  async testLeft(): Promise<void> {
    await this.sendCommand('TEST_L');
  }

  async testRight(): Promise<void> {
    await this.sendCommand('TEST_R');
  }

  async testUTurn(): Promise<void> {
    await this.sendCommand('TEST_U');
  }
}

export const bluetoothService = new BluetoothService();