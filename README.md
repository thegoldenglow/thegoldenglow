# React + Vite Template

A modern React template for web applications and games, featuring React 18, Vite, TailwindCSS, and Material UI.

## Project Structure

```
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   └── index.css        # Global styles (Tailwind)
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
├── postcss.config.js    # PostCSS configuration
└── eslint.config.js     # ESLint configuration
```

## Development Guidelines

- Modify `index.html` and `src/App.jsx` as needed
- Create new folders or files in `src/` directory as needed
- Style components using TailwindCSS utility classes
- Avoid modifying `src/main.jsx` and `src/index.css`
- Only modify `vite.config.js` if absolutely necessary

## Available Scripts
- `pnpm install` - Install dependencies (Recommended package manager)
- `pnpm run dev` - Start development server
- `pnpm run build` - Build the project for production
- `pnpm run lint` - Lint source files
- `pnpm run preview` - Preview the production build locally
- `pnpm run migrate` - Run database migrations (if applicable)

## Tech Stack

- React
- Vite
- TailwindCSS
- Material UI
- ESLint
- Javascript
- Supabase (Database, Auth, Storage)

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [database.new](https://database.new) and create a new Supabase project
2. Wait for your database to be created

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase dashboard under Settings > API.

### 3. MCP Integration for Cursor

This project includes MCP (Model Context Protocol) configuration for Cursor. To use it:

1. Create a personal access token in your Supabase dashboard under Account > Access Tokens
2. Replace `<personal-access-token>` in `.cursor/mcp.json` with your token
3. Restart Cursor to apply the changes

Now you can use Cursor's AI features to interact with your Supabase project!
