import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Player, Resource } from './types';
import ApiService from './api';
import ResourceIcon from './components/ResourceIcon';
import QRCodeScanner from './QRCodeScanner';
import ResourceQuantitySelector from './components/ResourceQuantitySelector';

interface MyResourcesScreenProps {
  player: Player;
  onBack: () => void;
}

interface SelectedResource extends Resource {
  selectedCount: number;
}

const MyResourcesScreen: React.FC<MyResourcesScreenProps> = ({ player, onBack }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Exchange-related states
  const [isExchangeMode, setIsExchangeMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  const [recipientId, setRecipientId] = useState<string>('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [exchangeStep, setExchangeStep] = useState<'select_recipient' | 'select_resources' | 'select_quantity'>('select_recipient');
  const [selectedResourceForQuantity, setSelectedResourceForQuantity] = useState<Resource | null>(null);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
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

  // Exchange functions
  const startExchange = () => {
    setIsExchangeMode(true);
    setExchangeStep('select_recipient');
    setRecipientId('');
    setSelectedResources([]);
  };

  const cancelExchange = () => {
    setIsExchangeMode(false);
    setExchangeStep('select_recipient');
    setRecipientId('');
    setSelectedResources([]);
    setSelectedResourceForQuantity(null);
  };

  const handleQRScan = (data: string) => {
    setRecipientId(data);
    setShowQRScanner(false);
    setExchangeStep('select_resources');
  };

  const handleRecipientConfirm = () => {
    if (!recipientId.trim()) {
      Alert.alert('Ошибка', 'Укажите получателя ресурсов');
      return;
    }
    setExchangeStep('select_resources');
  };

  const handleCancelRecipient = () => {
    setRecipientId('');
    setExchangeStep('select_recipient');
  };

  const handleResourceSelect = (resource: Resource) => {
    setSelectedResourceForQuantity(resource);
    setExchangeStep('select_quantity');
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedResourceForQuantity) return;

    const existing = selectedResources.find(r => r.identificator === selectedResourceForQuantity.identificator);
    if (existing) {
      setSelectedResources(prev => 
        prev.map(r => 
          r.identificator === selectedResourceForQuantity.identificator 
            ? { ...r, selectedCount: quantity }
            : r
        )
      );
    } else {
      setSelectedResources(prev => [...prev, {
        ...selectedResourceForQuantity,
        selectedCount: quantity
      }]);
    }

    setSelectedResourceForQuantity(null);
    setExchangeStep('select_resources');
  };

  const handleQuantityCancel = () => {
    setSelectedResourceForQuantity(null);
    setExchangeStep('select_resources');
  };

  const handleResourceDeselect = (identificator: string) => {
    setSelectedResources(prev => prev.filter(r => r.identificator !== identificator));
  };

  const handleExchange = async () => {
    if (selectedResources.length === 0) {
      Alert.alert('Ошибка', 'Выберите ресурсы для передачи');
      return;
    }

    Alert.alert(
      'Подтверждение передачи',
      `Передать ресурсы игроку ${recipientId}?\n\n${selectedResources.map(r => 
        `${r.name || getResourceDisplayName(r.identificator)}: ${r.selectedCount}`
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
                  identificator: r.identificator,
                  count: r.selectedCount,
                  name: r.name
                }))
              };

              const result = await ApiService.exchangeResources(player.id, request);
              
              if (result.success) {
                Alert.alert('Успех', 'Ресурсы успешно переданы!', [
                  { text: 'OK', onPress: () => {
                    cancelExchange();
                    loadResources();
                  }}
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Мои ресурсы</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Загрузка ресурсов...</Text>
        </View>
      </View>
    );
  }

  // Render exchange recipient selection
  const renderSelectRecipientStep = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={cancelExchange}>
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

  // Render exchange resource selection
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
        <View style={styles.resourcesContainer}>
          {resources.map((resource) => (
            <TouchableOpacity
              key={resource.identificator}
              style={styles.resourceCard}
              onPress={() => handleResourceSelect(resource)}
              disabled={isExchanging}
            >
              <View style={styles.resourceInfo}>
                <ResourceIcon 
                  identificator={resource.identificator} 
                  size={48}
                />
                <View style={styles.resourceDetails}>
                  <Text style={styles.resourceName}>
                    {resource.name || getResourceDisplayName(resource.identificator)}
                  </Text>
                </View>
              </View>
              <View style={styles.resourceCount}>
                <Text style={styles.resourceCountText}>{resource.count}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Выбранные ресурсы */}
        {selectedResources.length > 0 && (
          <View style={styles.resourcesContainer}>
            <Text style={styles.sectionTitle}>Выбранные ресурсы</Text>
            {selectedResources.map((resource) => (
              <View key={resource.identificator} style={styles.selectedResourceCard}>
                <View style={styles.resourceInfo}>
                  <ResourceIcon 
                    identificator={resource.identificator} 
                    size={48}
                  />
                  <View style={styles.resourceDetails}>
                    <Text style={styles.resourceName}>
                      {resource.name || getResourceDisplayName(resource.identificator)}
                    </Text>
                  </View>
                </View>
                <View style={styles.selectedResourceActions}>
                  <View style={styles.resourceCount}>
                    <Text style={styles.resourceCountText}>{resource.selectedCount}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleResourceDeselect(resource.identificator)}
                    disabled={isExchanging}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
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

  // Main view - show resources
  if (isExchangeMode) {
    return (
      <>
        {exchangeStep === 'select_recipient' && renderSelectRecipientStep()}
        {exchangeStep === 'select_resources' && renderSelectResourcesStep()}
        {exchangeStep === 'select_quantity' && selectedResourceForQuantity && (
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
            confirmMessage="Передать ресурсы игроку"
          />
        </Modal>
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Мои ресурсы</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadResources}>
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Кнопка передачи ресурсов */}
        <TouchableOpacity 
          style={styles.transferButton}
          onPress={startExchange}
        >
          <Text style={styles.transferButtonText}>🔄 Передать ресурсы</Text>
        </TouchableOpacity>

        {/* Список ресурсов */}
        <View style={styles.resourcesContainer}>
          <Text style={styles.sectionTitle}>Все ресурсы</Text>
          
          {resources.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>У вас пока нет ресурсов</Text>
            </View>
          ) : (
            resources.map((resource) => (
              <View key={resource.identificator} style={styles.resourceCard}>
                <View style={styles.resourceInfo}>
                  <ResourceIcon 
                    identificator={resource.identificator} 
                    size={48}
                  />
                  <View style={styles.resourceDetails}>
                    <Text style={styles.resourceName}>
                      {resource.name || getResourceDisplayName(resource.identificator)}
                    </Text>
                  </View>
                </View>
                <View style={styles.resourceCount}>
                  <Text style={styles.resourceCountText}>{resource.count}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 40,
    backgroundColor: '#1976d2',
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  resourcesContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  resourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resourceCount: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 50,
    alignItems: 'center',
  },
  resourceCountText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Transfer button styles
  transferButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Exchange mode styles
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
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  selectedResourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  selectedResourceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginBottom: 20,
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
    height: 150,
  },
});

export default MyResourcesScreen;



