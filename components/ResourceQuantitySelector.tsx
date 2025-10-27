import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Resource } from '../types';
import ResourceIcon from './ResourceIcon';
import CustomNumericKeyboard from './CustomNumericKeyboard';

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
  const [quantity, setQuantity] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('0');

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
        <View style={styles.resourceCard}>
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

        {/* Выбор количества с клавиатурой */}
        <View style={styles.quantitySection}>
          <View style={styles.quantityHeader}>
            <Text style={styles.quantityTitle}>Выберите количество</Text>
            <TouchableOpacity
              style={styles.maxButton}
              onPress={handleMax}
            >
              <Text style={styles.maxButtonText}>Все ({resource.count})</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quantityDisplayLarge}>
            <Text style={styles.quantityInputLarge}>
              {inputValue}
            </Text>
          </View>

          {/* Встроенная цифровая клавиатура */}
          <CustomNumericKeyboard
            onNumberPress={handleNumberPress}
            onDeletePress={handleDeletePress}
            onClearPress={handleClearPress}
            onConfirmPress={handleConfirm}
            disabled={false}
          />
        </View>
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
    width: 50,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  resourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceDetails: {
    marginLeft: 15,
    flex: 1,
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resourceCount: {
    minWidth: 60,
    height: 30,
    backgroundColor: '#1976d2',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  resourceCountText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantitySection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  quantityDisplayLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#1976d2',
  },
  quantityInputLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1976d2',
  },
  maxButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  maxButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ResourceQuantitySelector;
