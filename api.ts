import axios from 'axios';
import { Player, AuthResponse, Resource, ExchangeRequest, ExchangeResponse } from './types';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.45:3000'  // Для разработки (IP сервера)
  : 'https://your-production-domain.com'; // Для продакшена

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false, // Отключаем для мобильных приложений
  });

  constructor() {
    // Интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Success:', response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          message: error.message,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );

    // Интерцептор для запросов
    this.api.interceptors.request.use(
      (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Аутентификация
  async login(identificator: string): Promise<AuthResponse> {
    try {
      // Для тестирования - используем фиктивные данные
      if (identificator.includes('КУПЕЦ') || identificator.includes('РЮРИКОВИЧ') || identificator.includes('АКСАКОВ')) {
        const mockPlayer: Player = {
          id: 1,
          name: identificator.includes('КУПЕЦ') ? 'КУПЕЦ' : 
                identificator.includes('РЮРИКОВИЧ') ? 'РЮРИКОВИЧ' : 'АКСАКОВ',
          identificator: identificator,
          player_type: identificator.includes('КУПЕЦ') ? 'Купец' : 'Знать',
          family: identificator.includes('КУПЕЦ') ? 'Торговцы' : 'Дворяне',
          jobs: identificator.includes('КУПЕЦ') ? ['Глава гильдии'] : ['Великий князь']
        };
        
        return {
          success: true,
          player: mockPlayer
        };
      }

      // Реальная аутентификация через API
      const response = await this.api.post('/auth/login', { identificator });
      return response.data;
    } catch (error: any) {
      // Если API недоступен, используем фиктивные данные
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        const mockPlayer: Player = {
          id: 1,
          name: 'Тестовый игрок',
          identificator: identificator,
          player_type: 'Знать',
          family: 'Тестовая семья',
          jobs: ['Тестовая должность']
        };
        
        return {
          success: true,
          player: mockPlayer
        };
      }
      
      throw new Error(error.response?.data?.message || 'Ошибка входа');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentPlayer(): Promise<Player | null> {
    try {
      const response = await this.api.get('/auth/current_player');
      return response.data.player || response.data;
    } catch (error) {
      console.error('Get current player error:', error);
      return null;
    }
  }

  // Получение ресурсов игрока
  async getPlayerResources(playerId: number): Promise<Resource[]> {
    try {
      const response = await this.api.get(`/players/${playerId}/show_players_resources`);
      return response.data || [];
    } catch (error: any) {
      console.error('Get player resources error:', error);
      // Возвращаем тестовые данные для разработки
      return [
        { identificator: 'gold', count: 1000 },
        { identificator: 'timber', count: 500 },
        { identificator: 'stone', count: 300 },
        { identificator: 'food', count: 800 },
        { identificator: 'metal', count: 200 },
        { identificator: 'gems', count: 50 },
        { identificator: 'armor', count: 10 },
        { identificator: 'weapon', count: 15 }
      ];
    }
  }

  // Обмен ресурсами
  async exchangeResources(playerId: number, request: ExchangeRequest): Promise<ExchangeResponse> {
    try {
      const response = await this.api.post(`/players/${playerId}/exchange_resources`, {
        request
      });
      return response.data;
    } catch (error: any) {
      console.error('Exchange resources error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Ошибка обмена ресурсами'
      };
    }
  }
}

export default new ApiService();