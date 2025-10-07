import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';

interface CustomNumericKeyboardProps {
  onNumberPress: (number: string) => void;
  onDeletePress: () => void;
  onClearPress: () => void;
  onConfirmPress: () => void;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const buttonSize = (width - 60) / 3; // 3 кнопки в ряду с отступами

const CustomNumericKeyboard: React.FC<CustomNumericKeyboardProps> = ({
  onNumberPress,
  onDeletePress,
  onClearPress,
  onConfirmPress,
  disabled = false
}) => {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  const renderNumberButton = (number: string) => (
    <TouchableOpacity
      key={number}
      style={[styles.numberButton, disabled && styles.buttonDisabled]}
      onPress={() => onNumberPress(number)}
      disabled={disabled}
    >
      <Text style={[styles.numberButtonText, disabled && styles.buttonTextDisabled]}>
        {number}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Первый ряд: 1, 2, 3 */}
      <View style={styles.row}>
        {numbers.slice(0, 3).map(renderNumberButton)}
      </View>
      
      {/* Второй ряд: 4, 5, 6 */}
      <View style={styles.row}>
        {numbers.slice(3, 6).map(renderNumberButton)}
      </View>
      
      {/* Третий ряд: 7, 8, 9 */}
      <View style={styles.row}>
        {numbers.slice(6, 9).map(renderNumberButton)}
      </View>
      
      {/* Четвертый ряд: 0, Delete, Clear */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.numberButton, styles.zeroButton, disabled && styles.buttonDisabled]}
          onPress={() => onNumberPress('0')}
          disabled={disabled}
        >
          <Text style={[styles.numberButtonText, disabled && styles.buttonTextDisabled]}>
            0
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton, disabled && styles.buttonDisabled]}
          onPress={onDeletePress}
          disabled={disabled}
        >
          <Text style={[styles.actionButtonText, disabled && styles.buttonTextDisabled]}>
            ⌫
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton, disabled && styles.buttonDisabled]}
          onPress={onClearPress}
          disabled={disabled}
        >
          <Text style={[styles.actionButtonText, disabled && styles.buttonTextDisabled]}>
            C
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Кнопка подтверждения */}
      <View style={styles.confirmRow}>
        <TouchableOpacity
          style={[styles.confirmButton, disabled && styles.buttonDisabled]}
          onPress={onConfirmPress}
          disabled={disabled}
        >
          <Text style={[styles.confirmButtonText, disabled && styles.buttonTextDisabled]}>
            ✓ Готово
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  confirmRow: {
    marginTop: 5,
  },
  numberButton: {
    width: buttonSize,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  zeroButton: {
    flex: 1,
    marginRight: 10,
  },
  actionButton: {
    width: buttonSize,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: '#ff9800',
    marginRight: 10,
  },
  clearButton: {
    backgroundColor: '#f44336',
  },
  confirmButton: {
    height: 50,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonDisabled: {
    backgroundColor: '#e0e0e0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonTextDisabled: {
    color: '#999',
  },
});

export default CustomNumericKeyboard;


