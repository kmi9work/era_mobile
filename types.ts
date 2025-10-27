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

export interface Resource {
  identificator: string;
  count: number;
  name?: string;
}

export interface ExchangeRequest {
  with_whom: string;
  hashed_resources: Resource[];
}

export interface ExchangeResponse {
  success: boolean;
  result?: any;
  error?: string;
}
