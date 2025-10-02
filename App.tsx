import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Импорт экранов
import LoginScreen from './LoginScreen';
import DashboardScreen from './DashboardScreen';
import { Player } from './types';

// Настройка splash screen
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => {
      setIsLoading(false);
      SplashScreen.hideAsync();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (playerData: Player) => {
    setPlayer(playerData);
  };

  const handleLogout = () => {
    setPlayer(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Splash screen будет показан автоматически */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {player ? (
        <DashboardScreen 
          player={player} 
          onLogout={handleLogout} 
        />
      ) : (
        <LoginScreen onLoginSuccess={handleLogin} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});