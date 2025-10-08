import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Player } from './types';
import ApiService from './api';
import QRCodeScanner from './QRCodeScanner';

interface LoginScreenProps {
  onLoginSuccess: (player: Player) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [identificator, setIdentificator] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleLogin = async () => {
    if (!identificator.trim()) {
      Alert.alert('Ошибка', 'Введите идентификатор игрока');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login(identificator.trim());
      if (response.success && response.player) {
        onLoginSuccess(response.player);
      } else {
        Alert.alert('Ошибка входа', response.message || 'Неверный идентификатор');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (scannedData: string) => {
    setIdentificator(scannedData);
    setShowQRScanner(false);
    // Автоматически пытаемся войти после сканирования
    // Используем setTimeout чтобы дать время на обновление состояния
    setTimeout(() => {
      handleLoginWithIdentificator(scannedData);
    }, 100);
  };

  const handleLoginWithIdentificator = async (identificatorValue: string) => {
    if (!identificatorValue.trim()) {
      Alert.alert('Ошибка', 'Введите идентификатор игрока');
      return;
    }

    setLoading(true);
    try {
      const response = await ApiService.login(identificatorValue.trim());
      if (response.success && response.player) {
        onLoginSuccess(response.player);
      } else {
        Alert.alert('Ошибка входа', response.message || 'Неверный идентификатор');
      }
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  if (showQRScanner) {
    return (
      <QRCodeScanner 
        onScan={handleQRScan}
        onClose={() => setShowQRScanner(false)}
        confirmBeforeLogin={true}
        confirmTitle="Подтверждение входа"
        confirmMessage="Войти с идентификатором"
      />
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Эпоха перемен</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Идентификатор игрока</Text>
            <TextInput
              style={styles.input}
              value={identificator}
              onChangeText={setIdentificator}
              placeholder="Введите идентификатор игрока"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Вход...' : 'Войти'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => setShowQRScanner(true)}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                📷 Сканировать QR-код
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Отсканируйте QR-код{'\n'}
              Или введите идентификатор вручную
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1976d2',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryButtonText: {
    color: '#1976d2',
  },
  infoContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  infoText: {
    color: '#1976d2',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoginScreen;