export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  colorFrom: string;
  colorTo: string;
  imgUrl: string | null;
  vx: number;
  vy: number;
  bx: number;
  by: number;
  splitTick: number;
}

export interface PlayerSkin {
  colorFrom: string;
  colorTo: string;
  imgUrl?: string | null;
}

export interface Player {
  id: string;
  name: string;
  cells: Cell[];
  color: string;
  colorFrom: string;
  colorTo: string;
  imgUrl: string | null;
  score: number;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface EjectedMass {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  colorFrom: string;
  colorTo: string;
  vx: number;
  vy: number;
}

export interface GameState {
  players: Player[];
  food: Food[];
  ejectedMass: EjectedMass[];
  worldSize: number;
  tickCount: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export const GAME_CONFIG = {
  WORLD_SIZE: 5000,
  FOOD_COUNT: 500,
  BOT_COUNT: 15,
  INITIAL_RADIUS: 20,
  MIN_SPLIT_RADIUS: 30,
  MAX_CELLS_PER_PLAYER: 16,
  FOOD_RADIUS: 5,
  EJECT_MASS_RADIUS: 10,
  BASE_SPEED: 4,
  MERGE_TIME: 300, // ticks before cells can merge
  SPLIT_VELOCITY: 15,
  EJECT_VELOCITY: 20,
  DECAY_RATE: 0.998, // mass decay for large cells
  DECAY_THRESHOLD: 100, // radius above which decay applies
} as const;
