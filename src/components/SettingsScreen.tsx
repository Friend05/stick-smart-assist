import { useState, useEffect } from 'react';
import { ArrowLeft, Save, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { preferencesService, UserPreferences } from '@/services/preferencesService';
import { bluetoothService } from '@/services/bluetoothService';

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    vibrationStrength: 'Medium',
    turnTiming: '5s',
    emergencyContact: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await preferencesService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await preferencesService.savePreferences(preferences);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been saved successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestVibration = async (testType: 'TEST_L' | 'TEST_R' | 'TEST_U') => {
    if (!bluetoothService.isConnected()) {
      toast({
        title: "Not Connected",
        description: "Please connect to Smart Stick first",
        variant: "destructive"
      });
      return;
    }

    try {
      switch (testType) {
        case 'TEST_L':
          await bluetoothService.testLeft();
          break;
        case 'TEST_R':
          await bluetoothService.testRight();
          break;
        case 'TEST_U':
          await bluetoothService.testUTurn();
          break;
      }
      
      const testName = testType === 'TEST_L' ? 'Left' : testType === 'TEST_R' ? 'Right' : 'U-Turn';
      toast({
        title: "Test Sent",
        description: `${testName} vibration test sent`,
        variant: "default"
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Test Failed",
        description: "Failed to send test command",
        variant: "destructive"
      });
    }
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const isValidPhoneNumber = (phone: string) => {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 pt-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="touch-button"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Vibration Settings */}
      <Card className="status-card space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Vibration Settings</h2>
        
        <div className="space-y-2">
          <Label htmlFor="vibration-strength" className="text-base font-medium">
            Vibration Strength
          </Label>
          <Select
            value={preferences.vibrationStrength}
            onValueChange={(value: 'Low' | 'Medium' | 'High') => 
              updatePreference('vibrationStrength', value)
            }
          >
            <SelectTrigger className="touch-button">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="turn-timing" className="text-base font-medium">
            Turn Duration
          </Label>
          <Select
            value={preferences.turnTiming}
            onValueChange={(value: '3s' | '5s' | '7s') => 
              updatePreference('turnTiming', value)
            }
          >
            <SelectTrigger className="touch-button">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3s">3 seconds</SelectItem>
              <SelectItem value="5s">5 seconds</SelectItem>
              <SelectItem value="7s">7 seconds</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Test Vibration */}
      <Card className="status-card space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Test Vibration</h2>
        
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => handleTestVibration('TEST_L')}
            variant="outline"
            className="touch-button flex flex-col items-center space-y-2"
          >
            <TestTube className="w-5 h-5" />
            <span>Test Left</span>
          </Button>
          
          <Button
            onClick={() => handleTestVibration('TEST_R')}
            variant="outline"
            className="touch-button flex flex-col items-center space-y-2"
          >
            <TestTube className="w-5 h-5" />
            <span>Test Right</span>
          </Button>
          
          <Button
            onClick={() => handleTestVibration('TEST_U')}
            variant="outline"
            className="touch-button flex flex-col items-center space-y-2"
          >
            <TestTube className="w-5 h-5" />
            <span>Test U-Turn</span>
          </Button>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="status-card space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Emergency Contact</h2>
        
        <div className="space-y-2">
          <Label htmlFor="emergency-contact" className="text-base font-medium">
            Phone Number
          </Label>
          <Input
            id="emergency-contact"
            type="tel"
            placeholder="+1234567890"
            value={preferences.emergencyContact}
            onChange={(e) => updatePreference('emergencyContact', e.target.value)}
            className="touch-button text-lg"
          />
          <p className="text-sm text-muted-foreground">
            This number will receive SMS alerts during emergencies
          </p>
          {preferences.emergencyContact && !isValidPhoneNumber(preferences.emergencyContact) && (
            <p className="text-sm text-emergency">
              Please enter a valid phone number
            </p>
          )}
        </div>
      </Card>

      {/* Save Button */}
      <div className="pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving || (preferences.emergencyContact && !isValidPhoneNumber(preferences.emergencyContact))}
          className="touch-button-success w-full h-16 text-xl font-semibold flex items-center justify-center space-x-3"
        >
          <Save className="w-6 h-6" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </Button>
      </div>
    </div>
  );
}