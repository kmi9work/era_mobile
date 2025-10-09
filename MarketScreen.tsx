import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Player, Country, MarketPrices, Resource } from './types';
import ApiService from './api';
import ResourceQuantitySelector from './components/ResourceQuantitySelector';

interface MarketScreenProps {
  player: Player;
  onBack: () => void;
}

type MarketStep = 'select_country' | 'select_resources_to_sell' | 'select_resources_to_buy' | 'select_quantity' | 'calculate_cost';

const MarketScreen: React.FC<MarketScreenProps> = ({ player, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [prices, setPrices] = useState<MarketPrices>({ to_market: [], off_market: [] });
  const [step, setStep] = useState<MarketStep>('select_country');
  
  // Ресурсы для продажи
  const [resourcesToSell, setResourcesToSell] = useState<Resource[]>([]);
  const [selectedSellResources, setSelectedSellResources] = useState<Resource[]>([]);
  const [selectedResourceForQuantity, setSelectedResourceForQuantity] = useState<Resource | null>(null);
  
  // Ресурсы для покупки
  const [resourcesToBuy, setResourcesToBuy] = useState<Resource[]>([]);
  const [selectedBuyResources, setSelectedBuyResources] = useState<Resource[]>([]);
  
  // Ресурсы игрока (для проверки доступности)
  const [playerResources, setPlayerResources] = useState<Resource[]>([]);
  
  // Результат расчета каравана
  const [caravanResult, setCaravanResult] = useState<Resource[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSellPhase, setIsSellPhase] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [countriesData, pricesData, playerRes] = await Promise.all([
        ApiService.getForeignCountries(),
        ApiService.getMarketPrices(),
        ApiService.getPlayerResources(player.id)
      ]);
      
      setCountries(countriesData);
      setPrices(pricesData);
      
      // Добавляем золото к ресурсам игрока если его нет
      const goldResource = playerRes.find(r => r.identificator === 'gold');
      if (!goldResource) {
        playerRes.push({ identificator: 'gold', count: 0, name: 'Золото' });
      }
      setPlayerResources(playerRes);
    } catch (error) {
      console.error('Error loading market data:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить данные рынка');
    } finally {
      setLoading(false);
    }
  };

  const countryImages: { [key: string]: any } = {
    'Большая Орда': require('./assets/images/countries/Большая Орда.png'),
    'Великое княжество Литовское': require('./assets/images/countries/Великое княжество Литовское.png'),
    'Казанское ханство': require('./assets/images/countries/Казанское ханство.png'),
    'Королевство Швеция': require('./assets/images/countries/Королевство Швеция.png'),
    'Крымское ханство': require('./assets/images/countries/Крымское ханство.png'),
    'Ливонский орден': require('./assets/images/countries/Ливонский орден.png'),
  };

  const resourceImages: { [key: string]: any } = {
    'armor': require('./assets/images/resources/armor.png'),
    'boards': require('./assets/images/resources/boards.png'),
    'flour': require('./assets/images/resources/flour.png'),
    'food': require('./assets/images/resources/food.png'),
    'gem_ore': require('./assets/images/resources/gem_ore.png'),
    'gems': require('./assets/images/resources/gems.png'),
    'gold': require('./assets/images/resources/gold.png'),
    'grain': require('./assets/images/resources/grain.png'),
    'horses': require('./assets/images/resources/horses.png'),
    'luxury': require('./assets/images/resources/luxury.png'),
    'meat': require('./assets/images/resources/meat.png'),
    'metal_ore': require('./assets/images/resources/metal_ore.png'),
    'metal': require('./assets/images/resources/metal.png'),
    'money': require('./assets/images/resources/money.png'),
    'stone_brick': require('./assets/images/resources/stone_brick.png'),
    'stone': require('./assets/images/resources/stone.png'),
    'timber': require('./assets/images/resources/timber.png'),
    'tools': require('./assets/images/resources/tools.png'),
    'weapon': require('./assets/images/resources/weapon.png'),
  };

  const hasEmbargo = (country: Country) => {
    return (country?.params?.embargo || 0) > 0;
  };

  const handleCountrySelect = (country: Country) => {
    if (hasEmbargo(country)) {
      Alert.alert(
        'Эмбарго',
        `${country.name} ввела эмбарго против Руси! Для совершения операций нужна Контрабанда!`,
        [
          { text: 'Отмена', style: 'cancel' },
          { 
            text: 'Есть контрабанда!', 
            onPress: () => proceedWithCountry(country) 
          }
        ]
      );
      return;
    }
    proceedWithCountry(country);
  };

  const proceedWithCountry = (country: Country) => {
    setSelectedCountry(country);
    
    // Фильтруем ресурсы для продажи (to_market) для выбранной страны
    const sellResources: Resource[] = prices.to_market
      .filter(res => res.country.id === country.id)
      .map(res => ({
        identificator: res.identificator,
        count: 0,
        name: res.name || res.identificator,
        sell_price: res.sell_price,
        buy_price: res.buy_price
      }));
    
    // Фильтруем ресурсы для покупки (off_market) для выбранной страны
    const buyResources: Resource[] = prices.off_market
      .filter(res => res.country.id === country.id)
      .map(res => ({
        identificator: res.identificator,
        count: 0,
        name: res.name || res.identificator,
        sell_price: res.sell_price,
        buy_price: res.buy_price
      }));
    
    setResourcesToSell(sellResources);
    setResourcesToBuy(buyResources);
    setStep('select_resources_to_sell');
  };

  const handleResourceSelectForQuantity = (resource: Resource) => {
    setSelectedResourceForQuantity(resource);
    setStep('select_quantity');
  };

  const handleQuantityConfirm = (quantity: number) => {
    if (!selectedResourceForQuantity) return;

    if (isSellPhase) {
      const existing = selectedSellResources.find(
        r => r.identificator === selectedResourceForQuantity.identificator
      );
      if (existing) {
        setSelectedSellResources(prev =>
          prev.map(r =>
            r.identificator === selectedResourceForQuantity.identificator
              ? { ...r, count: quantity }
              : r
          )
        );
      } else {
        setSelectedSellResources(prev => [
          ...prev,
          { ...selectedResourceForQuantity, count: quantity }
        ]);
      }
      setStep('select_resources_to_sell');
    } else {
      const existing = selectedBuyResources.find(
        r => r.identificator === selectedResourceForQuantity.identificator
      );
      if (existing) {
        setSelectedBuyResources(prev =>
          prev.map(r =>
            r.identificator === selectedResourceForQuantity.identificator
              ? { ...r, count: quantity }
              : r
          )
        );
      } else {
        setSelectedBuyResources(prev => [
          ...prev,
          { ...selectedResourceForQuantity, count: quantity }
        ]);
      }
      setStep('select_resources_to_buy');
    }
    setSelectedResourceForQuantity(null);
  };

  const handleQuantityCancel = () => {
    setSelectedResourceForQuantity(null);
    if (isSellPhase) {
      setStep('select_resources_to_sell');
    } else {
      setStep('select_resources_to_buy');
    }
  };

  const handleProceedToBuy = () => {
    setIsSellPhase(false);
    setStep('select_resources_to_buy');
  };

  const handleRemoveSellResource = (identificator: string) => {
    setSelectedSellResources(prev => prev.filter(r => r.identificator !== identificator));
  };

  const handleRemoveBuyResource = (identificator: string) => {
    setSelectedBuyResources(prev => prev.filter(r => r.identificator !== identificator));
  };

  const handleCalculateCost = async () => {
    if (!selectedCountry) return;

    try {
      setIsProcessing(true);
      
      const res_pl_sells = selectedSellResources.map(r => ({
        identificator: r.identificator,
        name: r.name,
        count: r.count
      }));

      const res_pl_buys = selectedBuyResources.map(r => ({
        identificator: r.identificator,
        name: r.name,
        count: r.count
      }));

      const result = await ApiService.calculateCaravan(
        selectedCountry.id,
        res_pl_sells,
        res_pl_buys
      );

      // result.res_to_player содержит массив ресурсов с количеством золота
      setCaravanResult(result.res_to_player || []);
      setStep('calculate_cost');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось рассчитать стоимость');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTrade = async () => {
    if (!selectedCountry) return;

    try {
      setIsProcessing(true);
      
      // Проверяем золото из caravanResult
      const goldResource = caravanResult.find(r => r.identificator === 'gold');
      const goldAmount = goldResource?.count || 0;

      // Если нужно платить золото, проверяем наличие у игрока
      if (goldAmount < 0) {
        const playerGold = playerResources.find(r => r.identificator === 'gold');
        const playerGoldAmount = playerGold?.count || 0;
        const requiredGold = Math.abs(goldAmount);

        if (playerGoldAmount < requiredGold) {
          Alert.alert('Ошибка', 'Недостаточно золота для совершения сделки');
          setIsProcessing(false);
          return;
        }
      }

      // Отправляем то, что продаем (оригинальные выбранные ресурсы)
      const res_pl_sells = selectedSellResources.map(r => ({
        identificator: r.identificator,
        name: r.name,
        count: r.count
      }));

      // Если нужно платить золото, добавляем его к продаже
      if (goldAmount < 0) {
        res_pl_sells.push({
          identificator: 'gold',
          name: 'Золото',
          count: Math.abs(goldAmount)
        });
      }

      // Формируем то, что покупаем из caravanResult
      // Включаем купленные ресурсы и золото, если оно положительное
      const res_pl_buys = selectedBuyResources.map(r => ({
        identificator: r.identificator,
        name: r.name,
        count: r.count
      }));

      // Если получаем золото (положительное значение), добавляем его к покупке
      if (goldAmount > 0) {
        res_pl_buys.push({
          identificator: 'gold',
          name: 'Золото',
          count: goldAmount
        });
      }

      console.log('=== ОТПРАВКА НА СЕРВЕР ===');
      console.log('res_pl_sells:', JSON.stringify(res_pl_sells, null, 2));
      console.log('res_pl_buys:', JSON.stringify(res_pl_buys, null, 2));
      console.log('goldAmount:', goldAmount);

      const response = await ApiService.marketTrade(player.id, {
        country_id: selectedCountry.id,
        res_pl_sells,
        res_pl_buys
      });

      Alert.alert('Успех', 'Торговля завершена успешно!', [
        {
          text: 'OK',
          onPress: () => {
            // Сбрасываем все и возвращаемся к выбору страны
            setSelectedCountry(null);
            setSelectedSellResources([]);
            setSelectedBuyResources([]);
            setCaravanResult([]);
            setIsSellPhase(true);
            setStep('select_country');
            loadData(); // Перезагружаем данные
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось совершить торговлю');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderSelectCountry = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Выберите страну для торговли</Text>
      <View style={styles.countriesGrid}>
        {countries.map(country => (
          <TouchableOpacity
            key={country.id}
            style={[
              styles.countryCard,
              hasEmbargo(country) && styles.countryCardEmbargo
            ]}
            onPress={() => handleCountrySelect(country)}
          >
            {countryImages[country.name] && (
              <Image
                source={countryImages[country.name]}
                style={styles.countryImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.countryName}>{country.name}</Text>
            {hasEmbargo(country) && (
              <View style={styles.embargoBadge}>
                <Text style={styles.embargoBadgeText}>Эмбарго</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderSelectResourcesToSell = () => (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => {
          setSelectedCountry(null);
          setSelectedSellResources([]);
          setStep('select_country');
        }}>
          <Text style={styles.backText}>← Назад к странам</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>
          {selectedCountry?.name}: Выбор ресурсов для продажи
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Выбранные ресурсы */}
        {selectedSellResources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выбранные ресурсы для продажи</Text>
            {selectedSellResources.map(resource => (
              <View key={resource.identificator} style={styles.selectedResourceCard}>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>
                    {resource.name || resource.identificator}
                  </Text>
                  <Text style={styles.resourceCount}>x{resource.count}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveSellResource(resource.identificator)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Доступные ресурсы */}
        <View style={styles.section}>
          {resourcesToSell.map(resource => {
            const playerResource = playerResources.find(r => r.identificator === resource.identificator);
            const availableCount = playerResource?.count || 0;
            
            return (
              <TouchableOpacity
                key={resource.identificator}
                style={styles.resourceCardWithImage}
                onPress={() => handleResourceSelectForQuantity({ 
                  ...resource, 
                  count: availableCount 
                })}
              >
                {resourceImages[resource.identificator] && (
                  <Image
                    source={resourceImages[resource.identificator]}
                    style={styles.resourceImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.resourceDetails}>
                  <View style={styles.resourceRow}>
                    <Text style={styles.resourceName}>
                      {resource.name || resource.identificator}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.resourcePriceNumber}>
                        {resource.sell_price || 'Н/Д'}
                      </Text>
                      <Image
                        source={resourceImages['gold']}
                        style={styles.goldIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToBuy}
        >
          <Text style={styles.proceedButtonText}>Далее: Выбрать ресурсы для покупки</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderSelectResourcesToBuy = () => (
    <View style={styles.container}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={() => {
          setIsSellPhase(true);
          setStep('select_resources_to_sell');
        }}>
          <Text style={styles.backText}>← Назад к продаже</Text>
        </TouchableOpacity>
        <Text style={styles.stepTitle}>
          {selectedCountry?.name}: Выбор ресурсов для покупки
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Выбранные ресурсы */}
        {selectedBuyResources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Выбранные ресурсы для покупки</Text>
            {selectedBuyResources.map(resource => (
              <View key={resource.identificator} style={styles.selectedResourceCard}>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceName}>
                    {resource.name || resource.identificator}
                  </Text>
                  <Text style={styles.resourceCount}>x{resource.count}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveBuyResource(resource.identificator)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Доступные ресурсы для покупки */}
        <View style={styles.section}>
          {resourcesToBuy.map(resource => (
            <TouchableOpacity
              key={resource.identificator}
              style={styles.resourceCardWithImage}
              onPress={() => handleResourceSelectForQuantity(resource)}
            >
              {resourceImages[resource.identificator] && (
                <Image
                  source={resourceImages[resource.identificator]}
                  style={styles.resourceImage}
                  resizeMode="contain"
                />
              )}
              <View style={styles.resourceDetails}>
                <View style={styles.resourceRow}>
                  <Text style={styles.resourceName}>
                    {resource.name || resource.identificator}
                  </Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.resourcePriceNumber}>
                      {resource.buy_price || 'Н/Д'}
                    </Text>
                    <Image
                      source={resourceImages['gold']}
                      style={styles.goldIcon}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.completeButton, isProcessing && styles.completeButtonDisabled]}
          onPress={handleCalculateCost}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.completeButtonText}>Рассчитать стоимость</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderCalculateCost = () => {
    const goldResource = caravanResult.find(r => r.identificator === 'gold');
    const goldAmount = goldResource?.count || 0;
    const needsPayment = goldAmount < 0;

    return (
      <View style={styles.container}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={() => {
            setIsSellPhase(false);
            setStep('select_resources_to_buy');
          }}>
            <Text style={styles.backText}>← Назад к покупке</Text>
          </TouchableOpacity>
          <Text style={styles.stepTitle}>
            {selectedCountry?.name}: Расчет стоимости
          </Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Результат торговли</Text>
            
            {caravanResult.map(resource => (
              <View key={resource.identificator} style={styles.resourceCardWithImage}>
                {resourceImages[resource.identificator] && (
                  <Image
                    source={resourceImages[resource.identificator]}
                    style={styles.resourceImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.resourceDetails}>
                  <Text style={styles.resourceName}>
                    {resource.name || resource.identificator}
                  </Text>
                  <Text style={[
                    styles.resourceCount,
                    resource.count < 0 && styles.negativeCount
                  ]}>
                    {resource.count > 0 ? '+' : ''}{resource.count}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.completeButton,
              isProcessing && styles.completeButtonDisabled
            ]}
            onPress={handleCompleteTrade}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.completeButtonText}>
                Оплатить
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Рынок</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976d2" />
          <Text style={styles.loadingText}>Загрузка...</Text>
        </View>
      </View>
    );
  }

  if (step === 'select_quantity' && selectedResourceForQuantity) {
    return (
      <ResourceQuantitySelector
        resource={selectedResourceForQuantity}
        onConfirm={handleQuantityConfirm}
        onCancel={handleQuantityCancel}
        isBuying={!isSellPhase}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Рынок</Text>
        <View style={styles.placeholder} />
      </View>

      {step === 'select_country' && renderSelectCountry()}
      {step === 'select_resources_to_sell' && renderSelectResourcesToSell()}
      {step === 'select_resources_to_buy' && renderSelectResourcesToBuy()}
      {step === 'calculate_cost' && renderCalculateCost()}
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
  stepHeader: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backText: {
    color: '#1976d2',
    fontSize: 14,
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  countriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    justifyContent: 'space-between',
  },
  countryCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 150,
    justifyContent: 'center',
  },
  countryCardEmbargo: {
    borderWidth: 2,
    borderColor: 'red',
  },
  countryImage: {
    width: 80,
    height: 60,
    marginBottom: 10,
  },
  countryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  embargoBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  embargoBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceCardWithImage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceImage: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedResourceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  resourceInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  resourceAvailable: {
    fontSize: 14,
    color: '#666',
  },
  resourcePrice: {
    fontSize: 14,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourcePriceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginRight: 6,
  },
  goldIcon: {
    width: 20,
    height: 20,
  },
  resourceCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  removeButton: {
    backgroundColor: '#f44336',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  proceedButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  proceedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: '#1976d2',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  completeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  negativeCount: {
    color: '#f44336',
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MarketScreen;
