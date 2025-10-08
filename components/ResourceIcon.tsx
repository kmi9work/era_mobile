import React from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';

interface ResourceIconProps {
  identificator: string;
  size?: number;
  showLabel?: boolean;
  count?: number;
}

const ResourceIcon: React.FC<ResourceIconProps> = ({ 
  identificator, 
  size = 40, 
  showLabel = false, 
  count 
}) => {
  // Маппинг идентификаторов ресурсов к картинкам
  const getResourceImage = (id: string) => {
    const imageMap: { [key: string]: any } = {
      'gold': require('../assets/images/resources/gold.png'),
      'money': require('../assets/images/resources/money.png'),
      'food': require('../assets/images/resources/food.png'),
      'grain': require('../assets/images/resources/grain.png'),
      'meat': require('../assets/images/resources/meat.png'),
      'flour': require('../assets/images/resources/flour.png'),
      'wood': require('../assets/images/resources/timber.png'),
      'timber': require('../assets/images/resources/timber.png'),
      'boards': require('../assets/images/resources/boards.png'),
      'stone': require('../assets/images/resources/stone.png'),
      'stone_brick': require('../assets/images/resources/stone_brick.png'),
      'metal': require('../assets/images/resources/metal.png'),
      'metal_ore': require('../assets/images/resources/metal_ore.png'),
      'iron': require('../assets/images/resources/metal.png'),
      'armor': require('../assets/images/resources/armor.png'),
      'weapon': require('../assets/images/resources/weapon.png'),
      'tools': require('../assets/images/resources/tools.png'),
      'gems': require('../assets/images/resources/gems.png'),
      'gem_ore': require('../assets/images/resources/gem_ore.png'),
      'horses': require('../assets/images/resources/horses.png'),
      'luxury': require('../assets/images/resources/luxury.png'),
      'coal': require('../assets/images/resources/metal_ore.png'), // Используем metal_ore как уголь
      'cloth': require('../assets/images/resources/luxury.png'), // Используем luxury как ткань
    };

    return imageMap[id] || require('../assets/images/resources/gold.png'); // Fallback на золото
  };

  // Получение названия ресурса
  const getResourceName = (id: string) => {
    const names: { [key: string]: string } = {
      'gold': 'Золото',
      'money': 'Деньги',
      'food': 'Еда',
      'grain': 'Зерно',
      'meat': 'Мясо',
      'flour': 'Мука',
      'wood': 'Дерево',
      'timber': 'Бревна',
      'boards': 'Доски',
      'stone': 'Камень',
      'stone_brick': 'Каменные блоки',
      'metal': 'Металл',
      'metal_ore': 'Металлическая руда',
      'iron': 'Железо',
      'armor': 'Доспехи',
      'weapon': 'Оружие',
      'tools': 'Инструменты',
      'gems': 'Драгоценности',
      'gem_ore': 'Драгоценная руда',
      'horses': 'Лошади',
      'luxury': 'Роскошь',
      'coal': 'Уголь',
      'cloth': 'Ткань'
    };
    return names[id] || id;
  };

  const imageSource = getResourceImage(identificator);
  const resourceName = getResourceName(identificator);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={imageSource} 
        style={[styles.image, { width: size, height: size }]}
        resizeMode="contain"
      />
      {count !== undefined && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
      {showLabel && (
        <Text style={styles.label} numberOfLines={1}>
          {resourceName}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 4,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
    color: '#666',
    maxWidth: 60,
  },
});

export default ResourceIcon;

