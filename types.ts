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
  sell_price?: number;
  buy_price?: number;
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

export interface Country {
  id: number;
  name: string;
  params: {
    embargo?: number;
  };
  relations?: number;
}

export interface MarketResource {
  identificator: string;
  name?: string;
  sell_price?: number;
  buy_price?: number;
  country: {
    id: number;
    name: string;
  };
}

export interface MarketPrices {
  to_market: MarketResource[];
  off_market: MarketResource[];
}

export interface MarketTradeRequest {
  country_id: number;
  res_pl_sells: Array<{identificator: string; count: number | null}>;
  res_pl_buys: Array<{identificator: string; count: number | null}>;
}

export interface MarketTradeResponse {
  res_to_player: Array<{
    identificator: string;
    name: string;
    count: number;
  }>;
}
