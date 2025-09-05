# The Golden Glow

A modern React + Vite application with an admin panel and a Node/Express backend. It integrates with Supabase for authentication, database, and storage, supports Telegram authentication verification, real-time gameplay via Socket.IO, and includes a modular tasks/rewards system with comprehensive tests.

## Project Description

This project is a full-featured web app and mini-game hub built with React 18 and Vite on the frontend, and Express + Socket.IO on the backend. It supports:

- User authentication and profiles via Supabase
- Tasks and rewards tracking with local fallback when Supabase is unavailable
- Telegram authentication validation through a secure server API endpoint
- Real-time gameplay rooms (e.g., Tic-Tac-Toe) via Socket.IO
- An admin interface available at /admin for management tasks

The repository also contains migration utilities, scripts to manage Supabase schema, and an automated test suite powered by Vitest.

## Installation

### Prerequisites
- Node.js >= 18
- npm, pnpm, or yarn (examples below use npm)
- Optional: A Supabase project (for full functionality)

### Steps
1. Clone the repository
   ```bash
   git clone https://github.com/thegoldenglow/thegoldenglow.git
   cd thegoldenglow
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Configure environment variables (see Configuration Options below)
   - Copy .env.example to .env or .env.local and fill in values

## Usage

### Development
Run the frontend (Vite) on port 3000 with a proxy to the backend:
```bash
npm run dev
```
Run the backend (Express + Socket.IO) on port 3001:
```bash
npm run start
```
Notes:
- The Vite dev server proxies API requests at /api to http://localhost:3001.
- The admin UI is available at http://localhost:3000/admin in development.

### Tests
Run the test suite (Vitest):
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Build and Preview
Build production assets:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

### Production Server
After building, serve the app with the Express server:
```bash
npm run build
npm run start
```
This serves static files from dist/ and exposes:
- Frontend at /
- Admin at /admin
- API at /api (e.g., /api/validate-telegram-auth)

### Database Migrations (optional)
If you use Supabase and migrations in this repo:
```bash
npm run migrate
```

## Configuration Options

Create a .env or .env.local file in the project root. Values below come from .env.example and server requirements.

Frontend (Vite) variables:
- VITE_SUPABASE_URL: Your Supabase project URL
- VITE_SUPABASE_ANON_KEY: Your Supabase anon API key
- VITE_TELEGRAM_BOT_TOKEN: Your Telegram bot token (used by some frontend features)
- VITE_WALLETCONNECT_PROJECT_ID: WalletConnect Cloud project ID

Backend (Node/Express) variables:
- TELEGRAM_BOT_TOKEN: Telegram bot token required by /api/validate-telegram-auth

Supabase (for migrations):
- VITE_SUPABASE_SERVICE_ROLE_KEY: Service Role key used by migration scripts (npm run migrate).
  - Important: Never expose the Service Role key to the client. Keep it only in server-side environments like .env.local and do not commit it.

Additional notes:
- If Supabase is not configured, the app supports a “guest mode” for certain features. Some actions will be limited or stored locally until Supabase becomes available.
- The dev server runs on port 3000 by default; the backend attempts port 3001 (and will increment if busy).

## Usage Examples

- Start full-stack development (two terminals):
  ```bash
  # Terminal 1
  npm run start
  # Terminal 2
  npm run dev
  ```
- Run tests:
  ```bash
  npm test
  ```
- Build and serve production:
  ```bash
  npm run build
  npm run start
  ```
- Access admin panel:
  - Development: http://localhost:3000/admin
  - Production (via server.js): http://<host>/admin

## Contribution Guidelines

We welcome contributions! To get started:
1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes and add tests where appropriate
3. Ensure lint and tests pass:
   ```bash
   npm run lint
   npm test
   ```
4. Use clear commit messages (Conventional Commits are encouraged, e.g., feat:, fix:, chore:)
5. Submit a Pull Request with a clear description of changes and rationale

### Code Style
- ESLint and Prettier are configured. Run `npm run lint` before opening a PR.
- Keep components modular and prefer existing patterns/utilities found in src/.

## License

Specify your license here (e.g., MIT). If you add a LICENSE file to the repository, reference it in this section so users can review the full terms.
