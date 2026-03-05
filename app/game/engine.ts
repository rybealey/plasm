import {
  GameState,
  Player,
  PlayerSkin,
  Cell,
  Food,
  EjectedMass,
  Position,
  GAME_CONFIG,
} from "./types";

let nextId = 0;
function genId(): string {
  return `e${nextId++}`;
}

const COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
  "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
  "#8bc34a", "#cddc39", "#ff9800", "#ff5722", "#795548",
];

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function cellMass(cell: Cell): number {
  return Math.PI * cell.radius * cell.radius;
}

function massToRadius(mass: number): number {
  return Math.sqrt(mass / Math.PI);
}

function distance(a: Position, b: Position): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function playerTotalMass(player: Player): number {
  return player.cells.reduce((sum, c) => sum + cellMass(c), 0);
}

export function createFood(worldSize: number): Food {
  return {
    id: genId(),
    x: Math.random() * worldSize,
    y: Math.random() * worldSize,
    radius: GAME_CONFIG.FOOD_RADIUS,
    color: randomColor(),
  };
}

export function createPlayer(name: string, worldSize: number, skin?: PlayerSkin): Player {
  const color = randomColor();
  const colorFrom = skin?.colorFrom ?? color;
  const colorTo = skin?.colorTo ?? color;
  const imgUrl = skin?.imgUrl ?? null;
  return {
    id: genId(),
    name,
    color,
    colorFrom,
    colorTo,
    imgUrl,
    score: 0,
    cells: [
      {
        id: genId(),
        x: Math.random() * worldSize * 0.8 + worldSize * 0.1,
        y: Math.random() * worldSize * 0.8 + worldSize * 0.1,
        radius: GAME_CONFIG.INITIAL_RADIUS,
        color,
        colorFrom,
        colorTo,
        imgUrl,
        vx: 0,
        vy: 0,
        bx: 0,
        by: 0,
        splitTick: 0,
      },
    ],
  };
}

export function createInitialState(playerName: string, skin?: PlayerSkin): GameState {
  const ws = GAME_CONFIG.WORLD_SIZE;
  const food: Food[] = [];
  for (let i = 0; i < GAME_CONFIG.FOOD_COUNT; i++) {
    food.push(createFood(ws));
  }

  const players: Player[] = [createPlayer(playerName, ws, skin)];
  for (let i = 0; i < GAME_CONFIG.BOT_COUNT; i++) {
    players.push(createPlayer(`Bot ${i + 1}`, ws));
  }

  return {
    players,
    food,
    ejectedMass: [],
    worldSize: ws,
    tickCount: 0,
  };
}

function moveSpeed(radius: number): number {
  return GAME_CONFIG.BASE_SPEED * (GAME_CONFIG.INITIAL_RADIUS / radius) ** 0.45;
}

export function updatePlayerMovement(
  player: Player,
  target: Position,
  worldSize: number,
) {
  for (const cell of player.cells) {
    const dx = target.x - cell.x;
    const dy = target.y - cell.y;
    const dist = Math.hypot(dx, dy);

    if (dist >= 1) {
      const speed = moveSpeed(cell.radius);
      cell.vx = (dx / dist) * speed;
      cell.vy = (dy / dist) * speed;
    }

    // apply boost (split impulse) on top of normal movement
    cell.x += cell.vx + cell.bx;
    cell.y += cell.vy + cell.by;
    cell.bx *= 0.88;
    cell.by *= 0.88;
    if (Math.abs(cell.bx) < 0.1) cell.bx = 0;
    if (Math.abs(cell.by) < 0.1) cell.by = 0;

    // clamp to world bounds
    cell.x = Math.max(cell.radius, Math.min(worldSize - cell.radius, cell.x));
    cell.y = Math.max(cell.radius, Math.min(worldSize - cell.radius, cell.y));
  }
}

function botAI(bot: Player, state: GameState): Position {
  const mainCell = bot.cells[0];
  if (!mainCell) return { x: 0, y: 0 };

  // find nearest food
  let nearestFood: Food | null = null;
  let nearestDist = Infinity;
  for (const f of state.food) {
    const d = distance(mainCell, f);
    if (d < nearestDist) {
      nearestDist = d;
      nearestFood = f;
    }
  }

  // flee from larger players
  for (const other of state.players) {
    if (other.id === bot.id) continue;
    for (const oc of other.cells) {
      const d = distance(mainCell, oc);
      if (oc.radius > mainCell.radius * 1.1 && d < mainCell.radius * 8) {
        // flee
        const dx = mainCell.x - oc.x;
        const dy = mainCell.y - oc.y;
        return { x: mainCell.x + dx, y: mainCell.y + dy };
      }
    }
  }

  // chase smaller players if we're big enough
  for (const other of state.players) {
    if (other.id === bot.id) continue;
    for (const oc of other.cells) {
      const d = distance(mainCell, oc);
      if (
        mainCell.radius > oc.radius * 1.2 &&
        d < mainCell.radius * 6
      ) {
        return { x: oc.x, y: oc.y };
      }
    }
  }

  if (nearestFood) {
    return { x: nearestFood.x, y: nearestFood.y };
  }

  return {
    x: state.worldSize / 2,
    y: state.worldSize / 2,
  };
}

export function splitPlayer(player: Player, tickCount: number) {
  const newCells: Cell[] = [];
  for (const cell of player.cells) {
    if (
      player.cells.length + newCells.length >= GAME_CONFIG.MAX_CELLS_PER_PLAYER
    )
      break;
    if (cell.radius < GAME_CONFIG.MIN_SPLIT_RADIUS) continue;

    const newMass = cellMass(cell) / 2;
    const newRadius = massToRadius(newMass);
    cell.radius = newRadius;
    cell.splitTick = tickCount;

    const angle = Math.atan2(cell.vy, cell.vx);
    newCells.push({
      id: genId(),
      x: cell.x + Math.cos(angle) * newRadius * 0.5,
      y: cell.y + Math.sin(angle) * newRadius * 0.5,
      radius: newRadius,
      color: cell.color,
      colorFrom: cell.colorFrom,
      colorTo: cell.colorTo,
      imgUrl: cell.imgUrl,
      vx: 0,
      vy: 0,
      bx: Math.cos(angle) * GAME_CONFIG.SPLIT_VELOCITY,
      by: Math.sin(angle) * GAME_CONFIG.SPLIT_VELOCITY,
      splitTick: tickCount,
    });
  }
  player.cells.push(...newCells);
}

export function ejectMass(player: Player): EjectedMass[] {
  const ejected: EjectedMass[] = [];
  for (const cell of player.cells) {
    if (cell.radius < GAME_CONFIG.MIN_SPLIT_RADIUS) continue;
    const ejectedMass = Math.PI * GAME_CONFIG.EJECT_MASS_RADIUS ** 2;
    const newMass = cellMass(cell) - ejectedMass;
    cell.radius = massToRadius(newMass);

    const angle = Math.atan2(cell.vy, cell.vx);
    ejected.push({
      id: genId(),
      x: cell.x + Math.cos(angle) * (cell.radius + GAME_CONFIG.EJECT_MASS_RADIUS),
      y: cell.y + Math.sin(angle) * (cell.radius + GAME_CONFIG.EJECT_MASS_RADIUS),
      radius: GAME_CONFIG.EJECT_MASS_RADIUS,
      color: cell.color,
      colorFrom: cell.colorFrom,
      colorTo: cell.colorTo,
      vx: Math.cos(angle) * GAME_CONFIG.EJECT_VELOCITY,
      vy: Math.sin(angle) * GAME_CONFIG.EJECT_VELOCITY,
    });
  }
  return ejected;
}

export function tick(state: GameState, playerTarget: Position): GameState {
  state.tickCount++;

  // move human player
  const human = state.players[0];
  if (human) {
    updatePlayerMovement(human, playerTarget, state.worldSize);
  }

  // move bots
  for (let i = 1; i < state.players.length; i++) {
    const bot = state.players[i];
    const target = botAI(bot, state);
    updatePlayerMovement(bot, target, state.worldSize);
  }

  // apply velocity decay for ejected mass
  for (const em of state.ejectedMass) {
    em.x += em.vx;
    em.y += em.vy;
    em.vx *= 0.85;
    em.vy *= 0.85;
    em.x = Math.max(0, Math.min(state.worldSize, em.x));
    em.y = Math.max(0, Math.min(state.worldSize, em.y));
  }

  // merge cells of same player
  for (const player of state.players) {
    if (player.cells.length <= 1) continue;
    for (let i = 0; i < player.cells.length; i++) {
      for (let j = i + 1; j < player.cells.length; j++) {
        const a = player.cells[i];
        const b = player.cells[j];
        // don't merge until MERGE_TIME has elapsed since split
        if (
          state.tickCount - a.splitTick < GAME_CONFIG.MERGE_TIME ||
          state.tickCount - b.splitTick < GAME_CONFIG.MERGE_TIME
        ) continue;
        const d = distance(a, b);
        if (d < a.radius + b.radius - Math.min(a.radius, b.radius) * 0.5) {
          // merge into the bigger one
          const totalMass = cellMass(a) + cellMass(b);
          if (a.radius >= b.radius) {
            a.radius = massToRadius(totalMass);
            player.cells.splice(j, 1);
            j--;
          } else {
            b.radius = massToRadius(totalMass);
            player.cells.splice(i, 1);
            i--;
            break;
          }
        }
      }
    }
  }

  // eat food
  for (const player of state.players) {
    for (const cell of player.cells) {
      for (let i = state.food.length - 1; i >= 0; i--) {
        const f = state.food[i];
        if (distance(cell, f) < cell.radius) {
          cell.radius = massToRadius(cellMass(cell) + Math.PI * f.radius ** 2);
          state.food.splice(i, 1);
        }
      }
    }
  }

  // eat ejected mass
  for (const player of state.players) {
    for (const cell of player.cells) {
      for (let i = state.ejectedMass.length - 1; i >= 0; i--) {
        const em = state.ejectedMass[i];
        if (distance(cell, em) < cell.radius) {
          cell.radius = massToRadius(cellMass(cell) + Math.PI * em.radius ** 2);
          state.ejectedMass.splice(i, 1);
        }
      }
    }
  }

  // player eat player
  for (let i = 0; i < state.players.length; i++) {
    const p1 = state.players[i];
    for (let j = 0; j < state.players.length; j++) {
      if (i === j) continue;
      const p2 = state.players[j];
      for (const c1 of p1.cells) {
        for (let k = p2.cells.length - 1; k >= 0; k--) {
          const c2 = p2.cells[k];
          const d = distance(c1, c2);
          if (c1.radius > c2.radius * 1.1 && d < c1.radius - c2.radius * 0.4) {
            c1.radius = massToRadius(cellMass(c1) + cellMass(c2));
            p2.cells.splice(k, 1);
          }
        }
      }
    }
  }

  // remove dead players (no cells) and respawn bots
  for (let i = state.players.length - 1; i >= 0; i--) {
    const p = state.players[i];
    if (p.cells.length === 0) {
      if (i === 0) {
        // human died - will be handled by the component
      } else {
        // respawn bot
        state.players[i] = createPlayer(p.name, state.worldSize);
      }
    }
  }

  // replenish food
  while (state.food.length < GAME_CONFIG.FOOD_COUNT) {
    state.food.push(createFood(state.worldSize));
  }

  // mass decay for large cells
  for (const player of state.players) {
    for (const cell of player.cells) {
      if (cell.radius > GAME_CONFIG.DECAY_THRESHOLD) {
        cell.radius *= GAME_CONFIG.DECAY_RATE;
      }
    }
  }

  // update scores (only for alive players — preserve final score on death)
  for (const player of state.players) {
    if (player.cells.length > 0) {
      player.score = Math.floor(playerTotalMass(player));
    }
  }

  return state;
}
