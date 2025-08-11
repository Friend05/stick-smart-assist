import { useState, useEffect } from 'react';
import { Battery, Bluetooth, BluetoothConnected, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { bluetoothService } from '@/services/bluetoothService';
import { preferencesService } from '@/services/preferencesService';
import { locationService } from '@/services/locationService';
import { smsService } from '@/services/smsService';
import { ttsService } from '@/services/ttsService';

interface HomeScreenProps {
  onOpenSettings: () => void;
}

export function HomeScreen({ onOpenSettings }: HomeScreenProps) {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize services
    initializeServices();
    loadBatteryLevel();
    
    // Set up battery callback
    bluetoothService.setBatteryCallback((level) => {
      setBatteryLevel(level);
      preferencesService.saveBatteryLevel(level);
      
      // Trigger TTS warning for low battery
      if (level <= 20) {
        ttsService.speakBatteryWarning(level);
      }
    });
  }, []);

  const initializeServices = async () => {
    try {
      await bluetoothService.initialize();
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      toast({
        title: "Bluetooth Error",
        description: "Failed to initialize Bluetooth. Please check your device settings.",
        variant: "destructive"
      });
    }
  };

  const loadBatteryLevel = async () => {
    const level = await preferencesService.getBatteryLevel();
    if (level !== null) {
      setBatteryLevel(level);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const devices = await bluetoothService.scanForDevices();
      
      if (devices.length > 0) {
        await bluetoothService.connect(devices[0]);
        setIsConnected(true);
        await ttsService.speakConnectionStatus(true);
        toast({
          title: "Connected",
          description: "Successfully connected to Smart Stick",
          variant: "default"
        });
      } else {
        toast({
          title: "No Device Found",
          description: "Make sure your Smart Stick is turned on and nearby",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Smart Stick",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothService.disconnect();
      setIsConnected(false);
      await ttsService.speakConnectionStatus(false);
      toast({
        title: "Disconnected",
        description: "Smart Stick disconnected",
        variant: "default"
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleDebugScan = async () => {
    try {
      const devices = await bluetoothService.scanForDevices(true, 7000);
      console.log('All BLE devices:', devices);
      if (!devices || devices.length === 0) {
        toast({
          title: "Scan Complete",
          description: "No BLE devices found nearby",
          variant: "destructive"
        });
        return;
      }
      const list = devices.map((d) => d.name || d.deviceId).slice(0, 5).join(', ');
      toast({
        title: `Found ${devices.length} device${devices.length > 1 ? 's' : ''}`,
        description: list,
        variant: "default"
      });
    } catch (error) {
      console.error('Debug scan failed:', error);
      toast({
        title: "Scan Failed",
        description: "Unable to perform BLE scan",
        variant: "destructive"
      });
    }
  };

  const sendDirectionCommand = async (command: () => Promise<void>, direction: string) => {
    if (!isConnected) {
      toast({
        title: "Not Connected",
        description: "Please connect to Smart Stick first",
        variant: "destructive"
      });
      return;
    }

    try {
      await command();
      toast({
        title: `${direction} Command Sent`,
        description: "Command sent to Smart Stick",
        variant: "default"
      });
    } catch (error) {
      console.error(`Failed to send ${direction} command:`, error);
      toast({
        title: "Command Failed",
        description: `Failed to send ${direction} command`,
        variant: "destructive"
      });
    }
  };

  const handleSOS = async () => {
    try {
      const preferences = await preferencesService.getPreferences();
      
      if (!preferences.emergencyContact) {
        toast({
          title: "No Emergency Contact",
          description: "Please set an emergency contact in Settings",
          variant: "destructive"
        });
        return;
      }

      // Check location permissions
      const hasPermission = await locationService.checkPermissions() || 
                           await locationService.requestPermissions();
      
      if (!hasPermission) {
        toast({
          title: "Location Permission Required",
          description: "Location access is needed for emergency SMS",
          variant: "destructive"
        });
        return;
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      const locationMessage = locationService.formatLocationForSMS(location);
      
      // Send SMS
      await smsService.sendSMS({
        number: preferences.emergencyContact,
        message: locationMessage
      });

      // Speak SOS alert
      await ttsService.speak("Emergency SMS sent with current location", 'high');
      
      toast({
        title: "SOS Sent",
        description: "Emergency SMS sent with your location",
        variant: "default"
      });
    } catch (error) {
      console.error('SOS failed:', error);
      toast({
        title: "SOS Failed",
        description: "Failed to send emergency SMS",
        variant: "destructive"
      });
    }
  };

  const getBatteryColor = () => {
    if (batteryLevel === null) return 'text-muted-foreground';
    if (batteryLevel > 50) return 'battery-high';
    if (batteryLevel > 20) return 'battery-medium';
    return 'battery-low';
  };

  const getBatteryIcon = () => {
    if (batteryLevel !== null && batteryLevel <= 20) {
      return <AlertTriangle className="w-6 h-6 text-emergency animate-pulse" />;
    }
    return <Battery className={`w-6 h-6 ${getBatteryColor()}`} />;
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <h1 className="text-3xl font-bold text-foreground">Smart Stick</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="touch-button"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </div>

      {/* Battery Status */}
      <Card className="status-card">
        <div className="flex items-center justify-center space-x-3">
          {getBatteryIcon()}
          <span className={`text-2xl font-semibold ${getBatteryColor()}`}>
            Battery: {batteryLevel !== null ? `${batteryLevel}%` : 'Unknown'}
          </span>
        </div>
      </Card>

      {/* Connection Status */}
      <div className="text-center">
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-success">
              <BluetoothConnected className="w-6 h-6" />
              <span className="text-lg font-medium">Connected to Smart Stick</span>
            </div>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="touch-button"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Bluetooth className="w-6 h-6" />
              <span className="text-lg font-medium">Not Connected</span>
            </div>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="touch-button-primary"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Smart Stick'}
            </Button>
            <Button
              onClick={handleDebugScan}
              variant="secondary"
              className="touch-button"
            >
              Debug: Scan all BLE devices
            </Button>
          </div>
        )}
      </div>

      {/* Direction Controls */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Direction Controls</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => sendDirectionCommand(() => bluetoothService.turnLeft(), 'Left Turn')}
            disabled={!isConnected}
            className="direction-button"
          >
            ←<br />Left
          </Button>
          
          <Button
            onClick={() => sendDirectionCommand(() => bluetoothService.turnRight(), 'Right Turn')}
            disabled={!isConnected}
            className="direction-button"
          >
            →<br />Right
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => sendDirectionCommand(() => bluetoothService.uTurn(), 'U-Turn')}
            disabled={!isConnected}
            className="direction-button"
          >
            ↺<br />U-Turn
          </Button>
          
          <Button
            onClick={() => sendDirectionCommand(() => bluetoothService.stop(), 'Stop')}
            disabled={!isConnected}
            className="direction-button"
          >
            ⏹<br />Stop
          </Button>
        </div>
      </div>

      {/* SOS Button */}
      <div className="pt-6">
        <Button
          onClick={handleSOS}
          className="touch-button-emergency w-full h-20 text-2xl font-bold"
        >
          🚨 SOS EMERGENCY 🚨
        </Button>
      </div>
    </div>
  );
}