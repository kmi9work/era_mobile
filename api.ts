import axios from 'axios';
import { Player, AuthResponse } from './types';

const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.101:3000'  // Для разработки (IP вместо localhost)
  : 'https://your-production-domain.com'; // Для продакшена

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Для поддержки сессий Rails
  });

  constructor() {
    // Интерцептор для обработки ответов
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.message);
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
}

export default new ApiService();