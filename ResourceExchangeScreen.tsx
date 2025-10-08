import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Player, Resource } from './types';
import QRCodeScanner from './QRCodeScanner';
import ApiService from './api';
import ResourceIcon from './components/ResourceIcon';
import ResourceQuantitySelector from './components/ResourceQuantitySelector';

interface ResourceExchangeScreenProps {
  player: Player;
  onBack: () => void;
}

interface SelectedResource extends Resource {
  selectedCount: number;
}

const ResourceExchangeScreen: React.FC<ResourceExchangeScreenProps> = ({ player, onBack }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  const [recipientId, setRecipientId] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [step, setStep] = useState<'select_recipient' | 'select_resources' | 'select_quantity'>('select_recipient');
  const [selectedResourceForQuantity, setSelectedResourceForQuantity] = useState<Resource | null>(null);

  useEffect(() => {
    loadPlayerResources();
  }, []);

  const loadPlayerResources = async () => {
    setIsLoading(true);
    try {
      const playerResources = await ApiService.getPlayerResources(player.id);
      setResources(playerResources);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось загрузить ресурсы');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceSelect = (resource: Resource) => {
    // Открываем экран выбора количества для этого ресурса
    setSelectedResourceForQuantity(resource);
    setStep('select_quantity');
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedResourceForQuantity) return;

    const existing = selectedResources.find(r => r.identificator === selectedResourceForQuantity.identificator);
    if (existing) {
      // Обновляем существующий ресурс
      setSelectedResources(prev => 
        prev.map(r => 
          r.identificator === selectedResourceForQuantity.identificator 
            ? { ...r, selectedCount: quantity }
            : r
        )
      );
    } else {
      // Добавляем новый ресурс
      setSelectedResources(prev => [...prev, {
        ...selectedResourceForQuantity,
        selectedCount: quantity
      }]);
    }

    // Возвращаемся к экрану выбора ресурсов
    setSelectedResourceForQuantity(null);
    setStep('select_resources');
  };

  const handleQuantityCancel = () => {
    setSelectedResourceForQuantity(null);
    setStep('select_resources');
  };

  const handleResourceDeselect = (identificator: string) => {
    setSelectedResources(prev => prev.filter(r => r.identificator !== identificator));
  };

  const handleQRScan = (data: string) => {
    setRecipientId(data);
    setShowQRScanner(false);
    // Переходим к выбору ресурсов после выбора получателя
    setStep('select_resources');
  };

  const handleRecipientConfirm = () => {
    if (!recipientId.trim()) {
      Alert.alert('Ошибка', 'Укажите получателя ресурсов');
      return;
    }
    setStep('select_resources');
  };

  const handleCancelRecipient = () => {
    setRecipientId('');
    setStep('select_recipient');
  };

  const handleExchange = async () => {
    if (selectedResources.length === 0) {
      Alert.alert('Ошибка', 'Выберите ресурсы для передачи');
      return;
    }

    Alert.alert(
      'Подтверждение передачи',
      `Передать ресурсы игроку ${recipientId}?\n\n${selectedResources.map(r => 
        `${getResourceDisplayName(r.identificator)}: ${r.selectedCount}`
      ).join('\n')}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Передать',
          onPress: async () => {
            setIsExchanging(true);
            try {
              const request = {
                with_whom: recipientId,
                hashed_resources: selectedResources.map(r => ({
                  name: r.name,
                  identificator: r.identificator,
                  count: r.selectedCount
                }))
              };

              const result = await ApiService.exchangeResources(player.id, request);
              
              if (result.success) {
                Alert.alert('Успех', 'Ресурсы успешно переданы!', [
                  { text: 'OK', onPress: onBack }
                ]);
              } else {
                Alert.alert('Ошибка', result.error || 'Не удалось передать ресурсы');
              }
            } catch (error) {
              Alert.alert('Ошибка', 'Произошла ошибка при передаче ресурсов');
            } finally {
              setIsExchanging(false);
            }
          }
        }
      ]
    );
  };

  const getResourceDisplayName = (identificator: string) => {
    const names: { [key: string]: string } = {
      'gold': 'Золото',
      'wood': 'Дерево',
      'stone': 'Камень',
      'food': 'Еда',
      'iron': 'Железо',
      'coal': 'Уголь',
      'grain': 'Зерно',
      'cloth': 'Ткань'
    };
    return names[identificator] || identificator;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Загрузка ресурсов...</Text>
      </View>
    );
  }

  const renderSelectRecipientStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Выбор получателя</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите получателя ресурсов</Text>
          <Text style={styles.sectionSubtitle}>
            Введите идентификатор игрока или отсканируйте QR-код
          </Text>
          <View style={styles.recipientContainer}>
            <TextInput
              style={styles.recipientInput}
              placeholder="Идентификатор игрока"
              value={recipientId}
              onChangeText={setRecipientId}
              editable={!isExchanging}
            />
            <TouchableOpacity 
              style={styles.qrButton} 
              onPress={() => setShowQRScanner(true)}
              disabled={isExchanging}
            >
              <Text style={styles.qrButtonText}>📷</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.confirmButton, !recipientId.trim() && styles.confirmButtonDisabled]}
              onPress={handleRecipientConfirm}
              disabled={!recipientId.trim()}
            >
              <Text style={styles.confirmButtonText}>Продолжить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSelectResourcesStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancelRecipient}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Выбор ресурсов</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.recipientInfo}>
        <Text style={styles.recipientInfoText}>
          Получатель: {recipientId}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Доступные ресурсы */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Доступные ресурсы</Text>
          <Text style={styles.sectionSubtitle}>
            Нажмите на ресурс для выбора количества
          </Text>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.identificator}
              style={styles.resourceItem}
              onPress={() => handleResourceSelect(resource)}
              disabled={isExchanging}
            >
              <View style={styles.resourceInfo}>
                <View style={styles.resourceHeader}>
                  <ResourceIcon 
                    identificator={resource.identificator} 
                    size={32}
                  />
                  <Text style={styles.resourceName}>
                    {getResourceDisplayName(resource.identificator)}
                  </Text>
                </View>
                <Text style={styles.resourceCount}>
                  Доступно: {resource.count}
                </Text>
              </View>
              <Text style={styles.addButton}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Выбранные ресурсы */}
        {selectedResources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выбранные ресурсы</Text>
            {selectedResources.map((resource) => (
              <View key={resource.identificator} style={styles.selectedResourceItem}>
                <View style={styles.selectedResourceInfo}>
                  <View style={styles.selectedResourceHeader}>
                    <ResourceIcon 
                      identificator={resource.identificator} 
                      size={28}
                    />
                    <Text style={styles.selectedResourceName}>
                      {getResourceDisplayName(resource.identificator)}
                    </Text>
                  </View>
                  <Text style={styles.selectedCount}>
                    Количество: {resource.selectedCount}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleResourceDeselect(resource.identificator)}
                  disabled={isExchanging}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Кнопка передачи */}
        <TouchableOpacity
          style={[styles.exchangeButton, (isExchanging || selectedResources.length === 0) && styles.exchangeButtonDisabled]}
          onPress={handleExchange}
          disabled={isExchanging || selectedResources.length === 0}
        >
          {isExchanging ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.exchangeButtonText}>Передать ресурсы</Text>
          )}
        </TouchableOpacity>

        {/* Дополнительный отступ для системных кнопок */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );

  return (
    <>
      {step === 'select_recipient' && renderSelectRecipientStep()}
      {step === 'select_resources' && renderSelectResourcesStep()}
      {step === 'select_quantity' && selectedResourceForQuantity && (
        <ResourceQuantitySelector
          resource={selectedResourceForQuantity}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
        />
      )}
      
      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
          confirmBeforeLogin={true}
          confirmTitle="Выбор получателя"
          confirmMessage="Передать ресурсы игроку с ID"
        />
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#1976d2',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 60,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  recipientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 10,
  },
  qrButton: {
    backgroundColor: '#1976d2',
    padding: 12,
    borderRadius: 8,
  },
  qrButtonText: {
    color: 'white',
    fontSize: 18,
  },
  resourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  resourceCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    fontSize: 24,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  selectedResourceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  selectedResourceInfo: {
    flex: 1,
  },
  selectedResourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  selectedResourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countButton: {
    backgroundColor: '#1976d2',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: 'center',
  },
  countInput: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 50,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  maxButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  maxButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    backgroundColor: '#f44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exchangeButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Дополнительный отступ снизу
  },
  exchangeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exchangeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 150, // Дополнительный отступ для системных кнопок и клавиатуры
  },
  recipientInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1976d2',
  },
  recipientInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ResourceExchangeScreen;
