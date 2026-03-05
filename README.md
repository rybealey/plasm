<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-Auth%20%7C%20DB%20%7C%20Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Canvas-HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5 Canvas" />
</p>

# Plasm

A browser-based multiplayer cell-eating game built with Next.js, HTML5 Canvas, and Supabase. Grow your cell by consuming food and smaller players, split to attack, eject mass to feed allies, and climb the leaderboard.

---

## Features

### Gameplay
- **Real-time cell physics** — smooth movement, splitting with impulse force, mass ejection, and size-based speed scaling
- **Bot AI** — 15 bots that chase food, flee from larger players, and hunt smaller ones
- **Cell splitting** — press Space to split with a momentum-based launch; cells merge back after a cooldown
- **Mass ejection** — press W to eject mass in your movement direction
- **Leaderboard** — live top-10 leaderboard updated every 0.5s during gameplay
- **Mass decay** — large cells slowly shrink, keeping the game balanced

### Accounts & Economy
- **Magic link auth** — passwordless email login via Supabase Auth
- **Guest play** — jump into a game without an account
- **Coin economy** — earn coins through gameplay, spend them in the skin store
- **Player stats** — tracks games played, highest score, and coin balance

### Skins & Customization
- **Skin store** — browse and purchase gradient skins with coins
- **Inventory management** — equip/unequip owned skins from the inventory tab
- **In-game rendering** — equipped skins render as radial gradients on your cell, split cells, and ejected mass
- **Image skins** — skins with image URLs render inside the cell with a gradient border
- **Purchase flow** — confirmation modal with balance validation and error toasts

### Social
- **Real-time chat** — in-game chat window powered by Supabase Realtime Broadcast
- **Presence tracking** — live player count in the chat header via Supabase Presence
- **Friends page** — placeholder for upcoming friend system

### UI/UX
- **Dark theme** — fully dark UI built with shadcn/ui components and Tailwind CSS
- **Responsive sidebar** — navigation with dashboard, skins, and friends
- **Toast notifications** — error/success feedback via Sonner with custom dark styling
- **Keyboard shortcuts** — Cmd+K (Ctrl+K) to focus chat input during gameplay

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Rendering | HTML5 Canvas (2D context) |
| Auth & Database | Supabase (Auth, PostgreSQL, Realtime) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Notifications | Sonner |
| Icons | Lucide React |

---

## Project Structure

```
app/
  page.tsx              # Login page (magic link + guest)
  layout.tsx            # Root layout with dark theme
  auth/
    callback/           # Supabase auth callback handler
    confirm/            # Email confirmation route
  profile/page.tsx      # Dashboard with stats, matches, friends
  skins/page.tsx        # Skin store & inventory management
  friends/page.tsx      # Friends placeholder page
  start/page.tsx        # Game lobby (name input, play button)
  game/
    Game.tsx             # Main game component (canvas + loop)
    engine.ts            # Game physics, AI, splitting, merging
    renderer.ts          # Canvas rendering (cells, food, gradients)
    Leaderboard.tsx      # In-game leaderboard overlay
    types.ts             # Type definitions & game config

components/
  sidebar.tsx            # Navigation sidebar with skin preview
  chat-window.tsx        # Real-time chat (Supabase Broadcast)
  purchase-modal.tsx     # Skin purchase confirmation modal
  back-button.tsx        # Navigation back button
  ui/                    # shadcn/ui primitives (button, input, card, etc.)

lib/
  supabase/
    client.ts            # Browser Supabase client
    server.ts            # Server Supabase client
    middleware.ts         # Session refresh middleware
```

---

## Database Schema

### `skins`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Skin identifier |
| `name` | text | Display name |
| `hex_from` | text | Gradient start color |
| `hex_to` | text | Gradient end color |
| `img_url` | text (nullable) | Optional image URL |
| `price` | integer | Cost in coins |

### `inventories`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Inventory entry ID |
| `user_id` | UUID (FK) | References auth.users |
| `skin_id` | UUID (FK) | References skins |
| `equipped` | boolean | Whether this skin is active |
| `purchased_at` | timestamptz | Purchase timestamp |

Both tables have Row Level Security (RLS) policies scoped to the authenticated user.

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone & Install

```bash
git clone <repo-url>
cd agar
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup

Run the following SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Skins table
create table skins (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  hex_from text not null default '#aeaeae',
  hex_to text not null default '#aeaeae',
  img_url text,
  price integer not null default 0
);

alter table skins enable row level security;
create policy "Anyone can read skins" on skins for select using (true);

-- Inventories table
create table inventories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  skin_id uuid references skins not null,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now()
);

alter table inventories enable row level security;
create policy "Users can read own inventory" on inventories for select using (auth.uid() = user_id);
create policy "Users can insert own inventory" on inventories for insert with check (auth.uid() = user_id);
create policy "Users can update own inventory" on inventories for update using (auth.uid() = user_id);
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Game Controls

| Key | Action |
|---|---|
| Mouse | Move cell toward cursor |
| Space | Split cell |
| W | Eject mass |
| Cmd+K / Ctrl+K | Focus chat input |

---

## License

MIT
