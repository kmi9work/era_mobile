import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { Resource } from '../types';
import ResourceIcon from './ResourceIcon';
import CustomNumericKeyboard from './CustomNumericKeyboard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ResourceQuantitySelectorProps {
  resource: Resource;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

const ResourceQuantitySelector: React.FC<ResourceQuantitySelectorProps> = ({
  resource,
  onConfirm,
  onCancel
}) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>('1');

  const handleNumberPress = (number: string) => {
    const newValue = inputValue === '0' ? number : inputValue + number;
    const num = parseInt(newValue);
    
    if (!isNaN(num) && num >= 0) {
      const maxQuantity = Math.min(num, resource.count);
      setQuantity(maxQuantity);
      setInputValue(maxQuantity.toString());
    }
  };

  const handleDeletePress = () => {
    if (inputValue.length > 1) {
      const newValue = inputValue.slice(0, -1);
      const num = parseInt(newValue);
      setQuantity(num);
      setInputValue(newValue);
    } else {
      setQuantity(0);
      setInputValue('0');
    }
  };

  const handleClearPress = () => {
    setQuantity(0);
    setInputValue('0');
  };

  const handleIncrement = () => {
    if (quantity < resource.count) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      setInputValue(newQuantity.toString());
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      setInputValue(newQuantity.toString());
    }
  };

  const handleMax = () => {
    setQuantity(resource.count);
    setInputValue(resource.count.toString());
  };

  const handleConfirm = () => {
    if (quantity <= 0) {
      Alert.alert('Ошибка', 'Выберите количество больше 0');
      return;
    }
    if (quantity > resource.count) {
      Alert.alert('Ошибка', 'Нельзя выбрать больше доступного количества');
      return;
    }
    onConfirm(quantity);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Выбор количества</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
          {/* Информация о ресурсе */}
          <View style={styles.resourceInfo}>
            <View style={styles.resourceHeader}>
              <ResourceIcon 
                identificator={resource.identificator} 
                size={Math.min(screenWidth * 0.15, 64)}
              />
              <View style={styles.resourceDetails}>
                <Text style={styles.resourceName}>
                  {getResourceDisplayName(resource.identificator)}
                </Text>
                <Text style={styles.availableCount}>
                  Доступно: {resource.count}
                </Text>
              </View>
            </View>
          </View>

        {/* Выбор количества */}
        <View style={styles.quantitySection}>
          <Text style={styles.quantityTitle}>Выберите количество</Text>
          <Text style={styles.quantitySubtitle}>
            Используйте цифровую клавиатуру ниже или кнопки +/-
          </Text>
          
          <View style={styles.quantityDisplay}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleDecrement}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              
              <View style={styles.quantityInputContainer}>
                <Text style={styles.quantityInput}>
                  {inputValue}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={handleIncrement}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.maxButton}
                onPress={handleMax}
              >
                <Text style={styles.maxButtonText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>

      {/* Собственная цифровая клавиатура */}
      <View style={styles.keyboardContainer}>
        <CustomNumericKeyboard
          onNumberPress={handleNumberPress}
          onDeletePress={handleDeletePress}
          onClearPress={handleClearPress}
          onConfirmPress={handleConfirm}
          disabled={false}
        />
      </View>
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
    padding: screenWidth * 0.05,
    paddingTop: screenHeight * 0.06,
    backgroundColor: '#1976d2',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    color: 'white',
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: '600',
  },
  title: {
    fontSize: Math.min(screenWidth * 0.05, 20),
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: screenWidth * 0.05,
  },
  resourceInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: screenWidth * 0.05,
    marginBottom: screenHeight * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceDetails: {
    marginLeft: screenWidth * 0.05,
    flex: 1,
  },
  resourceName: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  availableCount: {
    fontSize: Math.min(screenWidth * 0.04, 16),
    color: '#666',
  },
  quantitySection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: screenWidth * 0.05,
    marginBottom: screenHeight * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityTitle: {
    fontSize: Math.min(screenWidth * 0.045, 18),
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  quantitySubtitle: {
    fontSize: Math.min(screenWidth * 0.035, 14),
    color: '#666',
    marginBottom: screenHeight * 0.02,
    fontStyle: 'italic',
  },
  quantityDisplay: {
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  quantityButton: {
    backgroundColor: '#1976d2',
    width: Math.min(screenWidth * 0.12, 50),
    height: Math.min(screenWidth * 0.12, 50),
    borderRadius: Math.min(screenWidth * 0.06, 25),
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: 'bold',
  },
  quantityInputContainer: {
    marginHorizontal: screenWidth * 0.04,
    minWidth: screenWidth * 0.2,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: screenHeight * 0.015,
    paddingHorizontal: screenWidth * 0.04,
    backgroundColor: 'white',
  },
  quantityInput: {
    fontSize: Math.min(screenWidth * 0.06, 24),
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  maxButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderRadius: 8,
    marginLeft: screenWidth * 0.04,
  },
  maxButtonText: {
    color: 'white',
    fontSize: Math.min(screenWidth * 0.04, 16),
    fontWeight: 'bold',
  },
  keyboardContainer: {
    paddingBottom: screenHeight * 0.05, // Отступ снизу, чтобы кнопка "Готово" не залезала на системные кнопки
  },
});

export default ResourceQuantitySelector;
