# Development Setup

## Running the Project with Telegram Bot

I've configured the project to automatically run both the Vite dev server and the Telegram bot when you start development.

### Quick Start

Simply run:
```bash
npm run dev
```

This will automatically start:
- **Vite Frontend Dev Server** on `http://localhost:3000`
- **Telegram Bot** (using Telegraf) in the background

### Individual Commands

If you need to run services separately:

```bash
# Run only the frontend
npm run dev:frontend

# Run only the Telegram bot
npm run dev:bot

# Run backend server (separate terminal)
npm run start
```

### Available Scripts

- `npm run dev` - Starts both Vite and Telegram bot together
- `npm run dev:frontend` - Starts only Vite dev server
- `npm run dev:bot` - Starts only Telegram bot
- `npm run start` - Starts Express backend server
- `npm run bot:launch` - Alternative way to start Telegram bot
- `npm run bot:poll` - Start Telegram bot with polling runner

### How It Works

The `npm run dev` command runs the `start-dev.mjs` script which:
1. Spawns the Vite dev server process
2. Waits 2 seconds for Vite to initialize
3. Spawns the Telegram bot process
4. Shows color-coded output from both processes
5. Handles graceful shutdown when you press Ctrl+C

### Output Colors

- **Cyan [VITE]** - Frontend dev server messages
- **Magenta [BOT]** - Telegram bot messages

### Stopping Services

Press `Ctrl+C` in the terminal to stop all services gracefully.

### Environment Variables

Make sure you have your `.env` or `.env.local` file configured with:
- `TELEGRAM_BOT_TOKEN` or `VITE_TELEGRAM_BOT_TOKEN` - Your Telegram bot token
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key

### Full Stack Development

For complete full-stack development (frontend + backend + bot), you'll need:

**Terminal 1:**
```bash
npm run start
```

**Terminal 2:**
```bash
npm run dev
```

This will give you:
- Backend API on `http://localhost:3001`
- Frontend on `http://localhost:3000`
- Telegram bot running in background
