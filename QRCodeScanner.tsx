import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  confirmBeforeLogin?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ 
  onScan, 
  onClose, 
  confirmBeforeLogin = false,
  confirmTitle = 'Подтверждение',
  confirmMessage = 'Использовать этот идентификатор'
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const hasPermission = permission?.granted;

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    try {
      // Пытаемся распарсить JSON данные
      const qrData = JSON.parse(data);
      
      if (qrData.type === 'player_auth') {
        // Ищем identificator в разных возможных полях
        const identificator = qrData.identificator || 
                             qrData.player_identificator || 
                             qrData.id ||
                             qrData.player_name; // Fallback на player_name
        
        // Извлекаем имя игрока для отображения
        const playerName = qrData.player_name || qrData.name || identificator;
        
        if (identificator) {
          if (confirmBeforeLogin) {
            setScannedData(identificator);
            setDisplayName(playerName);
            setShowConfirmDialog(true);
          } else {
            onScan(identificator);
          }
        } else {
          Alert.alert('Ошибка', 'QR-код не содержит идентификатор игрока');
          setScanned(false);
        }
      } else {
        // Если это не JSON, возможно это просто идентификатор
        if (confirmBeforeLogin) {
          setScannedData(data);
          setDisplayName(data);
          setShowConfirmDialog(true);
        } else {
          onScan(data);
        }
      }
    } catch (error) {
      // Если не JSON, используем данные как есть
      if (confirmBeforeLogin) {
        setScannedData(data);
        setDisplayName(data);
        setShowConfirmDialog(true);
      } else {
        onScan(data);
      }
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    onScan(scannedData);
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    setScanned(false);
    setScannedData('');
    setDisplayName('');
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Запрос разрешения на камеру...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Нет доступа к камере</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Разрешить доступ к камере</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Закрыть</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Сканирование QR-кода</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.scannerContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        <View style={styles.overlay}>
          <View style={[styles.scanArea, scanned && styles.scanAreaScanned]} />
        </View>
        
        {!scanned && (
          <Text style={styles.instruction}>
            Наведите камеру на QR-код
          </Text>
        )}
        
        {/* Диалог подтверждения поверх камеры */}
        {showConfirmDialog && (
          <View style={styles.confirmDialogOverlay}>
            <View style={styles.confirmDialog}>
              <View style={styles.dialogHeader}>
                <Text style={styles.dialogTitle}>{confirmTitle}</Text>
              </View>
              
              <View style={styles.dialogContent}>
                <Text style={styles.dialogMessage}>{confirmMessage}:</Text>
                <View style={styles.dialogDataContainer}>
                  <Text style={styles.dialogData}>{displayName}</Text>
                </View>
              </View>
              
              <View style={styles.dialogActions}>
                <TouchableOpacity 
                  style={[styles.dialogButton, styles.cancelButton]} 
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Отмена</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dialogButton, styles.confirmButton]} 
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Подтвердить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#1976d2',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  scanAreaScanned: {
    borderColor: '#4caf50',
    borderWidth: 3,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  instruction: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  scannedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    padding: 20,
    alignItems: 'center',
  },
  scannedText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scannedDataText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  scannedHintText: {
    color: '#aaa',
    fontSize: 12,
    fontStyle: 'italic',
  },
  message: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 5,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#1976d2',
  },
  confirmDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmDialog: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dialogHeader: {
    backgroundColor: '#1976d2',
    padding: 20,
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  dialogContent: {
    padding: 24,
  },
  dialogMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  dialogDataContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dialogData: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  dialogActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default QRCodeScanner;