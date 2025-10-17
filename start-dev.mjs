import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting The Golden Glow development environment...\n');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

// Start Vite dev server
console.log(`${colors.cyan}[VITE]${colors.reset} Starting frontend dev server...`);
const vite = spawn('npm', ['run', 'dev:frontend'], {
  cwd: __dirname,
  shell: true,
  stdio: 'pipe',
});

vite.stdout.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.log(`${colors.cyan}[VITE]${colors.reset} ${output}`);
  }
});

vite.stderr.on('data', (data) => {
  const output = data.toString().trim();
  if (output) {
    console.error(`${colors.cyan}[VITE ERROR]${colors.reset} ${output}`);
  }
});

// Wait a bit before starting the bot
setTimeout(() => {
  console.log(`${colors.magenta}[BOT]${colors.reset} Starting Telegram bot...`);
  
  const bot = spawn('npm', ['run', 'dev:bot'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe',
  });

  bot.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${colors.magenta}[BOT]${colors.reset} ${output}`);
    }
  });

  bot.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`${colors.magenta}[BOT ERROR]${colors.reset} ${output}`);
    }
  });

  bot.on('close', (code) => {
    console.log(`${colors.yellow}[BOT]${colors.reset} Process exited with code ${code}`);
  });

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Stopping all services...${colors.reset}`);
    vite.kill();
    bot.kill();
    process.exit(0);
  });
}, 2000);

vite.on('close', (code) => {
  console.log(`${colors.yellow}[VITE]${colors.reset} Process exited with code ${code}`);
});

console.log(`\n${colors.green}✓ Services starting...${colors.reset}`);
console.log(`${colors.yellow}➜ Frontend:${colors.reset} http://localhost:3000`);
console.log(`${colors.yellow}➜ Telegram:${colors.reset} Bot running in background`);
console.log(`${colors.yellow}➜ Press Ctrl+C to stop all services${colors.reset}\n`);
