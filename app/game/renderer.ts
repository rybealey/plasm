import { GameState, Camera, Player, GAME_CONFIG } from "./types";

const GRID_SIZE = 50;
const GRID_COLOR = "rgba(0,0,0,0.08)";
const BG_COLOR = "#f0f0f0";

const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached) return cached.complete ? cached : null;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = url;
  imageCache.set(url, img);
  return null;
}

export function getCamera(player: Player, canvas: HTMLCanvasElement): Camera {
  if (player.cells.length === 0) {
    return { x: GAME_CONFIG.WORLD_SIZE / 2, y: GAME_CONFIG.WORLD_SIZE / 2, zoom: 1 };
  }

  let totalX = 0;
  let totalY = 0;
  let totalMass = 0;
  for (const cell of player.cells) {
    const mass = Math.PI * cell.radius * cell.radius;
    totalX += cell.x * mass;
    totalY += cell.y * mass;
    totalMass += mass;
  }

  const avgRadius =
    player.cells.reduce((s, c) => s + c.radius, 0) / player.cells.length;
  const zoom = Math.max(0.15, Math.min(1, 80 / avgRadius));

  return {
    x: totalX / totalMass,
    y: totalY / totalMass,
    zoom,
  };
}

export function render(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  state: GameState,
  camera: Camera,
) {
  const w = canvas.width;
  const h = canvas.height;

  // clear
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, w, h);

  ctx.save();

  // transform to camera space
  ctx.translate(w / 2, h / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // draw infinite grid
  drawGrid(ctx, camera, w, h);

  // draw food
  for (const f of state.food) {
    if (!isVisible(f.x, f.y, f.radius, camera, w, h)) continue;
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw ejected mass
  for (const em of state.ejectedMass) {
    const emGradient = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.radius);
    emGradient.addColorStop(0, em.colorFrom);
    emGradient.addColorStop(1, em.colorTo);
    ctx.fillStyle = emGradient;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(em.x, em.y, em.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // draw players (sorted by size, smallest first)
  const allCells: { cell: typeof state.players[0]["cells"][0]; player: Player }[] = [];
  for (const player of state.players) {
    for (const cell of player.cells) {
      allCells.push({ cell, player });
    }
  }
  allCells.sort((a, b) => a.cell.radius - b.cell.radius);

  for (const { cell, player } of allCells) {
    if (!isVisible(cell.x, cell.y, cell.radius, camera, w, h)) continue;

    // cell body - gradient border
    const gradient = ctx.createRadialGradient(
      cell.x, cell.y, 0,
      cell.x, cell.y, cell.radius,
    );
    gradient.addColorStop(0, cell.colorFrom);
    gradient.addColorStop(1, cell.colorTo);
    ctx.fillStyle = gradient;
    ctx.strokeStyle = darkenColor(cell.colorTo, 0.2);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // image skin overlay (inside border)
    if (cell.imgUrl) {
      const img = getCachedImage(cell.imgUrl);
      if (img) {
        const borderWidth = 3;
        const innerRadius = cell.radius - borderWidth;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, innerRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(
          img,
          cell.x - innerRadius,
          cell.y - innerRadius,
          innerRadius * 2,
          innerRadius * 2,
        );
        ctx.restore();
      }
    }

    // name and score
    if (cell.radius > 15) {
      const nameFontSize = Math.max(12, cell.radius * 0.5);
      const scoreFontSize = Math.max(9, cell.radius * 0.3);
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.lineWidth = 3;
      ctx.font = `bold ${nameFontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const nameY = cell.y - scoreFontSize * 0.4;
      ctx.strokeText(player.name, cell.x, nameY);
      ctx.fillText(player.name, cell.x, nameY);

      ctx.font = `${scoreFontSize}px sans-serif`;
      ctx.lineWidth = 2;
      const scoreY = nameY + nameFontSize * 0.8;
      ctx.strokeText(`${player.score}`, cell.x, scoreY);
      ctx.fillText(`${player.score}`, cell.x, scoreY);
    }
  }

  ctx.restore();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasW: number,
  canvasH: number,
) {
  const halfW = canvasW / 2 / camera.zoom;
  const halfH = canvasH / 2 / camera.zoom;
  const left = camera.x - halfW;
  const right = camera.x + halfW;
  const top = camera.y - halfH;
  const bottom = camera.y + halfH;

  const startX = Math.floor(left / GRID_SIZE) * GRID_SIZE;
  const endX = Math.ceil(right / GRID_SIZE) * GRID_SIZE;
  const startY = Math.floor(top / GRID_SIZE) * GRID_SIZE;
  const endY = Math.ceil(bottom / GRID_SIZE) * GRID_SIZE;

  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x <= endX; x += GRID_SIZE) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y <= endY; y += GRID_SIZE) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();
}


function isVisible(
  x: number,
  y: number,
  radius: number,
  camera: Camera,
  w: number,
  h: number,
): boolean {
  const screenX = (x - camera.x) * camera.zoom + w / 2;
  const screenY = (y - camera.y) * camera.zoom + h / 2;
  const screenR = radius * camera.zoom;
  return (
    screenX + screenR > 0 &&
    screenX - screenR < w &&
    screenY + screenR > 0 &&
    screenY - screenR < h
  );
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (num & 0xff) * (1 - amount));
  return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
}
