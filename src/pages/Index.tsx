import { useState } from 'react';
import { HomeScreen } from '@/components/HomeScreen';
import { SettingsScreen } from '@/components/SettingsScreen';

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen 
        onBack={() => setCurrentScreen('home')} 
      />
    );
  }

  return (
    <HomeScreen 
      onOpenSettings={() => setCurrentScreen('settings')} 
    />
  );
};

export default Index;
