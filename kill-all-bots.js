import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

async function killAllBotProcesses() {
  console.log('🔍 Scanning for and killing all bot-related processes...');
  
  try {
    // Kill all Node.js processes
    try {
      await execAsync('taskkill /f /im node.exe');
      console.log('✅ Killed all Node.js processes');
    } catch (e) {
      console.log('ℹ️ No Node.js processes found or already killed');
    }
    
    // Also check for any processes with "bot" in the name
    try {
      await execAsync('taskkill /f /fi "IMAGENAME eq *bot*"');
      console.log('✅ Killed any bot-related processes');
    } catch (e) {
      console.log('ℹ️ No bot-related processes found');
    }
    
    // Kill any processes with "telegram" in the name
    try {
      await execAsync('taskkill /f /fi "IMAGENAME eq *telegram*"');
      console.log('✅ Killed any telegram-related processes');
    } catch (e) {
      console.log('ℹ️ No telegram-related processes found');
    }
    
    console.log('🧹 Process cleanup complete!');
  } catch (error) {
    console.log('ℹ️ Process cleanup finished (some processes may have already been stopped)');
  }
}

async function verifyCleanState() {
  console.log('🔍 Verifying clean state...');
  
  try {
    const { stdout } = await execAsync('tasklist /fi "imagename eq node.exe" /fo csv');
    const processes = stdout.split('\n').filter(line => line.includes('node.exe'));
    
    if (processes.length === 0) {
      console.log('✅ Clean state verified - no Node.js processes running');
    } else {
      console.log(`⚠️ Found ${processes.length - 1} Node.js processes still running`);
      processes.forEach((proc, i) => {
        if (i > 0) console.log(`  - ${proc}`);
      });
    }
  } catch (error) {
    console.log('✅ Clean state verified - no Node.js processes found');
  }
}

async function main() {
  console.log('🧹 Starting complete process cleanup...\n');
  
  await killAllBotProcesses();
  await verifyCleanState();
  
  console.log('\n✅ Cleanup complete! You can now start a fresh bot instance.');
  console.log('🚀 Run: node ultra-clean-bot.mjs');
}

main().catch(console.error);