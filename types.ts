export interface Player {
  id: number;
  name: string;
  identificator: string;
  player_type?: string;
  family?: string;
  jobs: string[];
}

export interface AuthResponse {
  success: boolean;
  player?: Player;
  message?: string;
}
